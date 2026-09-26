import assert from 'node:assert/strict';
import test from 'node:test';
import { localeOf, safeDestination } from '../lib/auth/config';
test('auth redirects retain locale and reject external, encoded and auth-loop destinations', () => {
  assert.equal(localeOf('ar'), 'ar');
  assert.equal(safeDestination('/ar/account/estimations?page=2', 'ar'), '/ar/account/estimations?page=2');
  for (const value of ['//evil.test', 'https://evil.test', '/ar/\\evil.test', '/fr/account', '/ar/auth/login', '/ar/../auth/login', '/ar/../fr/account', '/ar/%2f%2fevil.test', '/admin?role=admin']) assert.equal(safeDestination(value, 'ar'), '/ar/account');
  assert.equal(safeDestination('/admin', 'ar'), '/admin');
});
