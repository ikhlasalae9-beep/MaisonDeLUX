import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { createSessionToken, validateCredentials, verifySessionToken } from '../../lib/admin/auth';
import { getEstimations, getOverview, periodDays } from '../../lib/admin/analytics';
import { setSupabaseClientForTests, supabaseConfigured } from '../../lib/admin/supabase-server';
import { middleware } from '../../middleware';
import { GET as report } from '../../app/api/admin/report/route';
import { POST as login } from '../../app/api/admin/login/route';
import { POST as logout } from '../../app/api/admin/logout/route';
import { GET as dbHealth } from '../../app/api/admin/db-health/route';
import { POST as analyticsEvent } from '../../app/api/analytics/events/route';

const original = { ...process.env };
test.beforeEach(() => {
  setSupabaseClientForTests(null);
  process.env.ADMIN_EMAIL = 'admin@maison-delux.com';
  process.env.ADMIN_PASSWORD = 'local-test-password';
  process.env.ADMIN_SESSION_SECRET = '0123456789abcdef0123456789abcdef';
  delete process.env.POSTGRES_SUPABASE_URL;
  delete process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY;
});
test.after(() => { process.env = original; });

function configure(client: FakeSupabase) {
  process.env.POSTGRES_SUPABASE_URL = 'https://project.supabase.co';
  process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  setSupabaseClientForTests(client as any);
}

