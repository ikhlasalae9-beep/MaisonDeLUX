import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfig, authCookieOptions, localeOf, safeDestination } from './config';

export function authClient() {
  const { url, key } = authConfig(), store = cookies();
  return createServerClient(url, key, { cookieOptions: authCookieOptions, cookies: {
    getAll: () => store.getAll(),
    setAll: values => { try { values.forEach(({ name, value, options }) => store.set(name, value, { ...options, ...authCookieOptions })); } catch { /* Server Components: middleware persists refresh cookies. */ } },
  } });
}
export async function currentUser() {
  const { data, error } = await authClient().auth.getUser();
  if (error || !data.user?.email_confirmed_at) return null;
  return data.user;
}
export async function requireUser(locale: string, destination?: string) {
  const user = await currentUser();
  if (!user) redirect(`/${localeOf(locale)}/auth/login?next=${encodeURIComponent(safeDestination(destination, locale))}`);
  return user;
}
