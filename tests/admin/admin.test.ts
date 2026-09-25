import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { createSessionToken, validateCredentials } from '../../lib/admin/auth';
import { databaseConfigured, databaseHealth, setDatabasePoolForTests } from '../../lib/admin/db';
import { getOverview, logEstimation } from '../../lib/admin/analytics';
import { GET as healthRoute } from '../../app/api/admin/db-health/route';
import { POST as analyticsRoute } from '../../app/api/analytics/events/route';

const original = { ...process.env };
test.beforeEach(() => {
  setDatabasePoolForTests(null);
  delete process.env.POSTGRES_URL;
  process.env.ADMIN_EMAIL = 'admin@maison-delux.com';
  process.env.ADMIN_PASSWORD = 'local-test-password';
  process.env.ADMIN_SESSION_SECRET = '0123456789abcdef0123456789abcdef';
});
test.after(() => { process.env = original; });

function fakeDatabase(tableExists = true) {
  const records: any[] = [];
  return { records, async query<T>(sql: string, values: unknown[] = []) {
    const text = sql.replace(/\s+/g, ' ').trim();
    let rows: any[] = [];
    if (text === 'SELECT 1') rows = [{ value: 1 }];
    else if (text.includes("to_regclass('public.estimation_events')")) rows = [{ table_name: tableExists ? 'estimation_events' : null }];
    else if (text.includes('COUNT(*)::int AS row_count')) rows = [{ row_count: records.length }];
    else if (text.includes('SELECT c.id AS city_id') && text.includes('JOIN public.model_versions')) rows = values[0] === 'Casablanca' && values[1] === 'casablanca-catboost-v1'
      ? [{ city_id: 1, name: 'Casablanca', region: 'Casablanca-Settat', model_version_id: 7, version: 'casablanca-catboost-v1' }] : [];
    else if (text.startsWith('INSERT INTO public.estimation_events')) {
      if (!records.some((row) => row.event_key === values[0])) records.push({ event_key: values[0], city_id: values[2], model_version_id: values[3],
        input_features: JSON.parse(String(values[4])), estimated_price_mad: values[5], is_test: values[6] });
    } else if (text.includes('COUNT(*)::int total') && text.includes('AVG(e.estimated_price_mad)')) rows = [{ total: records.length, today: records.length,
      seven: records.length, thirty: records.length, avg_price: null, median_price: null, avg_surface: null, cities: records.length ? 1 : 0 }];
    else if (text.includes('FROM public.cities c LEFT JOIN public.model_versions')) rows = [{ id: 1, slug: 'casablanca', name: 'Casablanca', region: 'Casablanca-Settat', public_enabled: false, model_count: 1, estimation_count: records.length }];
    else if (text.includes('SELECT id,slug,name,region,public_enabled FROM public.cities')) rows = [{ id: 1, slug: 'casablanca', name: 'Casablanca', region: 'Casablanca-Settat', public_enabled: false }];
    else if (text.includes('FROM public.model_versions mv JOIN public.cities')) rows = [{ id: 7, city_id: 1, city_name: 'Casablanca', version: 'casablanca-catboost-v1' }];
    return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] } as any;
  } };
}

function configure(database: ReturnType<typeof fakeDatabase>) {
  process.env.POSTGRES_URL = 'postgresql://user:secret@project.pooler.supabase.com:6543/postgres';
  setDatabasePoolForTests(database);
}

test('admin credentials validate', () => {
  assert.equal(validateCredentials('admin@maison-delux.com', 'local-test-password'), true);
  assert.equal(validateCredentials('admin@maison-delux.com', 'wrong'), false);
});

test('only POSTGRES_URL configures the database', () => {
  process.env.DATABASE_URL = 'postgresql://ignored/legacy';
  process.env.POSTGRES_PRISMA_URL = 'postgresql://ignored/prisma';
  assert.equal(databaseConfigured(), false);
  process.env.POSTGRES_URL = 'postgresql://user:secret@project.pooler.supabase.com:6543/postgres';
  assert.equal(databaseConfigured(), true);
});

test('health is protected and treats an empty table as healthy', async () => {
  assert.equal((await healthRoute(new NextRequest('http://localhost/api/admin/db-health'))).status, 401);
  const database = fakeDatabase(); configure(database);
  const token = await createSessionToken('admin@maison-delux.com');
  const response = await healthRoute(new NextRequest('http://localhost/api/admin/db-health', { headers: { cookie: `maisondelux_admin=${token}` } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { configured: true, connected: true, provider: 'supabase', source: 'POSTGRES_URL',
    poolerDetected: true, port: 6543, schemaReady: true, table: 'public.estimation_events', rowCount: 0 });
});

test('health reports a missing table', async () => {
  const database = fakeDatabase(false); configure(database);
  const health: any = await databaseHealth();
  assert.equal(health.errorCode, 'DB_SCHEMA_MISSING'); assert.equal(health.schemaReady, false);
});

test('analytics insert is idempotent and overview supports empty/populated data', async () => {
  const database = fakeDatabase(); configure(database);
  assert.equal((await getOverview('all') as any).kpis.total, 0);
  const event = { event_key: 'event-1', city: 'Casablanca', model_version: 'casablanca-catboost-v1', estimated_price_mad: 1_200_000,
    input_features: { city: 'Casablanca', property_type: 'appartement', neighborhood: 'Maârif', area: 90, rooms: 3,
      bedrooms: 2, bathrooms: 1, floor: 2, current_state: 'Bon état', age: '1-5 ans', locale: 'ignored' } };
  assert.equal(await logEstimation(event), true); assert.equal(await logEstimation(event), true); assert.equal(database.records.length, 1);
  assert.deepEqual(Object.keys(database.records[0].input_features), ['city', 'property_type', 'neighborhood', 'area', 'rooms', 'bedrooms', 'bathrooms', 'floor', 'current_state', 'age']);
  assert.equal(database.records[0].city_id, 1); assert.equal(database.records[0].model_version_id, 7);
  assert.equal((await getOverview('all') as any).kpis.total, 1);
  const response = await analyticsRoute(new NextRequest('http://localhost/api/analytics/events', { method: 'POST', body: JSON.stringify(event) }));
  assert.equal(response.status, 202);
});
