'use client';

import dynamic from 'next/dynamic';
import type { PassportExportSource } from '@/lib/account/passport-export';

const ClientActions=dynamic(()=>import('@/components/account/PassportExportActionsClient').then(module=>module.PassportExportActionsClient),{ssr:false});

export function PassportExportActions({event,locale}:{event:PassportExportSource;locale:string}){
  return <ClientActions event={event} locale={locale}/>;
}
