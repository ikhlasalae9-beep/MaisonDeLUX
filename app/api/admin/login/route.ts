import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, createSessionToken, credentialsAreConfigured, sessionCookieOptions, validateCredentials } from '@/lib/admin/auth';
import { sameOrigin, jsonBody, errorResponse } from '@/lib/security/http';

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
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
