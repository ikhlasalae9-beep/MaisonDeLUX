import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth/server';
import { localeOf, safeDestination, siteOrigin } from '@/lib/auth/config';
import { claimGuest } from '@/lib/security/service';

export const dynamic='force-dynamic';

const allowedTypes=new Set<EmailOtpType>(['email','signup','recovery','email_change']);

function continuation(request:NextRequest,locale:'fr'|'ar',type:EmailOtpType){
  if(type==='recovery')return `/${locale}/auth/reset-password`;
  if(type==='email_change')return `/${locale}/account/profile`;
  let candidate=request.nextUrl.searchParams.get('next');
  const redirectTo=request.nextUrl.searchParams.get('redirect_to');
  if(!candidate&&redirectTo){
    try{
      const parsed=new URL(redirectTo);
      const allowedOrigins=new Set([siteOrigin(),request.nextUrl.origin]);
      if(allowedOrigins.has(parsed.origin)&&parsed.pathname===`/${locale}/auth/callback`)candidate=parsed.searchParams.get('next');
    }catch{/* Invalid provider redirect metadata falls back safely. */}
  }
  return safeDestination(candidate,locale);
}

function resultUrl(request:NextRequest,locale:'fr'|'ar',status:'success'|'error',flow:string,next:string){
  const url=new URL(`/${locale}/auth/confirmed`,request.nextUrl.origin);
  url.searchParams.set('status',status);
  url.searchParams.set('flow',flow);
  if(status==='success')url.searchParams.set('next',next);
  return url;
}

export async function GET(request:NextRequest){
  const locale=localeOf(request.nextUrl.searchParams.get('locale'));
  const tokenHash=request.nextUrl.searchParams.get('token_hash');
  const rawType=request.nextUrl.searchParams.get('type');
  const type=rawType&&allowedTypes.has(rawType as EmailOtpType)?rawType as EmailOtpType:null;
  const next=continuation(request,locale,type||'email');
  if(!tokenHash||tokenHash.length>2048||/[\s\u0000-\u001f]/.test(tokenHash)||!type){
    return NextResponse.redirect(resultUrl(request,locale,'error',type||'email',next),{headers:{'Cache-Control':'private, no-store'}});
  }
  try{
    const {data,error}=await authClient().auth.verifyOtp({token_hash:tokenHash,type});
    if(error||!data.user)throw new Error('INVALID_CONFIRMATION');
    // Confirmation remains successful if optional guest-history claiming is
    // temporarily unavailable; the account layout retries that idempotently.
    await claimGuest(data.user.id).catch(()=>null);
    return NextResponse.redirect(resultUrl(request,locale,'success',type,next),{headers:{'Cache-Control':'private, no-store'}});
  }catch{
    return NextResponse.redirect(resultUrl(request,locale,'error',type,next),{headers:{'Cache-Control':'private, no-store'}});
  }
}
