import { NextRequest } from 'next/server';
import { accountLists } from '@/lib/account/data';
import { errorResponse, PublicError, safeResponse } from '@/lib/security/http';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
  try {
    const raw=request.nextUrl.searchParams.get('page')||'1';
    if (!/^[1-9][0-9]{0,4}$/.test(raw)) throw new PublicError('INVALID_PAGE');
    return safeResponse(await accountLists(Number(raw)));
  } catch(error) {return errorResponse(error);}
}
