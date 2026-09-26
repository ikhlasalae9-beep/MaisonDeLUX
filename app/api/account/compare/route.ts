import { NextRequest } from 'next/server';
import { accountIdentity } from '@/lib/account/data';
import { eventId,uuid } from '@/lib/security/model-input';
import { errorResponse,jsonBody,PublicError,safeResponse,sameOrigin } from '@/lib/security/http';
export async function POST(request:NextRequest){
  try{sameOrigin(request);const {user,client}=await accountIdentity();const body=await jsonBody(request,['items']);
    if(!Array.isArray(body.items)||body.items.length<2||body.items.length>6)throw new PublicError('INVALID_SELECTION');
    const seen=new Set<string>();
    const rows=[];
    for(const item of body.items){
      if(!item||!['estimation','property'].includes(item.kind)||(item.kind==='estimation'?!eventId(item.id):!uuid(item.id))||seen.has(`${item.kind}:${item.id}`))throw new PublicError('INVALID_SELECTION');
      seen.add(`${item.kind}:${item.id}`);
      const table=item.kind==='estimation'?'estimation_events':'saved_properties';
      const fields=item.kind==='estimation'?'id,input_features,estimated_price_mad,created_at':'id,label,input_features,created_at';
      const result=await client.from(table).select(fields).eq('user_id',user.id).eq('id',item.id).maybeSingle();
      if(result.error)throw new Error('DATA_UNAVAILABLE');if(!result.data)throw new PublicError('NOT_FOUND',404);
      rows.push({...result.data,kind:item.kind});
    }
    return safeResponse({rows});
  }catch(error){return errorResponse(error);}
}
