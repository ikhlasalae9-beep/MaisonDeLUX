'use client';
import Link from 'next/link';
import { CardSurface } from '@/components/city/CityFoundation';
export function PassportAccountCTA({ locale, gated=false }: { locale: string; gated?: boolean }) {
  const ar=locale==='ar', next=`/${locale}/account/estimations`;
  return <CardSurface className="p-5 sm:p-6"><h2 className="font-bold">{gated ? (ar ? 'لقد استخدمت تقديرك التجريبي الأول.' : 'Votre première estimation découverte a été utilisée.') : (ar ? 'احفظ هذا الجواز العقاري' : 'Sauvegarder ce Passeport')}</h2>
    <p className="mt-2 text-sm leading-6 text-text-secondary">{gated ? (ar ? 'أنشئ فضاءك MaisonDeLUX مجاناً للمتابعة.' : 'Créez gratuitement votre espace MaisonDeLUX pour continuer.') : (ar ? 'أنشئ فضاءك مجاناً لاسترجاع هذا التقدير وحفظ عقاراتك ومواصلة تقديراتك.' : 'Créez gratuitement votre espace MaisonDeLUX pour retrouver cette estimation, enregistrer vos biens et continuer vos estimations.')}</p>
    <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-brand-blue"><Link className="inline-flex min-h-11 items-center" href={`/${locale}/auth/signup?next=${encodeURIComponent(next)}`}>{ar?'إنشاء فضائي':'Créer mon espace'}</Link><Link className="inline-flex min-h-11 items-center" href={`/${locale}/auth/login?next=${encodeURIComponent(next)}`}>{ar?'تسجيل الدخول':'Se connecter'}</Link></div>
  </CardSurface>;
}
