'use client';

import { useEffect,useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft,ArrowRight } from 'lucide-react';
import { CasablancaEstimateResult } from '@/components/estimation/CasablancaEstimateResult';
import { PassportExportActions } from '@/components/account/PassportExportActions';
import { fetchCasablancaContext } from '@/lib/api/client';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { propertyTypeLabel } from '@/lib/account/presentation';
import manifest from '@/models/casablanca/v1/preprocessing.json';

export function SavedPassport({locale,id}:{locale:string;id:string}){
  const [event,setEvent]=useState<any>(null),[failed,setFailed]=useState(false),[loading,setLoading]=useState(false);
  useEffect(()=>{let alive=true;void fetch(`/api/account/estimations/${id}`,{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then(async item=>{
    if(!alive)return;setEvent(item);if(!item.context){setLoading(true);try{const context=await fetchCasablancaContext(item.input_features,id);if(alive)setEvent({...item,context});}catch{/* Historical Passport remains available without optional context. */}finally{if(alive)setLoading(false);}}
  }).catch(()=>{if(alive)setFailed(true);});return()=>{alive=false;};},[id]);
  if(failed)return <div role="alert" className="rounded-card border border-border-subtle bg-surface p-6"><p className="font-bold">{locale==='ar'?'الجواز العقاري غير متاح.':'Passeport immobilier indisponible.'}</p><Link href={`/${locale}/account/passports`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-blue">{locale==='ar'?'العودة إلى جوازاتي':'Retour à mes Passeports'}</Link></div>;
  if(!event)return <div role="status" aria-label={locale==='ar'?'جارٍ التحميل':'Chargement'} className="space-y-4"><div className="h-10 w-2/3 animate-pulse rounded bg-surface-subtle"/><div className="h-72 animate-pulse rounded-card bg-surface"/></div>;
  const ar=locale==='ar',DirectionIcon=ar?ArrowLeft:ArrowRight;
  const prediction={...event.prediction,...event.context,estimated_price_mad:Number(event.estimated_price_mad),model_version:event.model_version,estimation_event_id:id,guest:false};
  return <article className="passport-print-root space-y-6">
    <div className="print-only mb-8"><Image src="/brand/logo/maisondelux-logo-horizontal.png" alt="MaisonDeLUX" width={230} height={52}/><p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-brand-blue">{ar?'جواز عقاري':'Passeport Immobilier'}</p></div>
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-blue">{ar?'جواز عقاري MaisonDeLUX':'Passeport Immobilier MaisonDeLUX'}</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"><bdi dir="ltr">{event.input_features.neighborhood}</bdi> · {propertyTypeLabel(event.input_features.property_type,locale)}</h1><p className="mt-2 text-sm text-text-secondary">Casablanca · {ar?'تقييم عقاري محفوظ':'Évaluation immobilière enregistrée'}</p></div><Link href={`/${locale}/account/passports`} className="no-print inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-blue">{ar?'كل جوازاتي':'Tous mes Passeports'}<DirectionIcon className="h-4 w-4"/></Link></header>
    <PassportExportActions event={event} locale={locale}/>
    <CasablancaEstimateResult completed={{inputFeatures:event.input_features,estimatedAt:event.created_at,prediction}} supported={{property_types:Object.keys(manifest.categorical.Type.accepted),neighborhoods:manifest.categorical.Localisation.accepted,current_states:manifest.categorical.Current_state.accepted,ages:manifest.categorical.Age.accepted}} contextLoading={loading} locale={locale} copy={getDictionary(locale).phase3.estimate} onEdit={()=>window.location.assign(`/${locale}/cities/casablanca/estimate`)} inAccount/>
  </article>;
}
