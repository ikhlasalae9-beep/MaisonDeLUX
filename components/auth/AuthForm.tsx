'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';
import { safeDestination } from '@/lib/auth/config';
import { Button } from '@/components/common/Button';
import { CardSurface } from '@/components/city/CityFoundation';
import { BrandLogo } from '@/components/common/BrandLogo';

export function AuthForm({ locale, mode }: { locale: string; mode: string }) {
  const ar = locale === 'ar', search = useSearchParams(), primary = mode === 'login' || mode === 'signup';
  const next = safeDestination(search.get('next'), locale);
  const [busy, setBusy] = useState(false), [showPassword,setShowPassword]=useState(false);
  const [message, setMessage] = useState(search.get('error') ? (ar ? 'الرابط غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً.' : 'Le lien est invalide ou expiré. Demandez un nouveau lien.') : '');
  const title = mode === 'signup' ? (ar ? 'أنشئ فضاءك العقاري' : 'Créez votre espace immobilier') : mode === 'login' ? (ar ? 'سجّل الدخول إلى فضائك' : 'Retrouvez votre espace') : mode === 'forgot-password' ? (ar ? 'استعادة كلمة المرور' : 'Mot de passe oublié') : (ar ? 'كلمة مرور جديدة' : 'Nouveau mot de passe');
  const subtitle=mode==='signup'?(ar?'تقديراتك وجوازاتك وعقاراتك في مكان واحد.':'Vos estimations, Passeports et biens réunis au même endroit.'):mode==='login'?(ar?'واصل تقديراتك واسترجع محفوظاتك بأمان.':'Continuez vos estimations et retrouvez votre historique en toute sécurité.'):(ar?'سنرشدك خلال الخطوات التالية بأمان.':'Nous vous guidons simplement pour sécuriser votre accès.');
  const submitLabel=mode==='signup'?(ar?'إنشاء فضائي':'Créer mon espace'):mode==='login'?(ar?'تسجيل الدخول':'Se connecter'):title;
  const benefits=ar?['واصل تقديراتك','احفظ جوازاتك العقارية','استرجع سجلّك','سجّل عقاراتك وقارنها']:['Continuez vos estimations','Sauvegardez vos Passeports','Retrouvez votre historique','Enregistrez et comparez vos biens'];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale, next, email: fields.get('email') || undefined, password: fields.get('password') || undefined, display_name: fields.get('display_name') || undefined }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.code === 'RATE_LIMITED' ? (ar ? 'محاولات كثيرة. حاول لاحقاً.' : 'Trop de tentatives. Réessayez plus tard.') : (ar ? 'تعذر إتمام الطلب. تحقق من المعلومات وحاول مجدداً.' : 'Impossible de terminer la demande. Vérifiez vos informations et réessayez.')); return; }
      if (result.redirect) { window.location.assign(result.redirect); return; }
      setMessage(ar ? 'إذا كانت المعلومات صالحة، ستتلقى رسالة لمتابعة العملية. تحقق من بريدك الإلكتروني.' : 'Si les informations le permettent, un e-mail vous sera envoyé pour continuer. Consultez votre messagerie.');
    } catch { setMessage(ar ? 'الخدمة غير متاحة مؤقتاً.' : 'Service momentanément indisponible.'); }
    finally { setBusy(false); }
  }
  const form=<div className="p-6 sm:p-9 lg:p-10">
    <div className="mb-7"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue"><LockKeyhole className="h-5 w-5" /></span><h1 className="mt-5 text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{title}</h1><p className="mt-2 text-sm leading-6 text-text-secondary">{subtitle}</p></div>
    <form onSubmit={submit}><fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
      {mode === 'signup' ? <Field label={ar?'الاسم المعروض':'Nom affiché'}><input name="display_name" maxLength={80} autoComplete="name" className="auth-input" /></Field> : null}
      {mode !== 'reset-password' ? <Field label={ar?'البريد الإلكتروني':'Adresse e-mail'}><input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" dir="ltr" className="auth-input" /></Field> : null}
      {mode !== 'forgot-password' ? <Field label={ar?'كلمة المرور':'Mot de passe'} hint={mode!=='login'?(ar?'12 حرفاً على الأقل':'12 caractères minimum'):undefined}><div className="relative"><input name="password" type={showPassword?'text':'password'} required minLength={mode==='login'?1:12} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} dir="ltr" className="auth-input pe-12" /><button type="button" onClick={()=>setShowPassword(value=>!value)} className="absolute inset-y-0 end-1 flex min-h-11 w-11 items-center justify-center text-text-muted" aria-label={showPassword?(ar?'إخفاء كلمة المرور':'Masquer le mot de passe'):(ar?'إظهار كلمة المرور':'Afficher le mot de passe')}>{showPassword?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div></Field> : null}
      {mode==='login'?<div className="text-end"><Link className="text-sm font-semibold text-brand-blue hover:underline" href={`/${locale}/auth/forgot-password`}>{ar?'نسيت كلمة المرور؟':'Mot de passe oublié ?'}</Link></div>:null}
      <Button type="submit" loading={busy} className="min-h-12 w-full">{busy?(ar?'جارٍ المعالجة…':'Traitement en cours…'):submitLabel}</Button>
    </fieldset></form>
    {message ? <p role="status" className="mt-5 rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm leading-6 text-text-primary">{message}</p> : null}
    <p className="mt-7 text-center text-sm text-text-secondary">{mode==='login'?(ar?'ليس لديك فضاء بعد؟':'Pas encore d’espace ?'):(ar?'لديك فضاء بالفعل؟':'Vous avez déjà un espace ?')} {' '}<Link className="font-bold text-brand-blue hover:underline" href={`/${locale}/auth/${mode==='login'?'signup':'login'}?next=${encodeURIComponent(next)}`}>{mode==='login'?(ar?'إنشاء فضائي':'Créer mon espace'):(ar?'تسجيل الدخول':'Se connecter')}</Link></p>
  </div>;
  if(!primary)return <CardSurface className="mx-auto max-w-xl overflow-hidden">{form}</CardSurface>;
  return <CardSurface className="mx-auto grid max-w-5xl overflow-hidden lg:grid-cols-[.92fr_1.08fr]">
    <aside className="relative hidden overflow-hidden bg-[#0b1628] p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"/><div className="relative"><BrandLogo locale={locale} size="compact" inverse /><span className="mt-14 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-blue-100"><Sparkles className="h-3.5 w-3.5"/>{ar?'فضاؤك العقاري الذكي':'Votre espace immobilier intelligent'}</span><h2 className="mt-6 text-3xl font-black leading-tight !text-white">{ar?'حوّل كل تقدير إلى قرار أوضح.':'Transformez chaque estimation en décision plus claire.'}</h2></div><ul className="relative mt-10 space-y-3">{benefits.map(item=><li key={item} className="flex items-center gap-3 text-sm text-blue-50/90"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-400/15 text-blue-200"><Check className="h-3.5 w-3.5"/></span>{item}</li>)}</ul></aside>
    {form}
  </CardSurface>;
}

function Field({label,hint,children}:{label:string;hint?:string;children:React.ReactNode}) { return <label className="block"><span className="mb-2 block text-sm font-bold text-text-primary">{label}</span>{children}{hint?<span className="mt-2 block text-xs text-text-muted">{hint}</span>:null}</label>; }
