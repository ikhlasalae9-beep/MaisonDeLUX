import { NextRequest } from 'next/server';
import { ownedPassport } from '@/lib/estimations/access';
import { invokeInference } from '@/lib/estimations/gateway';
import { query } from '@/lib/admin/db';
import { boundedSetting } from '@/lib/security/identity';
import { rateLimit } from '@/lib/security/service';
import { errorResponse, jsonBody, PublicError, safeResponse, sameOrigin } from '@/lib/security/http';
import { validateSimulation } from '@/lib/security/model-input';
import { customerContext } from '@/lib/estimations/customer-context';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(request: NextRequest,{params}:{params:{id:string;action:string}}) {
  try {
    sameOrigin(request);
    if (!['context','simulate'].includes(params.action)) throw new PublicError('NOT_FOUND',404);
    const body=await jsonBody(request,params.action==='simulate'?['input']:[]);
    const {event,user,tokenHash}=await ownedPassport(params.id);
    await rateLimit(params.action,user?.id || tokenHash!,boundedSetting(user?'USER_SIMULATION_RATE_LIMIT':'GUEST_SIMULATION_RATE_LIMIT',user?60:15));
    if (params.action==='context') {
      if (event.context) return safeResponse(customerContext(event.context));
      const context=await invokeInference('context',event.input_features);
      await query('UPDATE public.estimation_passports SET context=$2::jsonb WHERE estimation_event_id=$1',[event.id,JSON.stringify(context)]);
      return safeResponse(customerContext(context));
    }
    let input; try {input=validateSimulation(event.input_features,body.input);} catch {throw new PublicError('INVALID_SIMULATION');}
    return safeResponse(await invokeInference('estimate',input));
  } catch(error) {return errorResponse(error);}
}
