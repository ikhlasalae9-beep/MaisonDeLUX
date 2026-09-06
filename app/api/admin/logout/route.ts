import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, sessionCookieOptions } from '@/lib/admin/auth';
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
