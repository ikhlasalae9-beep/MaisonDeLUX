import 'server-only';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE,verifySessionToken } from './auth';
import { authClient,currentUser } from '@/lib/auth/server';
import { audit } from '@/lib/security/service';
import { PublicError,safeResponse } from '@/lib/security/http';

export async function requireAdmin(request?:NextRequest) {
  const token=request?request.cookies.get(ADMIN_COOKIE)?.value:cookies().get(ADMIN_COOKIE)?.value;
  if(process.env.ADMIN_AUTH_MODE!=='supabase-only'&&await verifySessionToken(token))return {userId:null,source:'legacy' as const};
  const user=await currentUser();
  if(user){
    const {data,error}=await authClient().from('user_roles').select('role').eq('user_id',user.id).single();
    if(!error&&data?.role==='admin')return {userId:user.id,source:'supabase' as const};
  }
  await audit('admin_access_denied',user?.id||null).catch(()=>{});
  throw new PublicError('ADMIN_REQUIRED',user?403:401);
}
export async function adminGate(request?:NextRequest){
  try{await requireAdmin(request);return null;}catch(error){return safeResponse({code:'ADMIN_REQUIRED'},error instanceof PublicError?error.status:401);}
}
