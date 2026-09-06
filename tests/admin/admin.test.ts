import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { createSessionToken, validateCredentials, verifySessionToken } from '../../lib/admin/auth';
import { logEstimation, periodDays } from '../../lib/admin/analytics';
import { classifyDatabaseError, databaseMetadata, resolveDatabaseUrl } from '../../lib/admin/db';
import { middleware } from '../../middleware';
import { GET as report } from '../../app/api/admin/report/route';
import { POST as login } from '../../app/api/admin/login/route';
import { POST as logout } from '../../app/api/admin/logout/route';
import { GET as dbHealth } from '../../app/api/admin/db-health/route';
import { POST as analyticsEvent } from '../../app/api/analytics/events/route';

const original = { ...process.env };
test.beforeEach(() => {
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

test('analytics logging is safely disabled without DATABASE_URL', async () => {
  assert.equal(await logEstimation({}), false);
  assert.deepEqual(periodDays, { today: 1, '7d': 7, '30d': 30, '90d': 90, all: null });
});

test('database URL resolution uses safe server-side fallback order', () => {
  process.env.POSTGRES_PRISMA_URL = 'postgresql://user:secret@project.pooler.supabase.com:6543/postgres';
  process.env.POSTGRES_URL = 'postgres://user:secret@preferred.pooler.supabase.com:6543/postgres';
  assert.equal(resolveDatabaseUrl(), process.env.POSTGRES_URL);
  process.env.DATABASE_URL = 'not-a-postgres-url';
  assert.equal(resolveDatabaseUrl(), process.env.POSTGRES_URL);
  process.env.DATABASE_URL = 'postgresql://user:secret@primary.pooler.supabase.com:6543/postgres';
  assert.equal(resolveDatabaseUrl(), process.env.DATABASE_URL);
  assert.deepEqual(databaseMetadata(), { provider: 'supabase', source: 'DATABASE_URL', hostPresent: true, poolerDetected: true,
    port: 6543, databaseConfigured: true });
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
    poolerDetected: false, port: null, schemaReady: false, table: 'public.estimation_events', errorCode: 'DB_NOT_CONFIGURED' });
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
