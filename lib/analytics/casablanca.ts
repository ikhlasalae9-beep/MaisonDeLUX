import { readFileSync } from 'node:fs';
import path from 'node:path';
import preprocessing from '@/models/casablanca/v1/preprocessing.json';
import type { CountPoint, DataQualityAnalytics, DriftAnalytics, DriftFeature, MarketAnalytics, NumericDistribution } from './types';

const DATASET = 'ml/notebooks/mubawab_listings_clean.csv';
export const MIN_NEIGHBORHOOD_OBSERVATIONS = 8;
export const MIN_DRIFT_OBSERVATIONS = 30;

type SourceRow = Record<string, string>;
type ReferenceRow = {
  propertyType: string; neighborhood: string; price: number; area: number; rooms: number;
  bedrooms: number; bathrooms: number; floor: number; pricePerM2: number; currentState: string; age: string;
};

let cached: { market: MarketAnalytics; quality: DataQualityAnalytics; rows: ReferenceRow[] } | null = null;

function parseCsv(text: string): SourceRow[] {
  const records: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); records.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); records.push(row); }
  const [headers = [], ...values] = records;
  return values.filter((item) => item.some(Boolean)).map((item) => Object.fromEntries(headers.map((header, index) => [header, item[index] ?? ''])));
}

const finite = (value: string) => value.trim() === '' ? Number.NaN : Number(value);
const median = (values: number[]) => quantile(values, .5);
function quantile(values: number[], q: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b); const position = (sorted.length - 1) * q;
  const base = Math.floor(position); const remainder = position - base;
  return sorted[base] + (sorted[base + 1] === undefined ? 0 : remainder * (sorted[base + 1] - sorted[base]));
}
const rounded = (value: number, digits = 0) => Number(value.toFixed(digits));

function counts(values: string[]): CountPoint[] {
  const map = new Map<string, number>(); values.filter(Boolean).forEach((value) => map.set(value, (map.get(value) || 0) + 1));
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count, share: rounded(count / values.length * 100, 1) }));
}

function histogram(values: number[], edges: number[]): Array<{ label: string; count: number }> {
  return edges.slice(0, -1).map((edge, index) => ({
    label: index === edges.length - 2 ? `${Math.round(edge).toLocaleString('fr-FR')}+` : `${Math.round(edge).toLocaleString('fr-FR')}–${Math.round(edges[index + 1]).toLocaleString('fr-FR')}`,
    count: values.filter((value) => value >= edge && (index === edges.length - 2 ? value <= edges[index + 1] : value < edges[index + 1])).length,
  }));
}

function distribution(field: string, values: number[]): NumericDistribution {
  const valid = values.filter(Number.isFinite); const quantileEdges = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1].map((q) => quantile(valid, q));
  return { field, count: valid.length, min: rounded(quantile(valid, 0), 2), q05: rounded(quantile(valid, .05), 2),
    q25: rounded(quantile(valid, .25), 2), median: rounded(quantile(valid, .5), 2), q75: rounded(quantile(valid, .75), 2),
    q95: rounded(quantile(valid, .95), 2), max: rounded(quantile(valid, 1), 2), mean: rounded(valid.reduce((a, b) => a + b, 0) / valid.length, 2),
    quantileEdges: quantileEdges.map((value) => rounded(value, 4)) };
}

