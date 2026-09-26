'use client';
import { useEffect,useState } from 'react';
import { CasablancaEstimateResult } from '@/components/estimation/CasablancaEstimateResult';
import { fetchCasablancaContext } from '@/lib/api/client';
import { getDictionary } from '@/lib/i18n/getDictionary';
import manifest from '@/models/casablanca/v1/preprocessing.json';
export function SavedPassport({locale,id}:{locale:string;id:string}){
  const [event,setEvent]=useState<any>(null),[failed,setFailed]=useState(false),[loading,setLoading]=useState(false);
  useEffect(()=>{let alive=true;void fetch(`/api/account/estimations/${id}`,{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then(async item=>{
    if(!alive)return;setEvent(item);if(!item.context){setLoading(true);try{const context=await fetchCasablancaContext(item.input_features,id);if(alive)setEvent({...item,context});}catch{/* Historical value stays visible. */}finally{if(alive)setLoading(false);}}
  }).catch(()=>{if(alive)setFailed(true);});return()=>{alive=false;};},[id]);
  if(failed)return <p role="alert">{locale==='ar'?'الجواز غير متاح.':'Passeport indisponible.'}</p>;
  if(!event)return <p role="status">{locale==='ar'?'جارٍ التحميل…':'Chargement…'}</p>;
  return <CasablancaEstimateResult completed={{inputFeatures:event.input_features,estimatedAt:event.created_at,prediction:{...event.prediction,...event.context,estimated_price_mad:Number(event.estimated_price_mad),model_version:event.model_version,estimation_event_id:id,guest:false}}} supported={{property_types:Object.keys(manifest.categorical.Type.accepted),neighborhoods:manifest.categorical.Localisation.accepted,current_states:manifest.categorical.Current_state.accepted,ages:manifest.categorical.Age.accepted}} contextLoading={loading} locale={locale} copy={getDictionary(locale).phase3.estimate} onEdit={()=>window.location.assign(`/${locale}/cities/casablanca/estimate?estimation=${id}`)}/>;
}
