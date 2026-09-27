import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, sessionCookieOptions } from '@/lib/admin/auth';
import { sameOrigin,errorResponse } from '@/lib/security/http';
export async function POST(request:NextRequest) {
  try{sameOrigin(request);}catch(error){return errorResponse(error);}
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
