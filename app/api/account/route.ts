import { NextRequest } from 'next/server';
import { accountLists } from '@/lib/account/data';
import { accountIdentity } from '@/lib/account/data';
import { errorResponse, jsonBody, PublicError, safeResponse, sameOrigin } from '@/lib/security/http';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
  try {
    const raw=request.nextUrl.searchParams.get('page')||'1';
    if (!/^[1-9][0-9]{0,4}$/.test(raw)) throw new PublicError('INVALID_PAGE');
    return safeResponse(await accountLists(Number(raw)));
  } catch(error) {return errorResponse(error);}
}
export async function PATCH(request:NextRequest) {
  try {
    sameOrigin(request);
    const {user,client}=await accountIdentity();
    const body=await jsonBody(request,['display_name']);
    if(typeof body.display_name!=='string'||body.display_name.trim().length>80)throw new PublicError('INVALID_DISPLAY_NAME');
    const result=await client.from('profiles').update({display_name:body.display_name.trim()}).eq('user_id',user.id).select('display_name').single();
    if(result.error)throw new Error('PROFILE_UPDATE_FAILED');
    return safeResponse({profile:result.data});
  }catch(error){return errorResponse(error);}
}
