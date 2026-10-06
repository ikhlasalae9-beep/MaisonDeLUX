import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CITY_MARKET_MAPS } from '@/config/city-market';
import { boundaryName, projectMarketBoundaries, selectMarketBoundaries } from '@/lib/analytics/market-geometry';
import { PageContainer, Section, SectionHeading } from './CityFoundation';

/** Administrative context only: no analytics provider, crosswalk or price classes. */
export function CityGeography({ citySlug, locale }: { citySlug: string; locale: string }) {
  const config = CITY_MARKET_MAPS[citySlug];
  if (!config) return null;
  const source = JSON.parse(readFileSync(path.join(process.cwd(), 'public', config.geoJsonSource), 'utf8'));
  const outlines = projectMarketBoundaries(selectMarketBoundaries(source.features, config.boundaryLevel));
  const ar = locale === 'ar';
  return <Section><PageContainer>
    <SectionHeading title={ar ? 'المقاطعات الإدارية' : 'Les arrondissements administratifs'} description={ar ? 'حدود إدارية للاستئناس الجغرافي. لا تمثل أسعاراً أو إحصاءات عقارية، ولا تحدد انتماء الأحياء إلى المقاطعات.' : 'Des contours pour situer la ville. Ils ne représentent ni prix ni statistiques immobilières, et ne constituent pas une correspondance entre quartiers et arrondissements.'} />
    <div className="mt-8 grid items-center gap-8 rounded-media border border-border-subtle bg-surface-subtle p-4 sm:p-8 lg:grid-cols-2">
      <svg viewBox="0 0 800 600" role="img" aria-label={ar ? 'خريطة المقاطعات الإدارية' : 'Carte des arrondissements administratifs'} className="w-full text-brand-blue">
        {outlines.map(({ feature, path: outline }) => <path key={feature.id} d={outline} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" fillRule="evenodd"><title>{boundaryName(feature, locale)}</title></path>)}
      </svg>
      <ul className="space-y-4 text-text-primary">{outlines.map(({ feature }) => <li key={feature.id}>{boundaryName(feature, locale)}</li>)}</ul>
    </div>
    <p className="mt-4 text-xs text-text-muted">© <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap contributors · ODbL</a></p>
  </PageContainer></Section>;
}
