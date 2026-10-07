import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CityEstimator } from '@/components/estimation/CasablancaEstimator';
import { PageContainer, Section, SectionHeading } from '@/components/city/CityFoundation';
import { getCityBySlug } from '@/lib/cities/registry';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { estimatorMetadata } from '@/lib/estimations/contracts';
function estimateCopy(locale: string, citySlug: string) {
  const copy=getDictionary(locale).phase3.estimate;
  return citySlug === 'marrakech' ? {...copy,
    title: locale === 'ar' ? 'التقييم العقاري في مراكش' : 'Estimation immobilière à Marrakech',
    subtitle: locale === 'ar' ? 'صفوا العقار وفق الفئات التي يدعمها نموذج مراكش.' : 'Décrivez le bien selon les catégories prises en charge par le modèle Marrakech.',
  } : copy;
}

export function generateStaticParams() {
  return ['casablanca', 'marrakech'].filter(slug => getCityBySlug(slug)?.estimation.publicEnabled).map(citySlug => ({ citySlug }));
}

export function generateMetadata({ params }: { params: { locale: string; citySlug: string } }): Metadata {
  const copy = estimateCopy(params.locale, params.citySlug);
  return { title: `${copy.title} — MaisonDeLUX`, description: copy.subtitle };
}

export default function CityEstimatePage({ params }: { params: { locale: string; citySlug: string } }) {
  const city = getCityBySlug(params.citySlug);
  if (!city || !['casablanca','marrakech'].includes(city.slug) || !city.estimation.publicEnabled) notFound();
  const copy = estimateCopy(params.locale, params.citySlug);
  const metadata = estimatorMetadata(city.slug === 'marrakech' ? 'Marrakech' : 'Casablanca');
  return <div className="min-h-screen bg-surface-subtle pt-16 sm:pt-24"><Section><PageContainer><SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.subtitle} /><div className="mt-8 sm:mt-10"><CityEstimator locale={params.locale} copy={copy} metadata={metadata} /></div></PageContainer></Section></div>;
}
