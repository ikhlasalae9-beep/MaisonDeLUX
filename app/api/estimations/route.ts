import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { currentUser } from '@/lib/auth/server';
import { query } from '@/lib/admin/db';
import { boundedSetting, coarseIdentity, GUEST_COOKIE, hashIdentity, newGuestToken, validGuestToken } from '@/lib/security/identity';
import { phaseCReady, rateLimit } from '@/lib/security/service';
import { errorResponse, jsonBody, PublicError, safeResponse, sameOrigin } from '@/lib/security/http';
import { uuid, validateModelInput } from '@/lib/security/model-input';
import { invokeInference } from '@/lib/estimations/gateway';
import { inferenceContract } from '@/lib/estimations/contracts';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request,['input','request_id','locale']);
    const locale=body.locale ?? 'fr';
    if(locale!=='fr' && locale!=='ar') throw new PublicError('INVALID_INPUT');
    if (!uuid(body.request_id)) throw new PublicError('INVALID_REQUEST');
    let input; try { input=validateModelInput(body.input); } catch { throw new PublicError('INVALID_INPUT'); }
    const user = await currentUser();
    if (!await phaseCReady()) {
      // Never bypass the server-authoritative guest entitlement or return an
      // unowned "successful" estimate when Phase C persistence is unavailable.
      throw new PublicError('SERVICE_UNAVAILABLE',503);
    }
    const identity = coarseIdentity(request.headers);
    let token = cookies().get(GUEST_COOKIE)?.value;
    const days = boundedSetting('GUEST_TRIAL_WINDOW_DAYS',30,365);
    if (!user && !validGuestToken(token)) {
      token=newGuestToken(); cookies().set(GUEST_COOKIE,token,{ httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:days*86400 });
    }
    const tokenHash = !user && validGuestToken(token) ? hashIdentity('token',token) : null;
    await rateLimit(user ? 'main:user' : 'main:guest',user?.id || identity.network,boundedSetting(user ? 'USER_ESTIMATION_RATE_LIMIT' : 'GUEST_ESTIMATION_RATE_LIMIT',user ? 30 : 6));
    const existing = await query(`SELECT e.id,p.prediction,c.slug AS city_slug,m.version AS model_version FROM public.estimation_events e JOIN public.estimation_passports p ON p.estimation_event_id=e.id
      JOIN public.cities c ON c.id=e.city_id JOIN public.model_versions m ON m.id=e.model_version_id
      WHERE e.event_key=$1 AND (e.user_id=$2 OR ($2::uuid IS NULL AND e.user_id IS NULL AND EXISTS(SELECT 1 FROM public.guest_trials g WHERE g.estimation_event_id=e.id AND g.token_hash=$3 AND g.claimed_at IS NULL AND g.expires_at>now())))`,[body.request_id,user?.id || null,tokenHash]);
    if (existing.rows[0]) {
      const stored=existing.rows[0], expected=inferenceContract(input.city), result=stored.prediction;
      // Historical Casablanca passports may predate response city/model_id fields.
      // Their authoritative database city/version still must match this request.
      if(stored.city_slug!==expected.slug || stored.model_version!==expected.version || result?.model_version!==expected.version ||
        (result.city!==undefined && result.city!==input.city) || (result.model_id!==undefined && result.model_id!==expected.modelId) ||
        (input.city==='Marrakech' && (result.city!==input.city || result.model_id!==expected.modelId))) throw new PublicError('SERVICE_UNAVAILABLE',503);
      return safeResponse({ ...result,estimation_event_id:String(stored.id),guest:!user });
    }
    if (!user) {
      const result = await query('SELECT public.phase_c_reserve_guest($1,$2,$3,$4,$5,$6) AS decision',[tokenHash,identity.device,identity.network,body.request_id,days,boundedSetting('GUEST_NETWORK_DAILY_CAP',8)]);
      const decision = result.rows[0]?.decision;
      if (decision !== 'ALLOWED') throw new PublicError(decision === 'GUEST_TRIAL_EXPIRED' ? 'GUEST_TRIAL_CONSUMED' : decision || 'SERVICE_UNAVAILABLE',decision === 'RATE_LIMITED' ? 429 : 403);
    }
    let prediction:Record<string,unknown>;
    try { prediction=await invokeInference('estimate',input); }
    catch(error) {
      if (!user) await query('SELECT public.phase_c_release_guest($1,$2)',[tokenHash,body.request_id]).catch(()=>{});
      throw error;
    }
    try {
      const result = await query('SELECT public.phase_c_complete_estimation($1,$2,$3,$4::jsonb,$5::jsonb,$6::text) AS id',[tokenHash,body.request_id,user?.id || null,JSON.stringify(input),JSON.stringify(prediction),locale]);
      return safeResponse({ ...prediction,estimation_event_id:String(result.rows[0].id),guest:!user });
    } catch {
      if (!user) await query('SELECT public.phase_c_release_guest($1,$2)',[tokenHash,body.request_id]).catch(()=>{});
      console.error('PHASE_C_PERSISTENCE_DEGRADED');
      throw new PublicError('SERVICE_UNAVAILABLE',503);
    }
  } catch(error) { return errorResponse(error); }
}
