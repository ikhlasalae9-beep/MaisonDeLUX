import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, createSessionToken, credentialsAreConfigured, sessionCookieOptions, validateCredentials } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  try {
    if (!credentialsAreConfigured()) return NextResponse.json({ error: 'Configuration administrateur incomplète.' }, { status: 503 });
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || !validateCredentials(email, password)) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, await createSessionToken(email), sessionCookieOptions);
    return response;
  } catch { return NextResponse.json({ error: 'Connexion momentanément indisponible.' }, { status: 500 }); }
}
