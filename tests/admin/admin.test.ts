import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { createSessionToken, validateCredentials, verifySessionToken } from '../../lib/admin/auth';
import { getOverview, logEstimation, periodDays } from '../../lib/admin/analytics';
import { classifyDatabaseError, databaseConfigured, databaseMetadata, setDatabasePoolForTests } from '../../lib/admin/db';
import { middleware } from '../../middleware';
import { GET as report } from '../../app/api/admin/report/route';
import { POST as login } from '../../app/api/admin/login/route';
import { POST as logout } from '../../app/api/admin/logout/route';
import { GET as dbHealth } from '../../app/api/admin/db-health/route';
import { POST as analyticsEvent } from '../../app/api/analytics/events/route';

const original = { ...process.env };
test.beforeEach(() => {
  setDatabasePoolForTests(null);
  process.env.ADMIN_EMAIL = 'admin@maison-delux.com';
  process.env.ADMIN_PASSWORD = 'local-test-password';
  process.env.ADMIN_SESSION_SECRET = '0123456789abcdef0123456789abcdef';
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_PRISMA_URL;
});
test.after(() => { process.env = original; });

test('authentication accepts valid credentials and rejects invalid credentials', async () => {
  assert.equal(validateCredentials('admin@maison-delux.com', 'local-test-password'), true);
  assert.equal(validateCredentials('admin@maison-delux.com', 'wrong-password'), false);
  assert.equal(await verifySessionToken(await createSessionToken('admin@maison-delux.com')), true);
});

test('login endpoint sets a secure session only for valid credentials', async () => {
  const valid = await login(new NextRequest('http://localhost/api/admin/login', { method: 'POST',
    body: JSON.stringify({ email: 'admin@maison-delux.com', password: 'local-test-password' }) }));
  assert.equal(valid.status, 200); assert.match(valid.headers.get('set-cookie') || '', /HttpOnly/);
  const invalid = await login(new NextRequest('http://localhost/api/admin/login', { method: 'POST',
    body: JSON.stringify({ email: 'admin@maison-delux.com', password: 'invalid' }) }));
  assert.equal(invalid.status, 401); assert.equal((await invalid.json()).error, 'Identifiants invalides.');
});

test('logout invalidates the session cookie', async () => {
  const response = await logout();
  assert.match(response.headers.get('set-cookie') || '', /Max-Age=0/);
});

test('protected admin API returns 401 without a session', async () => {
  const response = await middleware(new NextRequest('http://localhost/api/admin/overview'));
  assert.equal(response.status, 401);
});

test('protected admin API accepts a signed session', async () => {
  const token = await createSessionToken('admin@maison-delux.com');
  const response = await middleware(new NextRequest('http://localhost/api/admin/overview', { headers: { cookie: `maisondelux_admin=${token}` } }));
  assert.equal(response.status, 200);
});

test('analytics logging is safely disabled without POSTGRES_URL', async () => {
  assert.equal(await logEstimation({}), false);
  assert.deepEqual(periodDays, { today: 1, '7d': 7, '30d': 30, '90d': 90, all: null });
});

test('database connection uses only POSTGRES_URL', () => {
  process.env.POSTGRES_PRISMA_URL = 'postgresql://user:secret@project.pooler.supabase.com:6543/postgres';
  process.env.DATABASE_URL = 'postgresql://user:secret@legacy.pooler.supabase.com:6543/postgres';
  assert.equal(databaseConfigured(), false);
  process.env.POSTGRES_URL = 'postgres://user:secret@official.pooler.supabase.com:6543/postgres';
  assert.equal(databaseConfigured(), true);
  assert.deepEqual(databaseMetadata(), { provider: 'supabase', source: 'POSTGRES_URL', poolerDetected: true, port: 6543 });
});

test('database errors distinguish permissions, schema, authentication, and queries', () => {
  assert.equal(classifyDatabaseError(Object.assign(new Error('denied'), { code: '42501' })), 'DB_PERMISSION_DENIED');
  assert.equal(classifyDatabaseError(Object.assign(new Error('missing'), { code: '42P01' })), 'DB_SCHEMA_MISSING');
  assert.equal(classifyDatabaseError(Object.assign(new Error('auth'), { code: '28P01' })), 'DB_CONNECTION_FAILED');
  assert.equal(classifyDatabaseError(Object.assign(new Error('other'), { code: '22000' })), 'DB_QUERY_FAILED');
});

test('analytics rejects an event missing a required database field', async () => {
  const response = await analyticsEvent(new NextRequest('http://localhost/api/analytics/events', { method: 'POST',
    body: JSON.stringify({ region: 'Rabat-Salé-Kénitra', city: 'Rabat', surface_m2: 90, estimated_price_mad: 1_000_000 }) }));
  assert.equal(response.status, 400);
});

test('db-health rejects unauthorized requests and returns safe diagnostics when authorized', async () => {
  const unauthorized = await dbHealth(new NextRequest('http://localhost/api/admin/db-health'));
  assert.equal(unauthorized.status, 401);
  const token = await createSessionToken('admin@maison-delux.com');
  const authorized = await dbHealth(new NextRequest('http://localhost/api/admin/db-health',
    { headers: { cookie: `maisondelux_admin=${token}` } }));
  assert.equal(authorized.status, 503);
  assert.deepEqual(await authorized.json(), { configured: false, connected: false, provider: 'unconfigured', source: null,
    poolerDetected: false, port: null, table: 'public.estimation_events', schemaReady: false, errorCode: 'DB_NOT_CONFIGURED' });
});

