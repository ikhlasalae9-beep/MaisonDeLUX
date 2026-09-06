import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'maisondelux_admin';
const MAX_AGE_SECONDS = 60 * 60 * 8;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function createSessionToken(email: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('ADMIN_SESSION_SECRET manquant ou trop court');
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ email, exp: Date.now() + MAX_AGE_SECONDS * 1000 })));
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifySessionToken(token?: string) {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret || !token) return false;
    const [payload, supplied] = token.split('.');
    if (!payload || !supplied || !safeEqual(supplied, await signature(payload, secret))) return false;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0))));
    return data.email === process.env.ADMIN_EMAIL && Number(data.exp) > Date.now();
  } catch { return false; }
}

export async function isAdminAuthenticated() {
  return verifySessionToken(cookies().get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};

export function credentialsAreConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function validateCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL || '';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';
  return expectedEmail.length > 0 && expectedPassword.length > 0 &&
    safeEqual(email, expectedEmail) && safeEqual(password, expectedPassword);
}
