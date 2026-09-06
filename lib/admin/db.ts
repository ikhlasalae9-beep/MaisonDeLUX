import { Pool, QueryResult, QueryResultRow } from 'pg';

const TABLE = 'public.estimation_events';
type Queryable = { query: <T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) => Promise<QueryResult<T>> };
let pool: Queryable | null = null;
let poolConnectionString: string | null = null;

export type DatabaseErrorCode = 'DB_NOT_CONFIGURED' | 'DB_CONNECTION_FAILED' | 'DB_PERMISSION_DENIED' | 'DB_SCHEMA_MISSING' | 'DB_QUERY_FAILED';

function connectionString() {
  const value = process.env.POSTGRES_URL?.trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:') && parsed.hostname ? value : null;
  } catch { return null; }
}

export function databaseConfigured() { return connectionString() !== null; }

export function databaseMetadata() {
  const value = connectionString();
  if (!value) return { provider: 'unconfigured', source: null, poolerDetected: false, port: null };
  const url = new URL(value);
  return { provider: url.hostname.endsWith('.supabase.com') ? 'supabase' : 'postgresql', source: 'POSTGRES_URL',
    poolerDetected: url.hostname.includes('.pooler.supabase.com'), port: url.port ? Number(url.port) : 5432 };
}

export function getDatabasePool() {
  const value = connectionString();
  if (!value) return null;
  if (!pool || poolConnectionString !== value) {
    pool = new Pool({ connectionString: value, max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000,
      allowExitOnIdle: true, ssl: { rejectUnauthorized: false } });
    poolConnectionString = value;
  }
  return pool;
}

function postgresCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}

function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown database error';
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[REDACTED_POSTGRES_URL]').slice(0, 240);
}

export function classifyDatabaseError(error: unknown): DatabaseErrorCode {
  const code = postgresCode(error);
  if (code === '42501') return 'DB_PERMISSION_DENIED';
  if (code === '42P01' || code === '3F000') return 'DB_SCHEMA_MISSING';
  if (code?.startsWith('08') || ['28P01', '3D000', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(code || '')) return 'DB_CONNECTION_FAILED';
  return 'DB_QUERY_FAILED';
}

export function logDatabaseError(code: DatabaseErrorCode, error?: unknown, context?: string) {
  console.error(code, { context, postgresCode: postgresCode(error), message: error ? safeMessage(error) : undefined, ...databaseMetadata() });
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  const db = getDatabasePool();
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  try { return await db.query<T>(text, values); }
  catch (error) { logDatabaseError(classifyDatabaseError(error), error, 'analyticsQuery'); throw error; }
}

export async function databaseHealth() {
  const metadata = databaseMetadata();
  const base = { configured: databaseConfigured(), provider: metadata.provider, source: metadata.source,
    poolerDetected: metadata.poolerDetected, port: metadata.port, table: TABLE };
  const db = getDatabasePool();
  if (!db) return { ...base, connected: false, schemaReady: false, errorCode: 'DB_NOT_CONFIGURED' as const };
  try { await db.query('SELECT 1'); }
  catch (error) {
    logDatabaseError('DB_CONNECTION_FAILED', error, 'databaseHealth.connect');
    return { ...base, connected: false, schemaReady: false, errorCode: 'DB_CONNECTION_FAILED' as const };
  }
  let tableName: string | null;
  try {
    const table = await db.query<{ table_name: string | null }>("SELECT to_regclass('public.estimation_events') AS table_name");
    tableName = table.rows[0]?.table_name || null;
  } catch (error) {
    const errorCode = classifyDatabaseError(error);
    logDatabaseError(errorCode, error, 'databaseHealth.tableCheck');
    return { ...base, connected: true, schemaReady: false, errorCode };
  }
  if (!tableName) return { ...base, connected: true, schemaReady: false, errorCode: 'DB_SCHEMA_MISSING' as const };
  try {
    const count = await db.query<{ row_count: number }>(`SELECT COUNT(*)::int AS row_count FROM ${TABLE}`);
    return { ...base, connected: true, schemaReady: true, rowCount: Number(count.rows[0]?.row_count || 0) };
  } catch (error) {
    logDatabaseError('DB_QUERY_FAILED', error, 'databaseHealth.rowCount');
    return { ...base, connected: true, schemaReady: true, errorCode: 'DB_QUERY_FAILED' as const };
  }
}

/** Test-only hook for deterministic database integration tests. */
export function setDatabasePoolForTests(testPool: Queryable | null) {
  pool = testPool;
  poolConnectionString = testPool ? connectionString() : null;
}
