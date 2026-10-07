'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download,FileDown,Plus,Scale } from 'lucide-react';
import { downloadPassportPdf,downloadPassportPng,type PassportExportSource } from '@/lib/account/passport-export';

export function PassportExportActionsClient({event,locale}:{event:PassportExportSource;locale:string}){
  const ar=locale==='ar',[preparing,setPreparing]=useState<'pdf'|'png'|null>(null),[error,setError]=useState('');
  async function generate(kind:'pdf'|'png'){
    if(preparing)return;setPreparing(kind);setError('');
    try{if(kind==='pdf')await downloadPassportPdf(event,locale);else await downloadPassportPng(event,locale);}
    catch{setError(ar?'تعذر إنشاء الملف. حاول مجدداً.':'Impossible de générer le fichier. Réessayez.');}
    finally{setPreparing(null);}
  }
  return <div className="no-print"><div className="flex flex-wrap gap-3">
    <button type="button" disabled={preparing!==null} onClick={()=>generate('pdf')} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-blue px-4 text-sm font-bold text-white disabled:opacity-50"><FileDown className="h-4 w-4"/>{preparing==='pdf'?(ar?'جارٍ تحضير PDF…':'Préparation du PDF…'):(ar?'تنزيل الجواز':'Télécharger le Passeport')}</button>
    <button type="button" disabled={preparing!==null} onClick={()=>generate('png')} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-medium bg-surface px-4 text-sm font-bold text-text-primary disabled:opacity-50"><Download className="h-4 w-4"/>{preparing==='png'?(ar?'جارٍ تحضير PNG…':'Préparation du PNG…'):(ar?'تنزيل البطاقة':'Télécharger la carte')}</button>
    <Link href={`/${locale}/cities/${event.input_features.city?.toLowerCase() || 'casablanca'}/estimate`} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-medium px-4 text-sm font-bold text-text-primary"><Plus className="h-4 w-4"/>{ar?'تقدير جديد':'Nouvelle estimation'}</Link>
    <Link href={`/${locale}/account/compare`} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-medium px-4 text-sm font-bold text-text-primary"><Scale className="h-4 w-4"/>{ar?'مقارنة':'Comparer'}</Link>
  </div>{error?<p role="alert" className="mt-3 text-sm text-status-danger">{error}</p>:null}</div>;
}
