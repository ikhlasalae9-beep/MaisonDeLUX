import { NextRequest } from 'next/server';
import { accountIdentity } from '@/lib/account/data';
import { eventId } from '@/lib/security/model-input';
import { errorResponse,jsonBody,PublicError,safeResponse,sameOrigin } from '@/lib/security/http';
export async function POST(request:NextRequest){
  try{sameOrigin(request);const {user,client}=await accountIdentity();const body=await jsonBody(request,['items']);
    if(!Array.isArray(body.items)||body.items.length<2||body.items.length>3)throw new PublicError('INVALID_SELECTION');
    const seen=new Set<string>();
    const rows=[];
    for(const item of body.items){
      if(!item||item.kind!=='passport'||!eventId(item.id)||seen.has(`passport:${item.id}`))throw new PublicError('INVALID_SELECTION');
      seen.add(`${item.kind}:${item.id}`);
      const result=await client.from('estimation_events').select('id,input_features,estimated_price_mad,created_at').eq('user_id',user.id).eq('is_test',false).eq('id',item.id).maybeSingle();
      if(result.error)throw new Error('DATA_UNAVAILABLE');if(!result.data)throw new PublicError('NOT_FOUND',404);
      rows.push({...result.data,kind:'passport'});
    }
    return safeResponse({rows});
  }catch(error){return errorResponse(error);}
}
