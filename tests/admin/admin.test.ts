import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { createSessionToken, validateCredentials, verifySessionToken } from '../../lib/admin/auth';
import { logEstimation, periodDays } from '../../lib/admin/analytics';
import { middleware } from '../../middleware';
import { GET as report } from '../../app/api/admin/report/route';
import { POST as login } from '../../app/api/admin/login/route';
import { POST as logout } from '../../app/api/admin/logout/route';

const original = { ...process.env };
test.beforeEach(() => {
  process.env.ADMIN_EMAIL = 'admin@maison-delux.com';
  process.env.ADMIN_PASSWORD = 'local-test-password';
  process.env.ADMIN_SESSION_SECRET = '0123456789abcdef0123456789abcdef';
  delete process.env.DATABASE_URL;
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

test('report is a valid PDF when analytics storage is not configured', async () => {
  const blocked = await middleware(new NextRequest('http://localhost/api/admin/report'));
  assert.equal(blocked.status, 401);
  const response = await report(new NextRequest('http://localhost/api/admin/report?period=30d'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), '%PDF');
});
