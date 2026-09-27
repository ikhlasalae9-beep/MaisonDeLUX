import { createHmac, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
export const GUEST_COOKIE = 'mdl_guest';
function guestHmacSecret() {
  const configured = process.env.GUEST_TRIAL_HMAC_SECRET;
  if (configured && configured.length >= 32) return configured;
  // Keep local development usable without coupling guest identity to Admin or
  // customer-auth credentials. The process-local key survives dev HMR, is
  // never logged or persisted, and is never available in production.
  if (process.env.NODE_ENV !== 'production') {
    const runtime=globalThis as typeof globalThis & {__mdlPhaseCDevGuestSecret?:string};
    return runtime.__mdlPhaseCDevGuestSecret ||= randomBytes(32).toString('hex');
  }
  return null;
}
export const guestHmacAvailable = () => guestHmacSecret() !== null;
export function boundedSetting(name: string, fallback: number, maximum = 10000) {
  const n = Number(process.env[name]); return Number.isInteger(n) && n > 0 && n <= maximum ? n : fallback;
}
export function hashIdentity(purpose: string, value: string) {
  const secret = guestHmacSecret();
  if (!secret) throw new Error('GUEST_SECRET_UNAVAILABLE');
  return createHmac('sha256', secret).update(`${purpose}:${value}`).digest('hex');
}
export const newGuestToken = () => randomBytes(32).toString('base64url');
export const validGuestToken = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export function networkPrefix(ip: string) {
  if (isIP(ip) === 4) return ip.split('.').slice(0,3).join('.') + '.0/24';
  if (isIP(ip) === 6) {
    if (ip.toLowerCase().startsWith('::ffff:') && isIP(ip.slice(7)) === 4) return networkPrefix(ip.slice(7));
    const [a,b] = ip.split('::'), left = a ? a.split(':') : [], right = b ? b.split(':') : [];
    const full = ip.includes('::') ? [...left,...Array(8-left.length-right.length).fill('0'),...right] : left;
    return full.slice(0,4).map(part => parseInt(part,16).toString(16)).join(':') + '::/64';
  }
  throw new Error('TRUSTED_NETWORK_UNAVAILABLE');
}
export function coarseIdentity(headers: Headers) {
  // Vercel overwrites this header. Other deployments must configure a sanitizing proxy.
  const header = process.env.VERCEL ? 'x-vercel-forwarded-for' : process.env.TRUSTED_CLIENT_IP_HEADER;
  const ip = header ? headers.get(header)?.split(',')[0].trim() : process.env.NODE_ENV === 'production' ? '' : '127.0.0.1';
  const prefix = networkPrefix(ip || '');
  const ua = headers.get('user-agent') || '';
  const os = /android/i.test(ua) ? 'android' : /iphone|ipad/i.test(ua) ? 'ios' : /windows/i.test(ua) ? 'windows' : /macintosh/i.test(ua) ? 'mac' : /linux/i.test(ua) ? 'linux' : 'other';
  const device = /mobile|iphone|android/i.test(ua) ? 'mobile' : 'desktop';
  const language = (headers.get('accept-language') || 'unknown').split(',')[0].split('-')[0].toLowerCase().replace(/[^a-z]/g,'').slice(0,8);
  return { network: hashIdentity('network', prefix), device: hashIdentity('device', `${prefix}|${os}|${device}|${language}`) };
}
