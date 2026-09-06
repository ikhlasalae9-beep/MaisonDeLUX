import { Pool, QueryResultRow } from 'pg';

let pool: Pool | null = null;
let initialized = false;

export function databaseConfigured() { return Boolean(process.env.DATABASE_URL); }

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
  return pool;
}

export async function ensureAnalyticsSchema() {
  const db = getPool();
  if (!db || initialized) return Boolean(db);
  await db.query(`CREATE TABLE IF NOT EXISTS estimation_events (
    id BIGSERIAL PRIMARY KEY, event_key TEXT UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    region TEXT NOT NULL, city TEXT NOT NULL, neighborhood TEXT, property_type TEXT NOT NULL,
    surface_m2 NUMERIC NOT NULL, bedrooms INTEGER, bathrooms INTEGER, parking TEXT, balcony TEXT,
    sea_view TEXT, furnished_status TEXT, estimated_price_mad NUMERIC NOT NULL,
    model_version TEXT, locale TEXT
  );
  CREATE INDEX IF NOT EXISTS estimation_events_created_at_idx ON estimation_events(created_at);
  CREATE INDEX IF NOT EXISTS estimation_events_region_idx ON estimation_events(region);
  CREATE INDEX IF NOT EXISTS estimation_events_city_idx ON estimation_events(city);`);
  initialized = true;
  return true;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  const db = getPool();
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  await ensureAnalyticsSchema();
  return db.query<T>(text, values);
}