class FakeQuery {
  private filters: ((row: any) => boolean)[] = [];
  private head = false;
  private countRequested = false;
  private start = 0;
  private end = Number.MAX_SAFE_INTEGER;
  private descending = false;
  constructor(private database: FakeSupabase) {}
  select(_fields: string, options?: { count?: string; head?: boolean }) { this.head = Boolean(options?.head); this.countRequested = options?.count === 'exact'; return this; }
  gte(column: string, value: string) { this.filters.push((row) => String(row[column]) >= value); return this; }
  eq(column: string, value: string) { this.filters.push((row) => row[column] === value); return this; }
  or(expression: string) {
    const match = expression.match(/city\.ilike\.%(.*)%,neighborhood\.ilike\.%.*%/);
    if (match) { const search = match[1].toLocaleLowerCase(); this.filters.push((row) =>
      String(row.city || '').toLocaleLowerCase().includes(search) || String(row.neighborhood || '').toLocaleLowerCase().includes(search)); }
    return this;
  }
  order(_column: string, options?: { ascending?: boolean }) { this.descending = options?.ascending === false; return this; }
  range(start: number, end: number) { this.start = start; this.end = end; return this; }
  async upsert(payload: any, options: { onConflict: string; ignoreDuplicates: boolean }) {
    if (this.database.error) return { error: this.database.error };
    if (!options.ignoreDuplicates || !this.database.rows.some((row) => row[options.onConflict] === payload[options.onConflict])) {
      this.database.rows.push({ id: this.database.rows.length + 1, created_at: new Date().toISOString(), ...payload });
    }
    return { error: null };
  }
  then(resolve: (value: any) => void) {
    if (this.database.error) return Promise.resolve({ data: null, count: null, error: this.database.error }).then(resolve);
    let rows = this.database.rows.filter((row) => this.filters.every((filter) => filter(row)));
    const count = this.countRequested ? rows.length : null;
    if (this.descending) rows = [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    rows = rows.slice(this.start, this.end + 1);
    return Promise.resolve({ data: this.head ? null : rows, count, error: null }).then(resolve);
  }
}

class FakeSupabase {
  rows: any[] = [];
  constructor(public error: { code: string; message: string } | null = null) {}
  from() { return new FakeQuery(this); }
}

const event = { event_key: 'event-1', region: 'Rabat-Salé-Kénitra', city: 'Rabat', neighborhood: 'Agdal',
  property_type: 'apartment', surface_m2: 90, bedrooms: 2, bathrooms: 1, parking: 'yes', balcony: 'no',
  sea_view: 'no', furnished_status: 'furnished', estimated_price_mad: 1_200_000, model_version: 'v1', locale: 'fr' };

test('authentication accepts valid credentials and protects admin APIs', async () => {
  assert.equal(validateCredentials('admin@maison-delux.com', 'local-test-password'), true);
  assert.equal(validateCredentials('admin@maison-delux.com', 'wrong-password'), false);
  assert.equal(await verifySessionToken(await createSessionToken('admin@maison-delux.com')), true);
  assert.equal((await middleware(new NextRequest('http://localhost/api/admin/overview'))).status, 401);
});

test('login and logout manage the admin session cookie', async () => {
  const valid = await login(new NextRequest('http://localhost/api/admin/login', { method: 'POST',
    body: JSON.stringify({ email: 'admin@maison-delux.com', password: 'local-test-password' }) }));
  assert.equal(valid.status, 200); assert.match(valid.headers.get('set-cookie') || '', /HttpOnly/);
  const response = await logout(); assert.match(response.headers.get('set-cookie') || '', /Max-Age=0/);
});

test('missing Supabase environment disables analytics safely', async () => {
  assert.equal(supabaseConfigured(), false);
  assert.deepEqual(await getOverview('30d'), { configured: false });
  assert.deepEqual(periodDays, { today: 1, '7d': 7, '30d': 30, '90d': 90, all: null });
});

test('db-health rejects unauthorized requests', async () => {
  assert.equal((await dbHealth(new NextRequest('http://localhost/api/admin/db-health'))).status, 401);
});

test('db-health reports an empty table as healthy and detects a missing table', async () => {
  const token = await createSessionToken('admin@maison-delux.com');
  configure(new FakeSupabase());
  const healthy = await dbHealth(new NextRequest('http://localhost/api/admin/db-health', { headers: { cookie: `maisondelux_admin=${token}` } }));
  assert.equal(healthy.status, 200);
  assert.deepEqual(await healthy.json(), { configured: true, connected: true, schemaReady: true, provider: 'supabase',
    transport: 'https', table: 'public.estimation_events', rowCount: 0 });
  configure(new FakeSupabase({ code: 'PGRST205', message: 'Table not found' }));
  const missing = await dbHealth(new NextRequest('http://localhost/api/admin/db-health', { headers: { cookie: `maisondelux_admin=${token}` } }));
  assert.equal(missing.status, 503); assert.equal((await missing.json()).errorCode, 'DB_SCHEMA_MISSING');
});

test('analytics event insert is idempotent by event_key', async () => {
  const database = new FakeSupabase(); configure(database);
  for (let index = 0; index < 2; index++) {
    const response = await analyticsEvent(new NextRequest('http://localhost/api/analytics/events', { method: 'POST', body: JSON.stringify(event) }));
    assert.equal(response.status, 202); assert.equal((await response.json()).stored, true);
  }
  assert.equal(database.rows.length, 1);
});

test('overview supports empty and populated datasets', async () => {
  const database = new FakeSupabase(); configure(database);
  assert.equal((await getOverview('all') as any).kpis.total, 0);
  database.rows.push({ id: 1, created_at: new Date().toISOString(), ...event });
  const overview = await getOverview('all') as any;
  assert.equal(overview.kpis.total, 1); assert.equal(overview.kpis.cities, 1);
  assert.equal(overview.regions[0].name, event.region); assert.equal(overview.cities[0].name, event.city);
});

test('estimations use server-side pagination', async () => {
  const database = new FakeSupabase();
  database.rows = Array.from({ length: 25 }, (_, index) => ({ id: index + 1,
    created_at: new Date(Date.now() - index * 1000).toISOString(), ...event, event_key: `event-${index}` }));
  configure(database);
  const first = await getEstimations('all', 1); const second = await getEstimations('all', 2);
  assert.equal(first.total, 25); assert.equal(first.rows.length, 20); assert.equal(second.rows.length, 5);
});

test('report remains a valid PDF without analytics configuration', async () => {
  const response = await report(new NextRequest('http://localhost/api/admin/report?period=30d'));
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'application/pdf');
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), '%PDF');
});
