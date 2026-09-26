import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, sessionCookieOptions } from '@/lib/admin/auth';
import { requireAdmin } from '@/lib/admin/require';
import { sameOrigin,errorResponse } from '@/lib/security/http';
import { authClient } from '@/lib/auth/server';
export async function POST(request:NextRequest) {
  try{sameOrigin(request);}catch(error){return errorResponse(error);}
  try {
    const authority=await requireAdmin(request);
    if(authority.source==='supabase') {
      const {error}=await authClient().auth.signOut({scope:'local'});
      if(error)return NextResponse.json({code:'AUTH_FAILED'},{status:503});
    }
  } catch(error) {return errorResponse(error);}
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
