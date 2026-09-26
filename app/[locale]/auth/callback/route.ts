import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth/server';
import { localeOf, safeDestination, siteOrigin } from '@/lib/auth/config';
import { audit, claimGuest } from '@/lib/security/service';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const locale = localeOf(params.locale), code = request.nextUrl.searchParams.get('code');
  const recovery = request.nextUrl.searchParams.get('flow') === 'recovery';
  const destination = recovery ? `/${locale}/auth/reset-password` : safeDestination(request.nextUrl.searchParams.get('next'), locale);
  try {
    if (!code || code.length > 2048) throw new Error('INVALID_CALLBACK');
    const { data, error } = await authClient().auth.exchangeCodeForSession(code);
    if (error) throw new Error('INVALID_CALLBACK');
    if (data.user?.email_confirmed_at) {
      await audit('login_completed',data.user.id);
      await claimGuest(data.user.id);
    }
    return NextResponse.redirect(new URL(destination, siteOrigin()), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/auth/${recovery ? 'forgot-password' : 'login'}?error=link`, siteOrigin()));
  }
}
