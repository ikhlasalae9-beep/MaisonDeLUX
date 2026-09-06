import { Pool, QueryResultRow } from 'pg';

const DATABASE_ENV_KEYS = ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL'] as const;
const TABLE = 'public.estimation_events';
let pool: Pool | null = null;
let poolUrl: string | null = null;
let initialized = false;
let initialization: Promise<boolean> | null = null;

export type DatabaseErrorCode = 'DB_NOT_CONFIGURED' | 'DB_CONNECTION_FAILED' | 'DB_SCHEMA_INIT_FAILED' | 'DB_SCHEMA_MISSING' | 'DB_QUERY_FAILED';

export function resolveDatabaseUrl() {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if ((url.protocol === 'postgres:' || url.protocol === 'postgresql:') && url.hostname) return value;
    } catch { /* Try the next integration variable. */ }
  }
  return null;
}

export function databaseConfigured() { return resolveDatabaseUrl() !== null; }

export function databaseMetadata() {
  const value = resolveDatabaseUrl();
  if (!value) return { provider: 'unconfigured', hostPresent: false, poolerDetected: false, port: null, databaseConfigured: false };
  const url = new URL(value);
  return { provider: url.hostname.endsWith('.supabase.com') ? 'supabase' : 'postgresql', hostPresent: Boolean(url.hostname),
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
  if (code === '42P01' || code === '3F000') return 'DB_SCHEMA_MISSING';
  if (code?.startsWith('08') || ['28P01', '3D000', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(code || '')) return 'DB_CONNECTION_FAILED';
  return 'DB_QUERY_FAILED';
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS ${TABLE} (
    id BIGSERIAL PRIMARY KEY, event_key TEXT UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    region TEXT NOT NULL, city TEXT NOT NULL, neighborhood TEXT, property_type TEXT NOT NULL,
    surface_m2 NUMERIC NOT NULL, bedrooms INTEGER, bathrooms INTEGER, parking TEXT, balcony TEXT,
    sea_view TEXT, furnished_status TEXT, estimated_price_mad NUMERIC NOT NULL, model_version TEXT, locale TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS estimation_events_created_at_idx ON ${TABLE}(created_at)`,
  `CREATE INDEX IF NOT EXISTS estimation_events_region_idx ON ${TABLE}(region)`,
  `CREATE INDEX IF NOT EXISTS estimation_events_city_idx ON ${TABLE}(city)`,
];

export async function ensureAnalyticsSchema() {
  const db = getPool();
  if (!db) return false;
  if (initialized) return true;
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      for (const statement of schemaStatements) await db.query(statement);
      initialized = true;
      return true;
    } catch (error) {
      initialized = false;
      logDatabaseError(postgresCode(error)?.startsWith('08') ? 'DB_CONNECTION_FAILED' : 'DB_SCHEMA_INIT_FAILED', error, 'ensureAnalyticsSchema');
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
    table: TABLE, errorCode: 'DB_NOT_CONFIGURED' };
  try {
    await ensureAnalyticsSchema();
    const result = await query<{ schema_ready: boolean; row_count: number }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estimation_events') AS schema_ready,
        (SELECT COUNT(*)::int FROM ${TABLE}) AS row_count`);
    return { configured: true, connected: true, provider: metadata.provider, schemaReady: result.rows[0]?.schema_ready === true,
      table: TABLE, rowCount: Number(result.rows[0]?.row_count || 0) };
  } catch (error) {
    const errorCode = classifyDatabaseError(error);
    logDatabaseError(errorCode, error, 'databaseHealth');
    return { configured: true, connected: errorCode !== 'DB_CONNECTION_FAILED', provider: metadata.provider,
      schemaReady: false, table: TABLE, errorCode };
  }
}
