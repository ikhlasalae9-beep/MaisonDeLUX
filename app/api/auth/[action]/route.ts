import { NextRequest } from 'next/server';
import { authClient, currentUser } from '@/lib/auth/server';
import { localeOf, safeDestination, siteOrigin } from '@/lib/auth/config';
import { errorResponse, jsonBody, PublicError, safeResponse, sameOrigin } from '@/lib/security/http';
import { audit, authRateLimit, claimGuest } from '@/lib/security/service';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { action: string } }) {
  if (params.action !== 'session') return safeResponse({ code: 'NOT_FOUND' }, 404);
  try { const user = await currentUser(); return safeResponse({ authenticated: Boolean(user) }); }
  catch { return safeResponse({ authenticated: false }); }
}
export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  try {
    sameOrigin(request);
    const action = params.action;
    if (!['login', 'signup', 'forgot-password', 'reset-password', 'logout'].includes(action)) throw new PublicError('NOT_FOUND', 404);
    const body = await jsonBody(request, ['email', 'password', 'display_name', 'locale', 'next', 'all']);
    const locale = localeOf(body.locale), next = safeDestination(body.next, locale), client = authClient();
    await authRateLimit(request.headers, action);
    if (action === 'logout') {
      const user = await currentUser();
      const { error } = await client.auth.signOut({ scope: body.all === true ? 'global' : 'local' });
      if (error) throw new PublicError('AUTH_FAILED', 400);
      if (user) await audit('logout', user.id);
      return safeResponse({ redirect: `/${locale}` });
    }
    if (['login', 'signup', 'forgot-password'].includes(action) && (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254)) throw new PublicError('INVALID_REQUEST');
    if (action !== 'forgot-password' && (typeof body.password !== 'string' || body.password.length < (action === 'login' ? 1 : 12) || body.password.length > 128)) throw new PublicError('INVALID_REQUEST');
    if (action === 'forgot-password') {
      await client.auth.resetPasswordForEmail(body.email, { redirectTo: `${siteOrigin()}/${locale}/auth/callback?flow=recovery` });
      await audit('password_reset_requested');
      return safeResponse({ ok: true });
    }
    if (action === 'reset-password') {
      const user = await currentUser();
      if (!user) throw new PublicError('AUTH_REQUIRED', 401);
      const { error } = await client.auth.updateUser({ password: body.password });
      if (error) throw new PublicError('AUTH_FAILED', 400);
      await audit('password_changed', user.id);
      return safeResponse({ redirect: `/${locale}/account/security` });
    }
    if (action === 'signup') {
      if (body.display_name !== undefined && (typeof body.display_name !== 'string' || body.display_name.length > 80)) throw new PublicError('INVALID_REQUEST');
      const { error } = await client.auth.signUp({ email: body.email, password: body.password, options: { data: { display_name: body.display_name || '', preferred_locale: locale }, emailRedirectTo: `${siteOrigin()}/${locale}/auth/callback?next=${encodeURIComponent(next)}` } });
      if (error && error.status && error.status >= 500) throw new PublicError('SERVICE_UNAVAILABLE', 503);
      // Generic response also covers an already registered email.
      return safeResponse({ ok: true });
    }
    const { data, error } = await client.auth.signInWithPassword({ email: body.email, password: body.password });
    if (error || !data.user?.email_confirmed_at) throw new PublicError('AUTH_FAILED', 401);
    await audit('login_completed',data.user.id);
    await claimGuest(data.user.id);
    return safeResponse({ redirect: next });
  } catch (error) { return errorResponse(error); }
}
