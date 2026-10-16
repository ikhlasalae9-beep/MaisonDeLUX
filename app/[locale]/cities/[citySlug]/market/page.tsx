import { getRabatMarketAnalytics } from '@/lib/analytics/rabat';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CITY_REGISTRY } from '@/config/cities.config';
import { getCityBySlug, cityMarketPath } from '@/lib/cities/registry';
import { analyticsForCity } from '@/lib/analytics/registry';
import { CityMarketIntelligence } from '@/components/market/CityMarketIntelligence';
import { CITY_MARKET_MAPS } from '@/config/city-market';
import { getCityMapSummary } from '@/lib/analytics/market-map';
import { LOCALES } from '@/lib/i18n/config';
import { getMarrakechMarketAnalytics } from '@/lib/analytics/marrakech';
import { MarrakechMarketIntelligence } from '@/components/market/MarrakechMarketIntelligence';

export const revalidate = false;
export function generateStaticParams() {
  return CITY_REGISTRY.filter(city => city.cityPage.publicVisible && city.market.publicEnabled).map(city => ({ citySlug: city.slug }));
}
export function generateMetadata({ params }: { params: { locale: string; citySlug: string } }): Metadata {
  const city = getCityBySlug(params.citySlug);
  if (!city) return {};
  const pending = !city.market.publicEnabled;
  return { ...(pending ? { robots: { index: false, follow: false } } : {}), title: `${params.locale === 'ar' ? 'ذكاء السوق — ' + city.nameAr : 'Intelligence du marché — ' + city.nameFr} | MaisonDeLUX`,
    alternates: { canonical: `https://www.maison-delux.com${cityMarketPath(params.locale, city.slug)}`,
      languages: Object.fromEntries(LOCALES.map(locale => [locale, `https://www.maison-delux.com${cityMarketPath(locale, city.slug)}`])) } };
}
export default function CityMarketPage({ params }: { params: { locale: string; citySlug: string } }) {
  const city = getCityBySlug(params.citySlug);
  if (!LOCALES.includes(params.locale as any) || !city?.cityPage.publicVisible) notFound();
  const geography = CITY_MARKET_MAPS[city.slug];
  if ((city.slug === 'marrakech' || city.slug === 'rabat') && city.market.publicEnabled) {
    try {
      const data = city.slug === 'rabat' ? getRabatMarketAnalytics() : getMarrakechMarketAnalytics();
      let mapSummary = null;
      try { mapSummary = getCityMapSummary(city.slug); }
      catch { console.error('City geographical attribution unavailable or invalid'); }
      return <MarrakechMarketIntelligence citySlug={city.slug} data={data} locale={params.locale} mapSummary={mapSummary} />;
    } catch {
      // Fail closed: never substitute another city's cohort or zero-valued KPIs.
      console.error('City market snapshot unavailable or invalid');
      return <MarrakechMarketIntelligence citySlug={city.slug} data={null} locale={params.locale} />;
    }
  }
  if (!city.market.publicEnabled || !city.market.analyticsRef) {
    if (!geography) notFound();
    return <CityMarketIntelligence data={null} locale={params.locale} citySlug={city.slug} mapSummary={null} geography={geography} />;
  }
  const analytics = analyticsForCity(city.market.analyticsRef);
  if (!analytics) notFound();
  return <CityMarketIntelligence data={analytics.market()} locale={params.locale} citySlug={city.slug} mapSummary={getCityMapSummary(city.slug)}/>;
}
