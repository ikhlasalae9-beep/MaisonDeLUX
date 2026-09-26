'use client';
import { useParams } from 'next/navigation';
export default function AccountError({reset}:{reset:()=>void}) {
  const ar=useParams().locale==='ar';
  return <section className="mx-auto max-w-xl px-6 py-24 text-center" dir={ar?'rtl':'ltr'}>
    <h1 className="text-2xl font-bold">{ar?'المساحة الشخصية غير متاحة مؤقتاً':'Votre espace est momentanément indisponible'}</h1>
    <p className="mt-4 text-slate-500">{ar?'يرجى إعادة المحاولة بعد قليل.':'Veuillez réessayer dans quelques instants.'}</p>
    <button onClick={reset} className="mt-6 rounded-xl bg-brand-blue px-6 py-3 text-white">{ar?'إعادة المحاولة':'Réessayer'}</button>
  </section>;
}
