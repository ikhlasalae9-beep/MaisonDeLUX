import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { MarketAnalytics } from './types';

export const RABAT_DATASET = 'server-data/rabat-market.json';
export const RABAT_MIN_OBSERVATIONS = 8;
export type RabatObservation = { id: string; neighborhood: string; price: number; area: number; propertyType: string };
export type RabatMarket = MarketAnalytics & {
  coverage: { sourceRows: number; excluded: Record<string, number>; cleanRows: number };
  suppressedNeighborhoods: number;
  suppressedListings: number;
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = (value: number, digits = 0) => Number(value.toFixed(digits));

// Half-open bins, with an unbounded final bin: every observation is counted once.
export function rabatHistogram(values: number[], edges: number[]) {
  return edges.map((min, index) => ({
    label: index === edges.length - 1 ? `${min}+` : `${min}–<${edges[index + 1]}`,
    count: values.filter(value => value >= min && (index === edges.length - 1 || value < edges[index + 1])).length,
  }));
}

export function buildRabatMarket(rows: RabatObservation[], coverage: RabatMarket['coverage']): RabatMarket | null {
  if (!rows.length) return null;
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.id || seen.has(row.id) || !row.neighborhood?.trim() ||
        ![row.price, row.area, row.price / row.area].every(value => Number.isFinite(value) && value > 0) || !['appartement', 'villa', 'maison', 'studio', 'bureau'].includes(row.propertyType)) throw new Error('Invalid Rabat market snapshot');
    seen.add(row.id);
  }
  const groups = new Map<string, RabatObservation[]>();
  for (const row of rows) {
    const group = groups.get(row.neighborhood) ?? [];
    group.push(row);
    groups.set(row.neighborhood, group);
  }
  const types = (items: RabatObservation[]) => Array.from(new Set(items.map(row => row.propertyType))).sort().map(label => ({label, count: items.filter(row => row.propertyType === label).length, share: round(items.filter(row => row.propertyType === label).length * 100 / items.length, 1)}));
  const propertyTypes = types(rows);
  const neighborhoods = Array.from(groups).map(([neighborhood, items]) => ({
    neighborhood, listingCount: items.length,
    medianListingPriceMad: round(median(items.map(row => row.price))),
    medianPricePerM2: round(median(items.map(row => row.price / row.area))),
    medianArea: round(median(items.map(row => row.area)), 1),
    propertyTypes: types(items),
    benchmarkEligible: items.length >= RABAT_MIN_OBSERVATIONS,
  })).sort((a, b) => b.listingCount - a.listingCount || a.neighborhood.localeCompare(b.neighborhood, 'fr'));
  return {
    city: 'Rabat', dataset: RABAT_DATASET, generatedFrom: 'reference-dataset',
    listingPriceLabel: "prix affichés des annonces du référentiel", minimumNeighborhoodObservations: RABAT_MIN_OBSERVATIONS,
    coverage,
    kpis: { usableListings: rows.length, medianListingPriceMad: round(median(rows.map(row => row.price))),
      medianPricePerM2: round(median(rows.map(row => row.price / row.area))),
      averageArea: round(rows.reduce((sum, row) => sum + row.area, 0) / rows.length, 1), neighborhoodsRepresented: groups.size },
    propertyTypes, neighborhoods: neighborhoods.filter(row => row.benchmarkEligible),
    suppressedNeighborhoods: neighborhoods.filter(row => !row.benchmarkEligible).length,
    suppressedListings: neighborhoods.filter(row => !row.benchmarkEligible).reduce((sum, row) => sum + row.listingCount, 0),
    charts: {
      pricePerM2: rabatHistogram(rows.map(row => row.price / row.area), [0, 10000, 15000, 20000, 25000, 35000]),
      surface: rabatHistogram(rows.map(row => row.area), [0, 50, 75, 100, 150, 250]),
      topNeighborhoodVolumes: neighborhoods.slice(0, 12).map(row => ({ neighborhood: row.neighborhood, count: row.listingCount })),
      neighborhoodMedianPricePerM2: neighborhoods.filter(row => row.benchmarkEligible)
        .sort((a, b) => b.medianPricePerM2 - a.medianPricePerM2).slice(0, 12)
        .map(row => ({ neighborhood: row.neighborhood, medianPricePerM2: row.medianPricePerM2, count: row.listingCount })),
    },
  };
}

function readRabatMarketSnapshot() {
  const bytes = readFileSync(path.join(process.cwd(), RABAT_DATASET));
  if (createHash('sha256').update(bytes).digest('hex') !== '322293c0ed044fb8504bde86345ef410d8c7a079bc9b378c00c4226ca8add86c') throw new Error('Rabat market snapshot integrity mismatch');
  const snapshot = JSON.parse(bytes.toString('utf8'));
  if (snapshot.schemaVersion !== 1 || snapshot.city !== 'Rabat' || !Array.isArray(snapshot.rows) ||
      snapshot.sourceRows !== 1165 || snapshot.cleanRows !== 700 || snapshot.rows.length !== snapshot.cleanRows ||
      !Array.isArray(snapshot.sources) || snapshot.sources.length !== 2 || snapshot.sources.some((source: {sha256: string}) => !/^[a-f0-9]{64}$/.test(source.sha256))) throw new Error('Invalid Rabat market provenance');
  const coverage = { sourceRows: snapshot.sourceRows, cleanRows: snapshot.cleanRows, excluded: { cleaning: snapshot.sourceRows - snapshot.cleanRows } };
  return { rows: snapshot.rows as RabatObservation[], analytics: buildRabatMarket(snapshot.rows, coverage) };
}
export function getRabatMarketAnalytics(): RabatMarket | null { return readRabatMarketSnapshot().analytics; }
export function getRabatMarketRows() { return readRabatMarketSnapshot().rows.map(row => ({ ...row, pricePerM2: row.price / row.area })); }
