'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, MapPin } from 'lucide-react';
import { CityStatusBadge } from '@/components/city/CityFoundation';

export function CasablancaSpotlight({ locale, copy }: { locale: string; copy: any }) {
  const [modelOnline, setModelOnline] = useState(false);
  const [checked, setChecked] = useState(false);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/ml/metadata', { cache: 'no-store', signal: controller.signal })
      .then((response) => { setModelOnline(response.ok); setChecked(true); })
      .catch(() => { setModelOnline(false); setChecked(true); });
    return () => controller.abort();
  }, []);

  const futureMessage = locale === 'ar'
    ? 'قريباً، ستنضم مدن مغربية أخرى إلى MaisonDeLUX.'
    : 'D’autres villes marocaines rejoindront prochainement MaisonDeLUX.';
  const offlineMessage = locale === 'ar'
    ? 'خدمة التقييم متوقفة مؤقتاً إلى حين عودة اتصال النموذج المحلي.'
    : 'L’estimation est momentanément suspendue jusqu’au rétablissement du modèle local.';

  return <div className="space-y-8">
    <article className="grid overflow-hidden rounded-media border border-border-subtle bg-surface shadow-card lg:grid-cols-[1.08fr_.92fr]">
      <div className="relative aspect-[4/3] min-h-[240px] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[520px]">
        <Image src="/media/cities/casablanca/casa-image1.jpg" alt={locale === 'ar' ? 'الدار البيضاء والواجهة الأطلسية' : 'Casablanca et sa façade atlantique'} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08111f]/65 via-transparent to-transparent" />
        <p className="absolute bottom-5 start-5 rounded-full bg-[#08111f]/75 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md"><MapPin className="me-2 inline h-3.5 w-3.5" />Casablanca-Settat</p>
      </div>
      <div className="flex flex-col justify-center p-5 sm:p-10 lg:p-12">
        <div className="flex flex-wrap items-center gap-3">
          <CityStatusBadge status={modelOnline ? 'available' : checked ? 'unavailable' : 'prepared'}>{modelOnline ? copy.available : checked ? (locale === 'ar' ? 'غير متاح مؤقتاً' : 'Indisponible temporairement') : (locale === 'ar' ? 'جارٍ التحقق' : 'Vérification…')}</CityStatusBadge>
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-text-muted"><Building2 className="me-1.5 inline h-4 w-4" />{locale === 'ar' ? 'النموذج المحلي' : 'Modèle local'}</span>
        </div>
        <h2 className="mt-5 text-3xl font-bold text-text-primary sm:mt-6 sm:text-5xl">{locale === 'ar' ? 'الدار البيضاء' : 'Casablanca'}</h2>
        <p className="mt-4 text-[15px] leading-7 text-text-secondary sm:mt-5 sm:text-base sm:leading-8">{locale === 'ar' ? 'اكتشفوا الحاضرة الأطلسية وعمارتها وأحياءها، وافهموا بدقة نطاق التقييم الإحصائي المتاح.' : 'Découvrez la métropole atlantique, son architecture et ses quartiers, puis comprenez précisément le périmètre de l’estimation statistique disponible.'}</p>
        <div className="mt-6 flex flex-col gap-3 min-[380px]:flex-row sm:mt-8">
          <Link href={`/${locale}/cities/casablanca`} className="inline-flex items-center justify-center gap-2 rounded-control bg-[#101b2d] px-5 py-3 font-semibold text-white transition hover:bg-brand-blue dark:bg-white dark:text-[#101b2d]">{copy.discover}<Arrow className="h-4 w-4" /></Link>
          {modelOnline ? <Link href={`/${locale}/cities/casablanca/estimate`} className="inline-flex items-center justify-center rounded-control border border-border-medium px-5 py-3 font-semibold text-text-primary transition hover:bg-surface-subtle">{locale === 'ar' ? 'تقييم عقار' : 'Estimer un bien'}</Link> : null}
        </div>
        {checked && !modelOnline ? <p className="mt-4 text-sm leading-6 text-status-warning">{offlineMessage}</p> : null}
      </div>
    </article>
    <div className="rounded-card border border-dashed border-border-medium bg-surface-subtle px-4 py-4 text-center text-sm leading-6 text-text-secondary sm:px-6 sm:py-5">{futureMessage}</div>
  </div>;
}
