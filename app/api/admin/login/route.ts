import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, createSessionToken, credentialsAreConfigured, sessionCookieOptions, validateCredentials } from '@/lib/admin/auth';
import { sameOrigin, jsonBody, errorResponse } from '@/lib/security/http';
import { authRateLimit } from '@/lib/security/service';

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if(process.env.ADMIN_AUTH_MODE==='supabase-only')return NextResponse.json({code:'USE_SUPABASE_LOGIN'},{status:403});
    // Keep the established login usable before the manual Phase C secret/schema setup.
    if(process.env.GUEST_TRIAL_HMAC_SECRET)await authRateLimit(request.headers,'admin-login');
    if (!credentialsAreConfigured()) return NextResponse.json({ error: 'Configuration administrateur incomplète.' }, { status: 503 });
    const { email, password } = await jsonBody(request,['email','password']);
    if (typeof email !== 'string' || typeof password !== 'string' || !validateCredentials(email, password)) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, await createSessionToken(email), sessionCookieOptions);
    return response;
  } catch(error) { return errorResponse(error); }
}
