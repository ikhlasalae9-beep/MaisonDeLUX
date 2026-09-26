import 'server-only';
import { cookies } from 'next/headers';
import { currentUser } from '@/lib/auth/server';
import { query } from '@/lib/admin/db';
import { GUEST_COOKIE, hashIdentity, validGuestToken } from '@/lib/security/identity';
import { PublicError } from '@/lib/security/http';
import { eventId } from '@/lib/security/model-input';

export async function ownedPassport(id: string) {
  if (!eventId(id)) throw new PublicError('NOT_FOUND',404);
  const user = await currentUser(), token = cookies().get(GUEST_COOKIE)?.value;
  const tokenHash = validGuestToken(token) ? hashIdentity('token',token) : null;
  const result = await query(`SELECT e.id,e.user_id,e.created_at,e.input_features,e.estimated_price_mad,c.slug AS city_slug,c.name AS city,m.version AS model_version,p.prediction,p.context
    FROM public.estimation_events e JOIN public.cities c ON c.id=e.city_id JOIN public.model_versions m ON m.id=e.model_version_id
    LEFT JOIN public.estimation_passports p ON p.estimation_event_id=e.id
    WHERE e.id=$1 AND ((e.user_id=$2 AND $2::uuid IS NOT NULL) OR ($2::uuid IS NULL AND e.user_id IS NULL AND EXISTS
      (SELECT 1 FROM public.guest_trials g WHERE g.estimation_event_id=e.id AND g.token_hash=$3 AND g.claimed_at IS NULL AND g.expires_at>now())))`,[id,user?.id || null,tokenHash]);
  if (!result.rows[0]) throw new PublicError('NOT_FOUND',404);
  return { event: result.rows[0], user, tokenHash };
}
