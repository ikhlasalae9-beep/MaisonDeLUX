'use client';
import { useEffect,useState } from 'react';
import { CasablancaEstimateResult } from '@/components/estimation/CasablancaEstimateResult';
import { fetchCasablancaContext } from '@/lib/api/client';
import { getDictionary } from '@/lib/i18n/getDictionary';
import manifest from '@/models/casablanca/v1/preprocessing.json';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
export function SavedPassport({locale,id}:{locale:string;id:string}){
  const [event,setEvent]=useState<any>(null),[failed,setFailed]=useState(false),[loading,setLoading]=useState(false);
  useEffect(()=>{let alive=true;void fetch(`/api/account/estimations/${id}`,{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then(async item=>{
    if(!alive)return;setEvent(item);if(!item.context){setLoading(true);try{const context=await fetchCasablancaContext(item.input_features,id);if(alive)setEvent({...item,context});}catch{/* Historical value stays visible. */}finally{if(alive)setLoading(false);}}
  }).catch(()=>{if(alive)setFailed(true);});return()=>{alive=false;};},[id]);
  if(failed)return <p role="alert">{locale==='ar'?'الجواز غير متاح.':'Passeport indisponible.'}</p>;
  if(!event)return <p role="status">{locale==='ar'?'جارٍ التحميل…':'Chargement…'}</p>;
  const ar=locale==='ar',DirectionIcon=ar?ArrowLeft:ArrowRight;
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-blue">{ar?'تقرير التقدير':'Rapport d’estimation'}</p><h1 className="mt-2 text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{event.input_features.neighborhood} · {event.input_features.property_type}</h1><p className="mt-2 text-sm text-text-secondary">{ar?'تقريرك العقاري المحفوظ في MaisonDeLUX.':'Votre rapport immobilier enregistré dans MaisonDeLUX.'}</p></div><div className="flex flex-wrap gap-3"><Link href={`/${locale}/cities/casablanca/estimate`} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-blue px-4 text-sm font-bold text-white"><Plus className="h-4 w-4"/>{ar?'تقدير جديد':'Nouvelle estimation'}</Link><Link href={`/${locale}/account/estimations`} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-medium px-4 text-sm font-bold text-text-primary">{ar?'تقديراتي':'Mes estimations'}<DirectionIcon className="h-4 w-4"/></Link></div></div><CasablancaEstimateResult completed={{inputFeatures:event.input_features,estimatedAt:event.created_at,prediction:{...event.prediction,...event.context,estimated_price_mad:Number(event.estimated_price_mad),model_version:event.model_version,estimation_event_id:id,guest:false}}} supported={{property_types:Object.keys(manifest.categorical.Type.accepted),neighborhoods:manifest.categorical.Localisation.accepted,current_states:manifest.categorical.Current_state.accepted,ages:manifest.categorical.Age.accepted}} contextLoading={loading} locale={locale} copy={getDictionary(locale).phase3.estimate} onEdit={()=>window.location.assign(`/${locale}/cities/casablanca/estimate?estimation=${id}`)} inAccount/></div>;
}
