import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { authConfig, authCookieOptions } from '@/lib/auth/config';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (/^\/(fr|ar)\/(auth|account)(\/|$)/.test(pathname) || pathname.startsWith('/api/auth/')) {
    let response = NextResponse.next({ request });
    try {
      const { url, key } = authConfig();
      const client = createServerClient(url, key, { cookieOptions: authCookieOptions, cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: values => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, ...authCookieOptions }));
        },
      } });
      const { data: { user } } = await client.auth.getUser();
      if (/^\/(fr|ar)\/account(\/|$)/.test(pathname) && !user?.email_confirmed_at) {
        const redirect = NextResponse.redirect(new URL(`/${pathname.split('/')[1]}/auth/login?next=${encodeURIComponent(pathname + request.nextUrl.search)}`, request.url));
        response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
        return redirect;
      }
    } catch {
      if (pathname.includes('/account')) return NextResponse.redirect(new URL(`/${pathname.split('/')[1]}/auth/login`, request.url));
    }
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
  const localizedAdmin = pathname.match(/^\/(fr|ar)\/admin(?:\/(.*))?$/);
  if (localizedAdmin) {
    const suffix = localizedAdmin[2] ? `/${localizedAdmin[2]}` : '';
    return NextResponse.redirect(new URL(`/admin${suffix}`, request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/fr/admin/:path*', '/ar/admin/:path*', '/fr/account/:path*', '/ar/account/:path*', '/fr/auth/:path*', '/ar/auth/:path*', '/api/auth/:path*'] };
