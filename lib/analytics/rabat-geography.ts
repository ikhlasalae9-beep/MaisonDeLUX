import 'server-only';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CITY_MARKET_MAPS } from '@/config/city-market';
import { getRabatMarketRows, RABAT_MIN_OBSERVATIONS } from './rabat';
import { aggregateArrondissements } from './arrondissement-market';
import { selectMarketBoundaries, type BoundaryFeature } from './market-geometry';
import type { CityMapSummary } from './market-map';

/** Ray casting with holes; no nearest-point or fuzzy-name allocation. */
export function rabatPointInside(point: number[], boundary: BoundaryFeature) {
  const ringInside = (ring: number[][]) => {
    let inside = false;
    const [x, y] = point;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  };
  const polygons = boundary.geometry.type === 'Polygon' ? [boundary.geometry.coordinates as number[][][]] : boundary.geometry.coordinates as number[][][][];
  return polygons.some(polygon => ringInside(polygon[0]) && !polygon.slice(1).some(ringInside));
}

export function getRabatMapSummary(): CityMapSummary {
  const config = CITY_MARKET_MAPS.rabat;
  const snapshot = readFileSync('server-data/rabat-market.json');
  const boundaryBytes = readFileSync(`public${config.geoJsonSource}`);
  const geoBytes = readFileSync('data/geographic/rabat-market-reference-points.json');
  const crosswalk = JSON.parse(readFileSync('data/geographic/rabat-market-crosswalk.json', 'utf8'));
  const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  if (crosswalk.schemaVersion !== 1 || crosswalk.city !== 'Rabat' || crosswalk.snapshotSha256 !== hash(snapshot) || crosswalk.boundarySha256 !== hash(boundaryBytes) || crosswalk.geonamesSha256 !== hash(geoBytes)) throw new Error('Stale Rabat geographical evidence');
  const boundaries = selectMarketBoundaries(JSON.parse(boundaryBytes.toString()).features, config.boundaryLevel);
  const geo = JSON.parse(geoBytes.toString()).features;
  const mapping: Record<string, {boundaryId: string}> = {};
  for (const entry of crosswalk.entries) {
    const points = geo.filter((feature: any) => feature.properties.geoname_id === entry.geonamesId && feature.properties.name === entry.label && feature.properties.parent_city === 'Rabat' && feature.geometry.type === 'Point');
    if (mapping[entry.label] || points.length !== 1 || JSON.stringify(points[0].geometry.coordinates) !== JSON.stringify(entry.coordinates) || entry.method !== 'exact-Rabat-label-and-point-in-polygon') throw new Error('Invalid Rabat label evidence');
    const containing = boundaries.filter(boundary => rabatPointInside(entry.coordinates, boundary));
    if (containing.length !== 1 || containing[0].id !== entry.boundaryId) throw new Error('Invalid Rabat spatial attribution');
    mapping[entry.label] = { boundaryId: entry.boundaryId };
  }
  const rows = getRabatMarketRows();
  const result = aggregateArrondissements(rows, mapping, boundaries.map(boundary => boundary.id), RABAT_MIN_OBSERVATIONS);
  const percent = (count: number) => Number((100 * count / rows.length).toFixed(1));
  return { citySlug: 'rabat', geoJsonSource: config.geoJsonSource, boundaryLevel: config.boundaryLevel, boundaryCount: boundaries.length, outlineCount: boundaries.length,
    minimumObservations: RABAT_MIN_OBSERVATIONS, mappedNeighborhoodCount: result.mappedNeighborhoods.length, ...result,
    attribution: { retainedListings: rows.length, unmappedListings: rows.length - result.mappedListings, mappedSharePercent: percent(result.mappedListings), arrondissementShares: Object.fromEntries(result.arrondissements.map(item => [item.boundaryId, percent(item.listingCount)])) } };
}
