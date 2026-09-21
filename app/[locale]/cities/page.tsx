import type { Metadata } from 'next';
import { CasablancaSpotlight } from '@/components/city/CasablancaSpotlight';
import { PageContainer, Section, SectionHeading } from '@/components/city/CityFoundation';
import { getDictionary } from '@/lib/i18n/getDictionary';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const copy = getDictionary(params.locale).phase3.cities;
  return { title: `${copy.title} — MaisonDeLUX`, description: copy.subtitle };
}

export default function CitiesPage({ params }: { params: { locale: string } }) {
  const dict = getDictionary(params.locale);
  const copy = dict.phase3.cities;
  return <div className="pt-16 sm:pt-24"><Section><PageContainer><SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.subtitle} /><div className="mt-8 sm:mt-10"><CasablancaSpotlight locale={params.locale} copy={copy} /></div></PageContainer></Section></div>;
}
