import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CITY_REGISTRY } from '@/config/cities.config';
import { getCityBySlug, cityMarketPath } from '@/lib/cities/registry';
import { analyticsForCity } from '@/lib/analytics/registry';
import { CasablancaMarketIntelligence } from '@/components/market/CasablancaMarketIntelligence';
import { getCityMapSummary } from '@/lib/analytics/market-map';
import { LOCALES } from '@/lib/i18n/config';

export const revalidate = false;
export function generateStaticParams() {
  return CITY_REGISTRY.filter(city => city.cityPage.publicVisible && city.market.publicEnabled).map(city => ({ citySlug: city.slug }));
}
export function generateMetadata({ params }: { params: { locale: string; citySlug: string } }): Metadata {
  const city = getCityBySlug(params.citySlug);
  if (!city) return {};
  return { title: `${params.locale === 'ar' ? 'ذكاء السوق — ' + city.nameAr : 'Intelligence du marché — ' + city.nameFr} | MaisonDeLUX`,
    alternates: { canonical: `https://www.maison-delux.com${cityMarketPath(params.locale, city.slug)}`,
      languages: Object.fromEntries(LOCALES.map(locale => [locale, `https://www.maison-delux.com${cityMarketPath(locale, city.slug)}`])) } };
}
export default function CityMarketPage({ params }: { params: { locale: string; citySlug: string } }) {
  const city = getCityBySlug(params.citySlug);
  if (!LOCALES.includes(params.locale as any) || !city?.cityPage.publicVisible || !city.market.publicEnabled || !city.market.analyticsRef) notFound();
  const analytics = analyticsForCity(city.market.analyticsRef);
  if (!analytics) notFound();
  return <CasablancaMarketIntelligence data={analytics.market()} locale={params.locale} citySlug={city.slug} mapSummary={getCityMapSummary(city.slug)}/>;
}
