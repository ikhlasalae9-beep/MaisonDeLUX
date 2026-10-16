import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketAnalytics } from './types';

export const MARRAKECH_DATASET = 'server-data/marrakech-market.json';
export const MARRAKECH_MIN_OBSERVATIONS = 8;
export type MarrakechObservation = { id: string; neighborhood: string; price: number; area: number; collectedAt: string };
export type MarrakechMarket = MarketAnalytics & {
  coverage: { sourceRows: number; excluded: Record<string, number>; collectedFrom: string; collectedTo: string };
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
export function marrakechHistogram(values: number[], edges: number[]) {
  return edges.map((min, index) => ({
    label: index === edges.length - 1 ? `${min}+` : `${min}–<${edges[index + 1]}`,
    count: values.filter(value => value >= min && (index === edges.length - 1 || value < edges[index + 1])).length,
  }));
}

export function buildMarrakechMarket(rows: MarrakechObservation[], coverage: MarrakechMarket['coverage']): MarrakechMarket | null {
  if (!rows.length) return null;
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.id || seen.has(row.id) || !row.neighborhood?.trim() ||
        ![row.price, row.area, row.price / row.area].every(value => Number.isFinite(value) && value > 0) ||
        !Number.isFinite(Date.parse(row.collectedAt))) throw new Error('Invalid Marrakech market snapshot');
    seen.add(row.id);
  }
  const groups = new Map<string, MarrakechObservation[]>();
  for (const row of rows) {
    const group = groups.get(row.neighborhood) ?? [];
    group.push(row);
    groups.set(row.neighborhood, group);
  }
  const propertyTypes = [{ label: 'appartement', count: rows.length, share: 100 }];
  const neighborhoods = Array.from(groups).map(([neighborhood, items]) => ({
    neighborhood, listingCount: items.length,
    medianListingPriceMad: round(median(items.map(row => row.price))),
    medianPricePerM2: round(median(items.map(row => row.price / row.area))),
    medianArea: round(median(items.map(row => row.area)), 1),
    propertyTypes: [{ label: 'appartement', count: items.length, share: 100 }],
    benchmarkEligible: items.length >= MARRAKECH_MIN_OBSERVATIONS,
  })).sort((a, b) => b.listingCount - a.listingCount || a.neighborhood.localeCompare(b.neighborhood, 'fr'));
  return {
    city: 'Marrakech', dataset: MARRAKECH_DATASET, generatedFrom: 'reference-dataset',
    listingPriceLabel: "prix affichés d'appartements à vendre", minimumNeighborhoodObservations: MARRAKECH_MIN_OBSERVATIONS,
    coverage,
    kpis: { usableListings: rows.length, medianListingPriceMad: round(median(rows.map(row => row.price))),
      medianPricePerM2: round(median(rows.map(row => row.price / row.area))),
      averageArea: round(rows.reduce((sum, row) => sum + row.area, 0) / rows.length, 1), neighborhoodsRepresented: groups.size },
    propertyTypes, neighborhoods: neighborhoods.filter(row => row.benchmarkEligible),
    suppressedNeighborhoods: neighborhoods.filter(row => !row.benchmarkEligible).length,
    suppressedListings: neighborhoods.filter(row => !row.benchmarkEligible).reduce((sum, row) => sum + row.listingCount, 0),
    charts: {
      pricePerM2: marrakechHistogram(rows.map(row => row.price / row.area), [0, 10000, 15000, 20000, 25000, 35000]),
      surface: marrakechHistogram(rows.map(row => row.area), [0, 50, 75, 100, 150, 250]),
      topNeighborhoodVolumes: neighborhoods.slice(0, 12).map(row => ({ neighborhood: row.neighborhood, count: row.listingCount })),
      neighborhoodMedianPricePerM2: neighborhoods.filter(row => row.benchmarkEligible)
        .sort((a, b) => b.medianPricePerM2 - a.medianPricePerM2).slice(0, 12)
        .map(row => ({ neighborhood: row.neighborhood, medianPricePerM2: row.medianPricePerM2, count: row.listingCount })),
    },
  };
}

function readMarrakechMarketSnapshot() {
  const snapshot = JSON.parse(readFileSync(path.join(process.cwd(), MARRAKECH_DATASET), 'utf8'));
  if (snapshot.schemaVersion !== 1 || snapshot.city !== 'Marrakech' || !Array.isArray(snapshot.rows) ||
      !Number.isInteger(snapshot.sourceRows) || !/^[a-f0-9]{64}$/.test(snapshot.sourceSha256) ||
      Object.values(snapshot.excluded).some(value => !Number.isInteger(value) || Number(value) < 0) ||
      snapshot.rows.length + Object.values(snapshot.excluded).reduce<number>((sum, count) => sum + Number(count), 0) !== snapshot.sourceRows) {
    throw new Error('Invalid Marrakech market provenance');
  }
  const dates = snapshot.rows.map((row: MarrakechObservation) => row.collectedAt).sort();
  const coverage = { sourceRows: snapshot.sourceRows, excluded: snapshot.excluded, collectedFrom: dates[0] ?? '', collectedTo: dates[dates.length - 1] ?? '' };
  const analytics = buildMarrakechMarket(snapshot.rows, coverage);
  return { rows: snapshot.rows as MarrakechObservation[], analytics, missing: snapshot.missing as Record<string, number>,
    propertyTypes: snapshot.audit.property_type_repaired as Record<string, number> };
}

/** Aggregate provenance for the protected admin; no listing identifiers are returned. */
export function getMarrakechMarketAudit() {
  const snapshot = readMarrakechMarketSnapshot();
  return { analytics: snapshot.analytics, missing: snapshot.missing, propertyTypes: snapshot.propertyTypes };
}


export function getMarrakechMarketAnalytics(): MarrakechMarket | null {
  return readMarrakechMarketSnapshot().analytics;
}

/** Original validated apartment-sale observations; ratios are computed per listing. */
export function getMarrakechMarketRows() {
  return readMarrakechMarketSnapshot().rows.map(row => ({ ...row, pricePerM2: row.price / row.area }));
}