function build() {
  if (cached) return cached;
  const source = parseCsv(readFileSync(path.join(process.cwd(), DATASET), 'utf8'));
  const fields = ['Type','Localisation','Price','Area','Rooms','Bedrooms','Bathrooms','Floor','Other_tags','Price_m2'];
  const missingByField = Object.fromEntries(fields.map((field) => [field, source.filter((row) => !row[field]?.trim()).length]));
  const duplicateRows = source.length - new Set(source.map((row) => fields.map((field) => row[field] || '').join('\u001f'))).size;
  const invalidByRule = {
    nonPositivePrice: source.filter((row) => !(finite(row.Price) > 0)).length,
    nonPositiveArea: source.filter((row) => !(finite(row.Area) > 0)).length,
    nonPositivePricePerM2: source.filter((row) => !(finite(row.Price_m2) > 0)).length,
    roomsOutsideModelRange: source.filter((row) => !Number.isFinite(finite(row.Rooms)) || finite(row.Rooms) < 1 || finite(row.Rooms) > 10).length,
    bedroomsOutsideModelRange: source.filter((row) => !Number.isFinite(finite(row.Bedrooms)) || finite(row.Bedrooms) < 1 || finite(row.Bedrooms) > 10).length,
    bathroomsOutsideModelRange: source.filter((row) => !Number.isFinite(finite(row.Bathrooms)) || finite(row.Bathrooms) < 1 || finite(row.Bathrooms) > 10).length,
    floorOutsideModelRange: source.filter((row) => !Number.isFinite(finite(row.Floor)) || finite(row.Floor) < 0 || finite(row.Floor) > 10).length,
  };
  const states = preprocessing.categorical.Current_state.accepted; const ages = preprocessing.categorical.Age.accepted;
  const rows: ReferenceRow[] = source.map((row) => ({ propertyType: row.Type?.trim(), neighborhood: row.Localisation?.trim(),
    price: finite(row.Price), area: finite(row.Area), rooms: finite(row.Rooms), bedrooms: finite(row.Bedrooms), bathrooms: finite(row.Bathrooms),
    floor: finite(row.Floor), pricePerM2: finite(row.Price_m2), currentState: states.find((value) => row.Other_tags?.includes(value)) || 'Non renseigné',
    age: ages.find((value) => row.Other_tags?.includes(value)) || 'Non renseigné' }))
    .filter((row) => row.propertyType && row.neighborhood && row.price > 0 && row.area > 0 && row.pricePerM2 > 0 &&
      [row.rooms, row.bedrooms, row.bathrooms, row.floor].every(Number.isFinite));
  missingByField.Current_state = rows.filter((row) => row.currentState === 'Non renseigné').length;
  missingByField.Age = rows.filter((row) => row.age === 'Non renseigné').length;

  const byNeighborhood = new Map<string, ReferenceRow[]>();
  rows.forEach((row) => byNeighborhood.set(row.neighborhood, [...(byNeighborhood.get(row.neighborhood) || []), row]));
  const neighborhoods = Array.from(byNeighborhood.entries()).map(([neighborhood, items]) => ({ neighborhood, listingCount: items.length,
    medianListingPriceMad: rounded(median(items.map((row) => row.price))), medianPricePerM2: rounded(median(items.map((row) => row.pricePerM2))),
    medianArea: rounded(median(items.map((row) => row.area)), 1), propertyTypes: counts(items.map((row) => row.propertyType)),
    benchmarkEligible: items.length >= MIN_NEIGHBORHOOD_OBSERVATIONS })).sort((a, b) => b.listingCount - a.listingCount);
  const priceM2 = rows.map((row) => row.pricePerM2); const surfaces = rows.map((row) => row.area);
  const market: MarketAnalytics = { city: 'Casablanca', dataset: DATASET, generatedFrom: 'reference-dataset', listingPriceLabel: "prix affichés d'annonces",
    minimumNeighborhoodObservations: MIN_NEIGHBORHOOD_OBSERVATIONS,
    kpis: { usableListings: rows.length, medianListingPriceMad: rounded(median(rows.map((row) => row.price))), medianPricePerM2: rounded(median(priceM2)),
      averageArea: rounded(surfaces.reduce((a, b) => a + b, 0) / surfaces.length, 1), neighborhoodsRepresented: byNeighborhood.size },
    propertyTypes: counts(rows.map((row) => row.propertyType)), neighborhoods,
    charts: { pricePerM2: histogram(priceM2, [0, 5000, 10000, 15000, 20000, 25000, 35000, Math.max(...priceM2)]),
      surface: histogram(surfaces, [0, 75, 100, 150, 250, 500, 1000, Math.max(...surfaces)]),
      topNeighborhoodVolumes: neighborhoods.slice(0, 12).map((item) => ({ neighborhood: item.neighborhood, count: item.listingCount })),
      neighborhoodMedianPricePerM2: neighborhoods.filter((item) => item.benchmarkEligible).sort((a, b) => b.medianPricePerM2 - a.medianPricePerM2).slice(0, 12)
        .map((item) => ({ neighborhood: item.neighborhood, medianPricePerM2: item.medianPricePerM2, count: item.listingCount })) } };
  const supported = new Set(preprocessing.categorical.Localisation.accepted);
  const quality: DataQualityAnalytics = { city: 'Casablanca', dataset: DATASET, totalRows: source.length, usableRows: rows.length, duplicateRows, missingByField, invalidByRule,
    neighborhoodCoverage: { distinct: byNeighborhood.size, supportedByModel: Array.from(byNeighborhood.keys()).filter((value) => supported.has(value as any)).length,
      outsideModelManifest: Array.from(byNeighborhood.keys()).filter((value) => !supported.has(value as any)).length }, propertyTypeCoverage: counts(rows.map((row) => row.propertyType)),
    referenceDistributions: { numeric: [distribution('area', rows.map((row) => row.area)), distribution('rooms', rows.map((row) => row.rooms)),
      distribution('bedrooms', rows.map((row) => row.bedrooms)), distribution('bathrooms', rows.map((row) => row.bathrooms)), distribution('floor', rows.map((row) => row.floor))],
      categorical: { property_type: counts(rows.map((row) => row.propertyType)), neighborhood: counts(rows.map((row) => row.neighborhood)),
        current_state: counts(rows.map((row) => row.currentState)), age: counts(rows.map((row) => row.age)) } } };
  cached = { market, quality, rows }; return cached;
}

