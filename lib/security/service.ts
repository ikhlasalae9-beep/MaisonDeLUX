import 'server-only';
import { cookies } from 'next/headers';
import { query } from '@/lib/admin/db';
import { boundedSetting, coarseIdentity, GUEST_COOKIE, guestHmacAvailable, hashIdentity, validGuestToken } from './identity';
import { PublicError } from './http';
export async function rateLimit(scope: string, identity: string, limit: number, seconds = 60) {
  const result = await query('SELECT public.phase_c_rate_limit($1,$2,$3) AS allowed', [hashIdentity('rate', `${scope}:${identity}`),limit,seconds]);
  if (!result.rows[0]?.allowed) throw new PublicError('RATE_LIMITED',429);
}
export async function authRateLimit(headers: Headers, action: string) {
  await rateLimit(`auth:${action}`,coarseIdentity(headers).network,boundedSetting('AUTH_RATE_LIMIT',20),900);
}
export async function audit(event: string, userId: string | null = null) {
  await query('INSERT INTO public.security_audit_logs(event_type,actor_user_id) VALUES($1,$2)',[event,userId]);
}
export async function claimGuest(userId: string) {
  const token = cookies().get(GUEST_COOKIE)?.value;
  if (!validGuestToken(token)) return null;
  const result = await query('SELECT public.phase_c_claim_guest($1,$2) AS id',[hashIdentity('token',token),userId]);
  return result.rows[0]?.id || null;
}

export async function phaseCReady() {
  if (!guestHmacAvailable()) return false;
  try {
    const result = await query(`SELECT
      to_regclass('public.guest_trials') IS NOT NULL
      AND to_regclass('public.estimation_passports') IS NOT NULL
      AND to_regprocedure('public.phase_c_reserve_guest(text,text,text,uuid,integer,integer)') IS NOT NULL
      AND to_regprocedure('public.phase_c_complete_estimation(text,uuid,uuid,jsonb,jsonb)') IS NOT NULL AS ready`);
    return result.rows[0]?.ready === true;
  } catch { return false; }
}
