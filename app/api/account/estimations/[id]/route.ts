import { NextRequest } from 'next/server';
import { accountIdentity } from '@/lib/account/data';
import { ownedPassport } from '@/lib/estimations/access';
import { errorResponse,safeResponse } from '@/lib/security/http';
export const dynamic='force-dynamic';
export async function GET(_request:NextRequest,{params}:{params:{id:string}}){
  try{await accountIdentity();const {event}=await ownedPassport(params.id);return safeResponse(event);}catch(error){return errorResponse(error);}
}
