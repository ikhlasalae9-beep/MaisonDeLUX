import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CITY_REGISTRY } from '../../config/cities.config';
import { cityCapabilityActions, cityMarketPath } from '../../lib/cities/registry';
import { getCityMapSummary, hasBoundaryOutline, selectMarketBoundaries } from '../../lib/analytics/market-map';
import { boundaryName, projectMarketBoundaries } from '../../lib/analytics/market-geometry';

test('capabilities support estimation, market only, and content only cities independently', () => {
  const casa = CITY_REGISTRY.find(city => city.slug === 'casablanca')!;
  assert.deepEqual(cityCapabilityActions('fr', casa).map(action => action.href), ['/fr/cities/casablanca/estimate', '/fr/cities/casablanca/market']);
  assert.equal(cityMarketPath('ar', 'casablanca'), '/ar/cities/casablanca/market');
  assert.deepEqual(cityCapabilityActions('fr', { ...casa, estimation: { ...casa.estimation, publicEnabled: false } }).map(action => action.kind), ['market']);
  assert.deepEqual(cityCapabilityActions('fr', { ...casa, estimation: { ...casa.estimation, publicEnabled: false }, market: { publicEnabled: false, analyticsRef: null } }), []);
  assert.ok(CITY_REGISTRY.filter(city => city.slug !== 'casablanca').every(city => !city.market.publicEnabled));
});

test('real Casablanca boundaries render independently of market mapping and ignore helper points', () => {
  const source = JSON.parse(readFileSync('public/maps/casablanca-boundaries.geojson', 'utf8'));
  const selected = selectMarketBoundaries(source.features, '10');
  assert.equal(selected.length, 16);
  assert.equal(source.features.filter((feature: any) => feature.geometry.type === 'Point').length, 7);
  assert.equal(selected.filter(hasBoundaryOutline).length, 16);
  assert.ok(selected.every(feature => feature.geometry.type === 'Polygon' && feature.properties.admin_level === '10'));
  const outlines = projectMarketBoundaries(selected);
  assert.equal(outlines.length, 16);
  assert.ok(outlines.every(outline => !/NaN|Infinity/.test(outline.path) && outline.path.split('L').length > 10));
  assert.ok(selected.every(feature => boundaryName(feature, 'fr') === feature.properties['name:fr']));
  assert.equal(selectMarketBoundaries([{ ...selected[0], properties: { admin_level: 10 } } as any, { ...selected[0], geometry: { type: 'Point', coordinates: [] } }], '10').length, 0);
  const summary = getCityMapSummary('casablanca')!;
  assert.equal(summary.outlineCount, 16);
  assert.equal(summary.mappedNeighborhoodCount, 7);
  assert.equal(summary.unmappedNeighborhoods.length, 93);
  assert.equal(summary.arrondissements.filter(item => item.eligible).length, 4);
  assert.equal(getCityMapSummary('rabat'), null);
});

test('projection preserves MultiPolygon islands and polygon holes', () => {
  const ring = [[-7.6, 33.5], [-7.5, 33.5], [-7.5, 33.6], [-7.6, 33.5]];
  const [outline] = projectMarketBoundaries([{ id: 'test', properties: { admin_level: '10' }, geometry: { type: 'MultiPolygon', coordinates: [[ring, ring], [ring]] } }]);
  assert.equal(outline.path.split('M').length - 1, 3);
  assert.equal(outline.path.split(' Z').length - 1, 3);
});
