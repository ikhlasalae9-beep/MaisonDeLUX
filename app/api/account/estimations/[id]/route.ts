import { NextRequest } from 'next/server';
import { accountIdentity } from '@/lib/account/data';
import { ownedPassport } from '@/lib/estimations/access';
import { errorResponse,safeResponse } from '@/lib/security/http';
import { customerContext } from '@/lib/estimations/customer-context';
export const dynamic='force-dynamic';
export async function GET(_request:NextRequest,{params}:{params:{id:string}}){
  try{await accountIdentity();const {event}=await ownedPassport(params.id);return safeResponse({...event,context:customerContext(event.context)});}catch(error){return errorResponse(error);}
}
