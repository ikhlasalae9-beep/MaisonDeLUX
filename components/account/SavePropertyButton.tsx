'use client';
import { useState } from 'react';
import type { CasablancaPredictPayload } from '@/lib/api/types';
export function SavePropertyButton({input,locale}:{input:CasablancaPredictPayload;locale:string}){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''); const ar=locale==='ar';
  async function save(){setBusy(true);try{const response=await fetch('/api/account/properties',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:`${input.neighborhood} · ${input.area} m²`,input})});if(!response.ok)throw new Error();setMessage(ar?'تم حفظ العقار في فضائك.':'Bien enregistré dans votre espace.');}catch{setMessage(ar?'تعذر الحفظ. تحقق من تسجيل دخولك.':'Enregistrement indisponible. Vérifiez votre connexion.');}finally{setBusy(false);}}
  return <div><button disabled={busy} className="min-h-11 rounded-control border border-border-medium px-4 text-sm font-semibold text-brand-blue disabled:opacity-50" onClick={save}>{ar?'حفظ هذا العقار':'Enregistrer ce bien'}</button>{message?<p role="status" className="mt-2 text-sm">{message}</p>:null}</div>;
}
