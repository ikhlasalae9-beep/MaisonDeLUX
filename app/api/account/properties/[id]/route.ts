import { NextRequest } from 'next/server';
import { accountIdentity } from '@/lib/account/data';
import { uuid } from '@/lib/security/model-input';
import { errorResponse,jsonBody,PublicError,safeResponse,sameOrigin } from '@/lib/security/http';
type Context={params:{id:string}};
export async function GET(_request:NextRequest,{params}:Context){
  try{if(!uuid(params.id))throw new PublicError('NOT_FOUND',404);const {user,client}=await accountIdentity();
    const result=await client.from('saved_properties').select('id,label,input_features').eq('user_id',user.id).eq('id',params.id).maybeSingle();
    if(result.error)throw new Error('DATA_UNAVAILABLE');if(!result.data)throw new PublicError('NOT_FOUND',404);return safeResponse(result.data);
  }catch(error){return errorResponse(error);}
}
export async function PATCH(request:NextRequest,{params}:Context){
  try{sameOrigin(request);if(!uuid(params.id))throw new PublicError('NOT_FOUND',404);const {user,client}=await accountIdentity();const body=await jsonBody(request,['label']);
    if(typeof body.label!=='string'||!body.label.trim()||body.label.length>100)throw new PublicError('INVALID_LABEL');
    const result=await client.from('saved_properties').update({label:body.label.trim()}).eq('user_id',user.id).eq('id',params.id).select('id').maybeSingle();
    if(result.error)throw new Error('DATA_UNAVAILABLE');if(!result.data)throw new PublicError('NOT_FOUND',404);return safeResponse({ok:true});
  }catch(error){return errorResponse(error);}
}
export async function DELETE(request:NextRequest,{params}:Context){
  try{sameOrigin(request);if(!uuid(params.id))throw new PublicError('NOT_FOUND',404);const {user,client}=await accountIdentity();
    const result=await client.from('saved_properties').delete().eq('user_id',user.id).eq('id',params.id).select('id').maybeSingle();
    if(result.error)throw new Error('DATA_UNAVAILABLE');if(!result.data)throw new PublicError('NOT_FOUND',404);return safeResponse({ok:true});
  }catch(error){return errorResponse(error);}
}
