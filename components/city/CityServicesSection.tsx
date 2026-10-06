import type { VerifiedCity } from '@/config/cities.config';
import { PageContainer, Section } from './CityFoundation';
import { CityCapabilityActions } from './CityCapabilityActions';

export function CityServicesSection({ city, locale }: { city: VerifiedCity; locale: string }) {
  const ar = locale === 'ar';
  return <Section><PageContainer><div className="rounded-media bg-[#101b2d] p-6 text-white sm:p-12"><h2 className="text-[clamp(1.75rem,8vw,3.5rem)] leading-tight text-white">{ar ? 'استكشف الخدمات المتاحة' : 'Explorez les services disponibles'}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">{ar ? 'تقديرات العقارات وإحصاءات سوق الإعلانات حسب الخدمات المتاحة لهذه المدينة.' : 'Estimations immobilières et statistiques du marché d’annonces selon les services ouverts dans cette ville.'}</p><CityCapabilityActions city={city} locale={locale}/>
    {!city.estimation.publicEnabled || !city.market.publicEnabled ? <div className="mt-6 flex flex-col gap-3 min-[480px]:flex-row sm:mt-8">
      {!city.estimation.publicEnabled ? <span aria-disabled="true" className="inline-flex min-h-12 items-center justify-center rounded-control border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white/80">{ar ? 'التقييم العقاري متاح قريباً' : 'Estimation bientôt disponible'}</span> : null}
      {!city.market.publicEnabled ? <span aria-disabled="true" className="inline-flex min-h-12 items-center justify-center rounded-control border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white/80">{ar ? 'إحصاءات السوق قيد الإعداد' : 'Statistiques de marché en préparation'}</span> : null}
    </div> : null}
  </div></PageContainer></Section>;
}
