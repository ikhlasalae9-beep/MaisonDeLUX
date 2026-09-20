import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CasablancaEstimator } from '@/components/estimation/CasablancaEstimator';
import { PageContainer, Section, SectionHeading } from '@/components/city/CityFoundation';
import { getCityBySlug } from '@/lib/cities/registry';
import { getDictionary } from '@/lib/i18n/getDictionary';

export function generateMetadata({ params }: { params: { locale: string; citySlug: string } }): Metadata {
  const copy = getDictionary(params.locale).phase3.estimate;
  return { title: `${copy.title} — MaisonDeLUX`, description: copy.subtitle };
}

export default function CityEstimatePage({ params }: { params: { locale: string; citySlug: string } }) {
  const city = getCityBySlug(params.citySlug);
  if (!city || city.slug !== 'casablanca' || !city.estimation.publicEnabled) notFound();
  const copy = getDictionary(params.locale).phase3.estimate;
  return <div className="min-h-screen bg-surface-subtle pt-24 sm:pt-28"><Section><PageContainer><SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.subtitle} /><div className="mt-10"><CasablancaEstimator locale={params.locale} copy={copy} /></div></PageContainer></Section></div>;
}
