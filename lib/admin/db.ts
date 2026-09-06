import { Pool, QueryResultRow } from 'pg';

const DATABASE_ENV_KEYS = ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL'] as const;
const TABLE = 'public.estimation_events';
let pool: Pool | null = null;
let poolUrl: string | null = null;
let initialized = false;
let initialization: Promise<boolean> | null = null;

export type DatabaseErrorCode = 'DB_NOT_CONFIGURED' | 'DB_CONNECTION_FAILED' | 'DB_PERMISSION_DENIED' | 'DB_SCHEMA_MISSING' | 'DB_QUERY_FAILED';
type DatabaseEnvSource = typeof DATABASE_ENV_KEYS[number];

function resolveDatabaseConfig(): { url: string; source: DatabaseEnvSource } | null {
  for (const source of DATABASE_ENV_KEYS) {
    const value = process.env[source]?.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if ((url.protocol === 'postgres:' || url.protocol === 'postgresql:') && url.hostname) return { url: value, source };
    } catch { /* Try the next integration variable. */ }
  }
  return null;
}

export function resolveDatabaseUrl() {
  return resolveDatabaseConfig()?.url || null;
}

export function databaseConfigured() { return resolveDatabaseUrl() !== null; }

export function databaseMetadata() {
  const config = resolveDatabaseConfig();
  if (!config) return { provider: 'unconfigured', source: null, hostPresent: false, poolerDetected: false, port: null, databaseConfigured: false };
  const url = new URL(config.url);
  return { provider: url.hostname.endsWith('.supabase.com') ? 'supabase' : 'postgresql', source: config.source, hostPresent: Boolean(url.hostname),
    poolerDetected: url.hostname.includes('.pooler.supabase.com'), port: url.port ? Number(url.port) : 5432,
    databaseConfigured: Boolean(url.pathname && url.pathname !== '/') };
}

function getPool() {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) return null;
  if (!pool || poolUrl !== connectionString) {
    pool = new Pool({ connectionString, max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000, allowExitOnIdle: true,
      ssl: process.env.NODE_ENV === 'production' || new URL(connectionString).hostname.endsWith('.supabase.com')
        ? { rejectUnauthorized: false } : undefined });
    poolUrl = connectionString;
    initialized = false;
  }
  return pool;
}

function postgresCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}

function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown database error';
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[REDACTED_DATABASE_URL]').slice(0, 240);
}

export function logDatabaseError(code: DatabaseErrorCode, error?: unknown, context?: string) {
  console.error(code, { context, postgresCode: postgresCode(error), message: error ? safeMessage(error) : undefined, ...databaseMetadata() });
}

export function classifyDatabaseError(error: unknown): DatabaseErrorCode {
  const code = postgresCode(error);
  if (code === '42501') return 'DB_PERMISSION_DENIED';
  if (code === '42P01' || code === '3F000') return 'DB_SCHEMA_MISSING';
  if (code?.startsWith('08') || ['28P01', '3D000', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(code || '')) return 'DB_CONNECTION_FAILED';
  return 'DB_QUERY_FAILED';
}

export async function ensureAnalyticsSchema() {
  const db = getPool();
  if (!db) return false;
  if (initialized) return true;
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      const result = await db.query<{ schema_ready: boolean }>(`SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'estimation_events'
      ) AS schema_ready`);
      if (result.rows[0]?.schema_ready !== true) {
        const error = new Error('Required analytics schema is missing');
        Object.assign(error, { code: '42P01' });
        throw error;
      }
      initialized = true;
      return true;
    } catch (error) {
      initialized = false;
      logDatabaseError(classifyDatabaseError(error), error, 'ensureAnalyticsSchema');
      throw error;
    } finally { initialization = null; }
  })();
  return initialization;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  const db = getPool();
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  await ensureAnalyticsSchema();
  try { return await db.query<T>(text, values); }
  catch (error) { logDatabaseError(classifyDatabaseError(error), error, 'analyticsQuery'); throw error; }
}

export async function databaseHealth() {
  const metadata = databaseMetadata();
  if (!databaseConfigured()) return { configured: false, connected: false, provider: metadata.provider, schemaReady: false,
    source: metadata.source, poolerDetected: metadata.poolerDetected, port: metadata.port,
    table: TABLE, errorCode: 'DB_NOT_CONFIGURED' };
  const db = getPool()!;
  try {
    await db.query('SELECT 1');
    const identity = await db.query<{ database: string; current_role: string; schema_ready: boolean }>(`SELECT
      current_database() AS database,
      current_user AS current_role,
      EXISTS (SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'estimation_events') AS schema_ready`);
    const details = identity.rows[0];
    if (details?.schema_ready !== true) return { configured: true, connected: true, provider: metadata.provider,
      source: metadata.source, poolerDetected: metadata.poolerDetected, port: metadata.port, database: details?.database,
      currentRole: details?.current_role, schemaReady: false, table: TABLE, errorCode: 'DB_SCHEMA_MISSING' };
    const count = await db.query<{ row_count: number }>(`SELECT COUNT(*)::int AS row_count FROM ${TABLE}`);
    initialized = true;
    return { configured: true, connected: true, provider: metadata.provider, source: metadata.source,
      poolerDetected: metadata.poolerDetected, port: metadata.port, database: details.database,
      currentRole: details.current_role, schemaReady: true, table: TABLE, rowCount: Number(count.rows[0]?.row_count || 0) };
  } catch (error) {
    const errorCode = classifyDatabaseError(error);
    logDatabaseError(errorCode, error, 'databaseHealth');
    return { configured: true, connected: errorCode !== 'DB_CONNECTION_FAILED', provider: metadata.provider,
      source: metadata.source, poolerDetected: metadata.poolerDetected, port: metadata.port,
      schemaReady: false, table: TABLE, errorCode };
  }
}