function fakeAnalyticsDatabase(tableExists = true) {
  const records: any[] = [];
  return {
    records,
    async query<T>(sql: string, values: unknown[] = []) {
      const text = sql.replace(/\s+/g, ' ').trim();
      let rows: any[] = [];
      if (text === 'SELECT 1') rows = [{ '?column?': 1 }];
      else if (text.includes("to_regclass('public.estimation_events')")) rows = [{ table_name: tableExists ? 'estimation_events' : null }];
      else if (text.startsWith('INSERT INTO public.estimation_events')) {
        if (!records.some((record) => record.event_key === values[0])) records.push({ event_key: values[0], region: values[1], city: values[2],
          neighborhood: values[3], property_type: values[4], surface_m2: values[5], bedrooms: values[6], bathrooms: values[7],
          parking: values[8], balcony: values[9], sea_view: values[10], furnished_status: values[11], estimated_price_mad: values[12],
          model_version: values[13], locale: values[14], created_at: new Date() });
      } else if (text.includes('COUNT(*)::int AS row_count')) rows = [{ row_count: records.length }];
      else if (text.includes('COUNT(*)::int total') && text.includes('AVG(estimated_price_mad)')) rows = [{ total: records.length,
        today: records.length, seven: records.length, thirty: records.length,
        avg_price: records.length ? Number(records[0].estimated_price_mad) : null,
        median_price: records.length ? Number(records[0].estimated_price_mad) : null,
        avg_surface: records.length ? Number(records[0].surface_m2) : null,
        cities: new Set(records.map((record) => record.city)).size }];
      else if (text.includes('SELECT DATE(created_at)')) rows = records.length ? [{ day: new Date().toISOString().slice(0, 10), count: records.length }] : [];
      else if (text.includes('SELECT region name')) rows = records.length ? [{ name: records[0].region, count: records.length }] : [];
      else if (text.includes('SELECT city name, COUNT')) rows = records.length ? [{ name: records[0].city, count: records.length }] : [];
      else if (text.includes('SELECT CASE WHEN estimated_price_mad')) rows = records.length ? [{ bucket: '1M–1,5M', count: records.length }] : [];
      else if (text.includes('SELECT surface_m2::float surface')) rows = records.map((record) => ({ surface: record.surface_m2, price: record.estimated_price_mad, city: record.city }));
      else if (text.includes('AVG(estimated_price_mad/NULLIF')) rows = [];
      else if (text.includes('SELECT AVG(bedrooms)')) rows = [{ bedrooms: null, bathrooms: null, parking: null, balcony: null, sea_view: null, furnished: null }];
      else if (text.includes('SELECT ARRAY_AGG(DISTINCT region)')) rows = [{ regions: [...new Set(records.map((record) => record.region))], cities: [...new Set(records.map((record) => record.city))] }];
      return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] } as any;
    },
  };
}

test('db-health reports connected table with zero rows and detects a missing table', async () => {
  process.env.POSTGRES_URL = 'postgresql://user:secret@project.pooler.supabase.com:6543/postgres';
  const token = await createSessionToken('admin@maison-delux.com');
  setDatabasePoolForTests(fakeAnalyticsDatabase());
  const healthy = await dbHealth(new NextRequest('http://localhost/api/admin/db-health', { headers: { cookie: `maisondelux_admin=${token}` } }));
  assert.equal(healthy.status, 200);
  assert.deepEqual(await healthy.json(), { configured: true, connected: true, provider: 'supabase', source: 'POSTGRES_URL',
    poolerDetected: true, port: 6543, table: 'public.estimation_events', schemaReady: true, rowCount: 0 });
  setDatabasePoolForTests(fakeAnalyticsDatabase(false));
  const missing = await dbHealth(new NextRequest('http://localhost/api/admin/db-health', { headers: { cookie: `maisondelux_admin=${token}` } }));
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).errorCode, 'DB_SCHEMA_MISSING');
});

test('analytics insert is idempotent and overview handles zero and populated rows', async () => {
  process.env.POSTGRES_URL = 'postgresql://user:secret@project.pooler.supabase.com:6543/postgres';
  const database = fakeAnalyticsDatabase();
  setDatabasePoolForTests(database);
  assert.equal((await getOverview('all') as any).kpis.total, 0);
  const event = { event_key: 'test-event', region: 'Rabat-Salé-Kénitra', city: 'Rabat', property_type: 'apartment',
    surface_m2: 90, estimated_price_mad: 1_200_000 };
  assert.equal(await logEstimation(event), true);
  assert.equal(await logEstimation(event), true);
  assert.equal(database.records.length, 1);
  const overview = await getOverview('all') as any;
  assert.equal(overview.kpis.total, 1);
  assert.equal(overview.regions[0].name, event.region);
  assert.equal(overview.cities[0].name, event.city);
});

test('report is a valid PDF when analytics storage is not configured', async () => {
  const blocked = await middleware(new NextRequest('http://localhost/api/admin/report'));
  assert.equal(blocked.status, 401);
  const response = await report(new NextRequest('http://localhost/api/admin/report?period=30d'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), '%PDF');
});
