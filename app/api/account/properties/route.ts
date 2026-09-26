import { NextRequest } from 'next/server';
import { accountIdentity } from '@/lib/account/data';
import { query } from '@/lib/admin/db';
import { rateLimit } from '@/lib/security/service';
import { validateModelInput } from '@/lib/security/model-input';
import { errorResponse,jsonBody,PublicError,safeResponse,sameOrigin } from '@/lib/security/http';
export async function POST(request:NextRequest) {
  try {
    sameOrigin(request); const {user,client}=await accountIdentity();
    await rateLimit('save-property',user.id,30);
    const body=await jsonBody(request,['label','input']);
    if (typeof body.label!=='string'||!body.label.trim()||body.label.length>100) throw new PublicError('INVALID_LABEL');
    let input;try{input=validateModelInput(body.input);}catch{throw new PublicError('INVALID_INPUT');}
    const city=(await query("SELECT id FROM public.cities WHERE slug='casablanca' AND public_enabled=true")).rows[0];
    if (!city) throw new PublicError('INVALID_CITY');
    const result=await client.from('saved_properties').insert({user_id:user.id,city_id:city.id,label:body.label.trim(),input_features:input}).select('id').single();
    if (result.error) throw new Error('PROPERTY_SAVE_FAILED');
    return safeResponse({id:result.data.id},201);
  }catch(error){return errorResponse(error);}
}
