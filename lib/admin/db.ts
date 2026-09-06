import { Pool, QueryResult, QueryResultRow } from 'pg';

const TABLE = 'public.estimation_events';
type Queryable = { query: <T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) => Promise<QueryResult<T>> };
let pool: Queryable | null = null;
let activeUrl: string | null = null;

function databaseUrl() {
  const value = process.env.POSTGRES_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return (url.protocol === 'postgres:' || url.protocol === 'postgresql:') && url.hostname ? value : null;
  } catch { return null; }
}

export function databaseConfigured() { return databaseUrl() !== null; }

function metadata() {
  const value = databaseUrl();
  if (!value) return { provider: 'supabase', source: 'POSTGRES_URL', poolerDetected: false, port: null };
  const url = new URL(value);
  return { provider: 'supabase', source: 'POSTGRES_URL', poolerDetected: url.hostname.includes('.pooler.supabase.com'),
    port: url.port ? Number(url.port) : 5432 };
}

export function getDatabasePool() {
  const value = databaseUrl();
  if (!value) return null;
  if (!pool || activeUrl !== value) {
    const parsed = new URL(value);
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('sslcert');
    parsed.searchParams.delete('sslkey');
    parsed.searchParams.delete('sslrootcert');
    pool = new Pool({ connectionString: parsed.toString(), max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000,
      allowExitOnIdle: true, ssl: { rejectUnauthorized: false } });
    activeUrl = value;
  }
  return pool;
}

function safeError(error: unknown) {
  const candidate = error as { code?: string; message?: string };
  return { code: candidate?.code, message: candidate?.message?.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[REDACTED_POSTGRES_URL]').slice(0, 240) };
}

export function logDatabaseError(context: string, error?: unknown) {
  console.error('DB_QUERY_FAILED', { context, ...safeError(error), ...metadata() });
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  const db = getDatabasePool();
  if (!db) throw new Error('DB_NOT_CONFIGURED');
  try { return await db.query<T>(text, values); }
  catch (error) { logDatabaseError('analyticsQuery', error); throw error; }
}

export async function databaseHealth() {
  const base = { configured: databaseConfigured(), connected: false, ...metadata(), schemaReady: false, table: TABLE, rowCount: 0 };
  const db = getDatabasePool();
  if (!db) return { ...base, errorCode: 'DB_NOT_CONFIGURED' };
  try { await db.query('SELECT 1'); }
  catch (error) { logDatabaseError('databaseHealth.connect', error); return { ...base, errorCode: 'DB_CONNECTION_FAILED' }; }
  let tableName: string | null;
  try {
    const result = await db.query<{ table_name: string | null }>("SELECT to_regclass('public.estimation_events') AS table_name");
    tableName = result.rows[0]?.table_name || null;
  } catch (error) { logDatabaseError('databaseHealth.table', error); return { ...base, connected: true, errorCode: 'DB_QUERY_FAILED' }; }
  if (!tableName) return { ...base, connected: true, errorCode: 'DB_SCHEMA_MISSING' };
  try {
    const result = await db.query<{ row_count: number }>(`SELECT COUNT(*)::int AS row_count FROM ${TABLE}`);
    return { ...base, connected: true, schemaReady: true, rowCount: Number(result.rows[0]?.row_count || 0) };
  } catch (error) { logDatabaseError('databaseHealth.count', error); return { ...base, connected: true, schemaReady: true, errorCode: 'DB_QUERY_FAILED' }; }
}

export function setDatabasePoolForTests(testPool: Queryable | null) {
  pool = testPool;
  activeUrl = testPool ? databaseUrl() : null;
}
