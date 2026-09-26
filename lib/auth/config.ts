export function authConfig() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('AUTH_UNAVAILABLE');
  return { url, key };
}
export const authCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
export function localeOf(value: unknown): 'fr' | 'ar' { return value === 'ar' ? 'ar' : 'fr'; }
export function safeDestination(value: unknown, locale: string) {
  const fallback = `/${localeOf(locale)}/account`;
  // Exact internal destination only; requireAdmin still authorizes the page.
  if (value === '/admin') return '/admin';
  if (typeof value !== 'string' || !value.startsWith(`/${localeOf(locale)}/`) || /[\\\r\n]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, 'https://local.invalid');
    if (parsed.origin !== 'https://local.invalid' || !parsed.pathname.startsWith(`/${localeOf(locale)}/`) || parsed.pathname.includes('/auth/') || /%(?:2f|5c|0a|0d)/i.test(parsed.pathname)) return fallback;
    return parsed.pathname + parsed.search;
  } catch { return fallback; }
}

export function siteOrigin() {
  const url = process.env.SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://www.maison-delux.com' : 'http://localhost:3000');
  return new URL(url).origin;
}
