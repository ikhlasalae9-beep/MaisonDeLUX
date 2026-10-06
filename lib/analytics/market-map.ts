import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CITY_MARKET_MAPS } from '@/config/city-market';
import { getCasablancaMarketRows, MIN_NEIGHBORHOOD_OBSERVATIONS } from './casablanca';
import { aggregateArrondissements } from './arrondissement-market';

import { selectMarketBoundaries } from './market-geometry';
import type { BoundaryFeature } from './market-geometry';
export { selectMarketBoundaries } from './market-geometry';
export type { BoundaryFeature } from './market-geometry';
export type CityMapSummary = { citySlug: string; geoJsonSource: string; boundaryLevel: string; boundaryCount: number; outlineCount: number; mappedNeighborhoodCount: number; minimumObservations: number } & ReturnType<typeof aggregateArrondissements>;

export function hasBoundaryOutline(feature: BoundaryFeature) {
  return feature.properties['@geometry'] !== 'bounds';
}
export function getCityMapSummary(citySlug: string): CityMapSummary | null {
  const config = CITY_MARKET_MAPS[citySlug];
  // This provider aggregates Casablanca records only; geography is registered independently.
  if (!config || citySlug !== 'casablanca') return null;
  const source = JSON.parse(readFileSync(path.join(process.cwd(), 'public', config.geoJsonSource), 'utf8'));
  const boundaries = selectMarketBoundaries(source.features, config.boundaryLevel);
  const aggregates = aggregateArrondissements(getCasablancaMarketRows(), config.neighborhoodMapping, boundaries.map(feature => feature.id), MIN_NEIGHBORHOOD_OBSERVATIONS);
  return { citySlug, geoJsonSource: config.geoJsonSource, boundaryLevel: config.boundaryLevel, boundaryCount: boundaries.length,
    outlineCount: boundaries.filter(hasBoundaryOutline).length, mappedNeighborhoodCount: aggregates.mappedNeighborhoods.length,
    minimumObservations: MIN_NEIGHBORHOOD_OBSERVATIONS, ...aggregates };
}
