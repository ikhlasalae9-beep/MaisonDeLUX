import 'server-only';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CITY_MARKET_MAPS } from '@/config/city-market';
import { getMarrakechMarketRows, MARRAKECH_DATASET, MARRAKECH_MIN_OBSERVATIONS, type MarrakechObservation } from './marrakech';
import { aggregateArrondissements } from './arrondissement-market';
import { selectMarketBoundaries, type BoundaryFeature } from './market-geometry';
import type { CityMapSummary } from './market-map';

export type MarrakechAttribution = {
  originalNeighborhood: string; normalizedNeighborhood: string; listingCount: number;
  boundaryId: string | null; arrondissement: string | null; administrativeIdentifier: string | null;
  status: 'verified-label-attribution' | 'ambiguous' | 'unverified'; method: string;
  evidence: Array<{ source: string; page: number; anchor: string }>;
  ambiguityNotes: string; geoNamesId?: string;
};
export const normalizeMarrakechNeighborhood = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Exact labels only. A normalized alias is not permission to assign an unresolved label. */
export function aggregateMarrakechGeography(rows: MarrakechObservation[], entries: MarrakechAttribution[], boundaries: BoundaryFeature[], sources: Record<string, unknown>) {
  const ids = new Set<string>();
  const labels = new Set<string>();
  const normalized = new Set<string>();
  const byBoundary = new Map(boundaries.map(boundary => [boundary.id, boundary]));
  const mapping: Record<string, { boundaryId: string }> = {};
  for (const entry of entries) {
    if (labels.has(entry.originalNeighborhood) || normalized.has(entry.normalizedNeighborhood) || entry.normalizedNeighborhood !== normalizeMarrakechNeighborhood(entry.originalNeighborhood)) throw new Error('Duplicate or invalid geographical label');
    labels.add(entry.originalNeighborhood); normalized.add(entry.normalizedNeighborhood);
    if (entry.status !== 'verified-label-attribution') {
      if (entry.boundaryId !== null) throw new Error('Unverified geographical allocation');
      continue;
    }
    const boundary = entry.boundaryId ? byBoundary.get(entry.boundaryId) : undefined;
    if (!boundary || boundary.properties['ref:MA:HCP'] !== entry.administrativeIdentifier || boundary.properties['name:fr'] !== entry.arrondissement || entry.method !== 'reviewed-municipal-neighborhood-label' || !entry.ambiguityNotes || !entry.evidence.length || entry.evidence.some(item => !sources[item.source] || !Number.isInteger(item.page) || item.page < 1 || !item.anchor)) throw new Error('Invalid geographical evidence');
    mapping[entry.originalNeighborhood] = { boundaryId: boundary.id };
  }
  for (const row of rows) {
    if (!row.id || ids.has(row.id) || !labels.has(row.neighborhood) || ![row.price, row.area, row.price / row.area].every(value => Number.isFinite(value) && value > 0)) throw new Error('Invalid or duplicate geographical observation');
    ids.add(row.id);
  }
  if (entries.some(entry => rows.filter(row => row.neighborhood === entry.originalNeighborhood).length !== entry.listingCount)) throw new Error('Geographical coverage does not reconcile');
  return aggregateArrondissements(rows.map(row => ({ ...row, pricePerM2: row.price / row.area })), mapping, boundaries.map(boundary => boundary.id), MARRAKECH_MIN_OBSERVATIONS);
}

export function getMarrakechMapSummary(): CityMapSummary {
  const config = CITY_MARKET_MAPS.marrakech;
  const snapshotBytes = readFileSync(MARRAKECH_DATASET);
  const boundaryBytes = readFileSync(`public${config.geoJsonSource}`);
  const crosswalk = JSON.parse(readFileSync('data/geographic/marrakech-market-crosswalk.json', 'utf8'));
  const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  if (crosswalk.schemaVersion !== 1 || crosswalk.city !== 'Marrakech' || crosswalk.snapshotSha256 !== sha(snapshotBytes) || crosswalk.boundarySha256 !== sha(boundaryBytes)) throw new Error('Stale Marrakech geographical evidence');
  const boundaries = selectMarketBoundaries(JSON.parse(boundaryBytes.toString('utf8')).features, config.boundaryLevel);
  const rows = getMarrakechMarketRows();
  const result = aggregateMarrakechGeography(rows, crosswalk.entries, boundaries, crosswalk.sources);
  const percent = (count: number) => rows.length ? Number((count * 100 / rows.length).toFixed(1)) : 0;
  return { citySlug: 'marrakech', geoJsonSource: config.geoJsonSource, boundaryLevel: config.boundaryLevel,
    boundaryCount: boundaries.length, outlineCount: boundaries.length, mappedNeighborhoodCount: result.mappedNeighborhoods.length,
    minimumObservations: MARRAKECH_MIN_OBSERVATIONS, ...result,
    attribution: { retainedListings: rows.length, unmappedListings: rows.length - result.mappedListings,
      mappedSharePercent: percent(result.mappedListings), arrondissementShares: Object.fromEntries(result.arrondissements.map(item => [item.boundaryId, percent(item.listingCount)])) } };
}