export const getCasablancaMarketAnalytics = () => build().market;
// Read-only reuse of the same usable listing cohort for geographic context.
export const getCasablancaMarketRows = () => build().rows.map(({ neighborhood, price, pricePerM2, area }) => ({ neighborhood, price, pricePerM2, area }));
export const getCasablancaDataQuality = () => build().quality;

function psi(reference: number[], production: number[], edges: number[]) {
  const unique = Array.from(new Set(edges)); if (unique.length < 2) return 0;
  const proportions = (values: number[]) => unique.slice(0, -1).map((edge, i) => Math.max(values.filter((value) =>
    i === 0 ? value < unique[i + 1] : i === unique.length - 2 ? value >= edge : value >= edge && value < unique[i + 1]).length / values.length, .0001));
  const a = proportions(reference); const b = proportions(production);
  return a.reduce((total, expected, i) => total + (b[i] - expected) * Math.log(b[i] / expected), 0);
}

function totalVariation(reference: string[], production: string[]) {
  const labels = new Set([...reference, ...production]);
  return Array.from(labels).reduce((sum, label) => sum + Math.abs(reference.filter((v) => v === label).length / reference.length - production.filter((v) => v === label).length / production.length), 0) / 2;
}

export function getCasablancaDrift(events: Array<Record<string, unknown>>): DriftAnalytics {
  const { rows, quality } = build(); const features = events.filter((event) => event && typeof event === 'object');
  if (features.length < MIN_DRIFT_OBSERVATIONS) return { city: 'Casablanca', productionCount: features.length,
    minimumProductionObservations: MIN_DRIFT_OBSERVATIONS, sufficientData: false, message: 'Données insuffisantes pour évaluer la dérive.', features: [] };
  const output: DriftFeature[] = [];
  const numeric: Array<[keyof ReferenceRow, string]> = [['area','area'],['rooms','rooms'],['bedrooms','bedrooms'],['bathrooms','bathrooms'],['floor','floor']];
  numeric.forEach(([referenceKey, eventKey]) => {
    const reference = rows.map((row) => Number(row[referenceKey])); const production = features.map((event) => Number(event[eventKey])).filter(Number.isFinite);
    if (!production.length) return; const summary = quality.referenceDistributions.numeric.find((item) => item.field === eventKey)!; const value = psi(reference, production, summary.quantileEdges);
    const outside = production.filter((item) => item < summary.q05 || item > summary.q95).length / production.length * 100;
    output.push({ field: eventKey, method: 'PSI', value: rounded(value, 3), status: value >= .25 ? 'shift' : value >= .1 ? 'watch' : 'stable',
      referenceCount: reference.length, productionCount: production.length, detail: `${rounded(outside, 1)} % hors de l’intervalle de référence P5–P95` });
  });
  const normalizePropertyType = (value: string) => (preprocessing.categorical.Type.accepted as Record<string,string>)[value]
    || (preprocessing.categorical.Type.training_normalization as Record<string,string>)[value] || value;
  const categories: Array<[keyof ReferenceRow, string, (value: string) => string]> = [
    ['propertyType','property_type',normalizePropertyType],
    ['neighborhood','neighborhood',(value) => value],['currentState','current_state',(value) => value || 'Non renseigné'],['age','age',(value) => value || 'Non renseigné']];
  categories.forEach(([referenceKey, eventKey, normalize]) => {
    const reference = rows.map((row) => normalize(String(row[referenceKey]))); const production = features.map((event) => normalize(String(event[eventKey] || 'Non renseigné')));
    const value = totalVariation(reference, production); output.push({ field: eventKey, method: 'total_variation', value: rounded(value, 3),
      status: value >= .2 ? 'shift' : value >= .1 ? 'watch' : 'stable', referenceCount: reference.length, productionCount: production.length });
  });
  return { city: 'Casablanca', productionCount: features.length, minimumProductionObservations: MIN_DRIFT_OBSERVATIONS, sufficientData: true, features: output };
}
