'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PostAuthRedirect({destination}:{destination:string}){
  const router=useRouter();
  useEffect(()=>{const timer=window.setTimeout(()=>router.replace(destination),900);return()=>window.clearTimeout(timer);},[destination,router]);
  return null;
}
