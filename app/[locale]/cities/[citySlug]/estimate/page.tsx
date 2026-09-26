import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CasablancaEstimator } from '@/components/estimation/CasablancaEstimator';
import { PageContainer, Section, SectionHeading } from '@/components/city/CityFoundation';
import { getCityBySlug } from '@/lib/cities/registry';
import { getDictionary } from '@/lib/i18n/getDictionary';
import type { CasablancaMetadata } from '@/lib/api/types';
import modelMetadata from '@/models/casablanca/v1/metadata.json';
import preprocessing from '@/models/casablanca/v1/preprocessing.json';

const casablancaFormScope: CasablancaMetadata = {
  city: 'Casablanca',
  status: 'available',
  public_enabled: true,
  model_version: modelMetadata.model_version,
  supported: {
    property_types: Object.keys(preprocessing.categorical.Type.accepted),
    neighborhoods: [...preprocessing.categorical.Localisation.accepted],
    current_states: [...preprocessing.categorical.Current_state.accepted],
    ages: [...preprocessing.categorical.Age.accepted],
  },
};

export function generateMetadata({ params }: { params: { locale: string; citySlug: string } }): Metadata {
  const copy = getDictionary(params.locale).phase3.estimate;
  return { title: `${copy.title} — MaisonDeLUX`, description: copy.subtitle };
}

export default function CityEstimatePage({ params }: { params: { locale: string; citySlug: string } }) {
  const city = getCityBySlug(params.citySlug);
  if (!city || city.slug !== 'casablanca' || !city.estimation.publicEnabled) notFound();
  const copy = getDictionary(params.locale).phase3.estimate;
  return <div className="min-h-screen bg-surface-subtle pt-16 sm:pt-24"><Section><PageContainer><SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.subtitle} /><div className="mt-8 sm:mt-10"><CasablancaEstimator locale={params.locale} copy={copy} metadata={casablancaFormScope} /></div></PageContainer></Section></div>;
}
