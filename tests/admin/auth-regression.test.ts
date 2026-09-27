import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { POST as login } from '../../app/api/admin/login/route';
import { POST as logout } from '../../app/api/admin/logout/route';
import { ADMIN_COOKIE, verifySessionToken } from '../../lib/admin/auth';
import { requireAdmin } from '../../lib/admin/require';

const original = { ...process.env };

test.beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.SITE_URL = 'http://localhost:3000';
  process.env.ADMIN_EMAIL = 'admin@example.test';
  process.env.ADMIN_PASSWORD = 'local-test-password';
  process.env.ADMIN_SESSION_SECRET = '0123456789abcdef0123456789abcdef';
});

test.after(() => { process.env = original; });

function post(url: string, body?: Record<string, string>, cookie?: string) {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('admin login rejects invalid credentials', async () => {
  const response = await login(post('http://localhost:3000/api/admin/login', {
    email: 'admin@example.test', password: 'wrong-password',
  }));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Identifiants invalides.' });
  assert.equal(response.headers.get('set-cookie'), null);
});

test('configured admin login creates a valid HTTP-only signed session', async () => {
  // Account-auth variables must not replace the established admin authority.
  process.env.ADMIN_AUTH_MODE = 'supabase-only';
  process.env.GUEST_TRIAL_HMAC_SECRET = 'configured-but-unrelated-to-admin-auth';

  const response = await login(post('http://localhost:3000/api/admin/login', {
    email: 'admin@example.test', password: 'local-test-password',
  }));
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie') || '';
  assert.match(setCookie, new RegExp(`^${ADMIN_COOKIE}=`));
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);

  const token = setCookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`))?.[1];
  assert.equal(await verifySessionToken(token), true);
  await assert.doesNotReject(() => requireAdmin(new NextRequest('http://localhost:3000/admin', {
    headers: { cookie: `${ADMIN_COOKIE}=${token}` },
  })));
});

test('logout expires the admin session and the cleared cookie no longer authorizes admin access', async () => {
  const response = await logout(post('http://localhost:3000/api/admin/logout'));
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie') || '';
  assert.match(setCookie, new RegExp(`^${ADMIN_COOKIE}=`));
  assert.match(setCookie, /Max-Age=0/i);
  await assert.rejects(() => requireAdmin(new NextRequest('http://localhost:3000/admin')));
});
