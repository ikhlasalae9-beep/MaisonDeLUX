import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localizedAdmin = pathname.match(/^\/(fr|ar)\/admin(?:\/(.*))?$/);
  if (localizedAdmin) {
    const suffix = localizedAdmin[2] ? `/${localizedAdmin[2]}` : '';
    return NextResponse.redirect(new URL(`/admin${suffix}`, request.url));
  }
  if (pathname === '/api/admin/login') return NextResponse.next();
  const authenticated = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (pathname.startsWith('/api/admin/')) {
    if (!authenticated) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    return NextResponse.next();
  }
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !authenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (pathname === '/admin/login' && authenticated) return NextResponse.redirect(new URL('/admin', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*', '/fr/admin/:path*', '/ar/admin/:path*'] };
