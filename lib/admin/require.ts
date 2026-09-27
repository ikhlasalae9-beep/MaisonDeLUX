import 'server-only';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE,verifySessionToken } from './auth';
import { PublicError,safeResponse } from '@/lib/security/http';

export async function requireAdmin(request?:NextRequest) {
  const token=request?request.cookies.get(ADMIN_COOKIE)?.value:cookies().get(ADMIN_COOKIE)?.value;
  if(await verifySessionToken(token))return {userId:null,source:'legacy' as const};
  throw new PublicError('ADMIN_REQUIRED',401);
}
export async function adminGate(request?:NextRequest){
  try{await requireAdmin(request);return null;}catch(error){return safeResponse({code:'ADMIN_REQUIRED'},error instanceof PublicError?error.status:401);}
}
