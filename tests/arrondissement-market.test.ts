import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CITY_MARKET_MAPS } from '../config/city-market';
import { aggregateArrondissements, arrondissementColor, createPriceBins } from '../lib/analytics/arrondissement-market';
import { getCityMapSummary } from '../lib/analytics/market-map';
import { getCasablancaMarketAnalytics, getCasablancaMarketRows } from '../lib/analytics/casablanca';

test('arrondissement medians aggregate original listings, not neighborhood medians', () => {
  const rows = [...Array.from({ length: 8 }, () => ({ neighborhood: 'a', price: 100, pricePerM2: 10, area: 10 })),
    { neighborhood: 'b', price: 1000, pricePerM2: 100, area: 100 }, { neighborhood: 'unknown', price: 5000, pricePerM2: 500, area: 10 }];
  const result = aggregateArrondissements(rows, { a: { boundaryId: 'x' }, b: { boundaryId: 'x' } }, ['x', 'y'], 8);
  assert.equal(result.arrondissements[0].listingCount, 9);
  assert.equal(result.arrondissements[0].medianListingPriceMad, 100);
  assert.equal(result.arrondissements[0].medianPricePerM2, 10);
  assert.equal(result.arrondissements[0].medianArea, 10);
  assert.deepEqual(result.unmappedNeighborhoods, ['unknown']);
  assert.equal(result.arrondissements[1].medianPricePerM2, null);
  assert.equal(arrondissementColor(result.arrondissements[1], result.bins), '#e2e8f0');
});

test('real coverage preserves the usable cohort and the eight-listing minimum', () => {
  const summary = getCityMapSummary('casablanca')!;
  assert.equal(summary.boundaryCount, 16);
  assert.equal(summary.mappedNeighborhoods.length, 7);
  assert.equal(summary.unmappedNeighborhoods.length, 93);
  assert.equal(summary.mappedListings, 268);
  assert.equal(getCasablancaMarketRows().length, getCasablancaMarketAnalytics().kpis.usableListings);
  assert.equal(summary.arrondissements.filter(item => item.listingCount > 0).length, 5);
  assert.equal(summary.arrondissements.filter(item => item.eligible).length, 4);
  const roches = summary.arrondissements.find(item => item.boundaryId === 'relation/2801457')!;
  assert.equal(roches.listingCount, 5);
  assert.equal(roches.medianPricePerM2, null);
  const ainChock = summary.arrondissements.find(item => item.boundaryId === 'relation/2801442')!;
  assert.equal(ainChock.listingCount, 163);
  assert.equal(ainChock.medianPricePerM2, 14272);
  assert.equal(ainChock.medianListingPriceMad, 5500000);
  assert.equal(ainChock.medianArea, 375);
  assert.deepEqual(summary.bins.map(bin => [bin.min, bin.max]), [[9610, 9610], [9611, 14272], [14273, 17887], [17888, 18000]]);
  assert.ok(summary.arrondissements.filter(item => item.eligible).every(item => arrondissementColor(item, summary.bins) !== '#e2e8f0'));
});

test('quantile classes exclude low samples and preserve equal-value ties', () => {
  const item = { boundaryId: 'a', listingCount: 8, neighborhoods: ['a'], medianListingPriceMad: 100, medianArea: 50, medianPricePerM2: 100, eligible: true };
  assert.equal(createPriceBins([item, { ...item, boundaryId: 'b' }]).length, 1);
  assert.deepEqual(createPriceBins([{ ...item, eligible: false }]), []);
  assert.deepEqual(createPriceBins([]), []);
});

test('each local geographic crosswalk has a named reference point uniquely inside the documented boundary', () => {
  const geo = JSON.parse(readFileSync('data/geographic/morocco_neighborhoods.geojson', 'utf8'));
  const boundaries = JSON.parse(readFileSync('public/maps/casablanca-boundaries.geojson', 'utf8')).features.filter((feature: any) => feature.geometry.type === 'Polygon' && feature.properties.admin_level === '10');
  const normalize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const inside = (point: number[], ring: number[][]) => {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
    }
    return hit;
  };
  for (const [name, mapping] of Object.entries(CITY_MARKET_MAPS.casablanca.neighborhoodMapping)) {
    assert.ok(mapping.evidence);
    assert.ok(boundaries.some((boundary: any) => boundary.id === mapping.boundaryId));
    if (!mapping.geoNamesId) continue;
    const feature = geo.features.find((feature: any) => feature.id === mapping.geoNamesId);
    assert.equal(feature.properties.parent_city, 'Casablanca');
    assert.ok([feature.properties.name, ...feature.properties.alternative_names].some(alias => normalize(alias) === normalize(name)));
    const matches = boundaries.filter((boundary: any) => inside(feature.geometry.coordinates, boundary.geometry.coordinates[0]) && !boundary.geometry.coordinates.slice(1).some((ring: number[][]) => inside(feature.geometry.coordinates, ring)));
    assert.deepEqual(matches.map((boundary: any) => boundary.id), [mapping.boundaryId]);
  }
  assert.equal(CITY_MARKET_MAPS.casablanca.neighborhoodMapping['Ain Chock'].geoNamesId, undefined);
  assert.equal(CITY_MARKET_MAPS.casablanca.neighborhoodMapping['Anfa Supérieur'], undefined);
  assert.equal(CITY_MARKET_MAPS.casablanca.neighborhoodMapping['Casablanca'], undefined);
});
