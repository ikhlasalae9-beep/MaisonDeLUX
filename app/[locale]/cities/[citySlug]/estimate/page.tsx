import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CityEstimator } from '@/components/estimation/CasablancaEstimator';
import { PageContainer, Section, SectionHeading } from '@/components/city/CityFoundation';
import { getCityBySlug } from '@/lib/cities/registry';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { estimatorMetadata } from '@/lib/estimations/contracts';
export function generateStaticParams() {
  return [{ citySlug: 'casablanca' }];
}

export function generateMetadata({ params }: { params: { locale: string; citySlug: string } }): Metadata {
  const copy = getDictionary(params.locale).phase3.estimate;
  return { title: `${copy.title} — MaisonDeLUX`, description: copy.subtitle };
}

export default function CityEstimatePage({ params }: { params: { locale: string; citySlug: string } }) {
  const city = getCityBySlug(params.citySlug);
  if (!city || !['casablanca','marrakech'].includes(city.slug) || !city.estimation.publicEnabled) notFound();
  const copy = getDictionary(params.locale).phase3.estimate;
  const metadata = estimatorMetadata(city.slug === 'marrakech' ? 'Marrakech' : 'Casablanca');
  return <div className="min-h-screen bg-surface-subtle pt-16 sm:pt-24"><Section><PageContainer><SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.subtitle} /><div className="mt-8 sm:mt-10"><CityEstimator locale={params.locale} copy={copy} metadata={metadata} /></div></PageContainer></Section></div>;
}
