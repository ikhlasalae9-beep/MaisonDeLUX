import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { buildMarrakechMarket, getMarrakechMarketAnalytics, marrakechHistogram, type MarrakechObservation } from '../lib/analytics/marrakech';
import { selectNeighborhoods } from '../lib/analytics/neighborhood-presentation';

test('Marrakech snapshot reproduces reviewed source and repaired type eligibility', () => {
  const before = readFileSync('server-data/marrakech-market.json');
  const snapshot = JSON.parse(before.toString());
  assert.equal(snapshot.sourceSha256, createHash('sha256').update(readFileSync(snapshot.source)).digest('hex'));
  const generated = spawnSync('python', ['scripts/build_marrakech_market.py'], { encoding: 'utf8' });
  assert.equal(generated.status, 0, generated.stderr);
  assert.deepEqual(readFileSync('server-data/marrakech-market.json'), before);
  assert.equal(snapshot.sourceRows, 2472);
  assert.deepEqual(snapshot.excluded, { duplicateRisk: 410, unsupportedScope: 407, batchAnomaly: 301, uncertainOutlier: 15 });
  const data = getMarrakechMarketAnalytics()!;
  assert.equal(data.kpis.usableListings, 1339);
  assert.equal(data.kpis.neighborhoodsRepresented, 62);
  assert.equal(data.kpis.medianListingPriceMad, 1470000);
  assert.equal(data.kpis.medianPricePerM2, 17347);
  assert.equal(data.kpis.averageArea, 93.2);
  assert.equal(data.neighborhoods.reduce((sum, row) => sum + row.listingCount, 0) + data.suppressedListings, 1339);
  assert.equal(data.neighborhoods.length + data.suppressedNeighborhoods, 62);
  assert.ok(data.neighborhoods.every(row => row.benchmarkEligible === (row.listingCount >= 8)));
  assert.equal(data.charts.pricePerM2.reduce((sum, row) => sum + row.count, 0), 1339);
  assert.equal(data.charts.surface.reduce((sum, row) => sum + row.count, 0), 1339);
  assert.ok(data.charts.neighborhoodMedianPricePerM2.every(row => row.count >= 8));
  assert.equal(data.coverage.collectedFrom.slice(0, 10), '2026-08-14');
  assert.equal(data.coverage.collectedTo.slice(0, 10), '2026-09-01');
});

test('neighborhood presentation ranks real cohorts without publishing below-threshold prices', () => {
  const market = getMarrakechMarketAnalytics()!;
  const before = JSON.stringify(market);
  const volume = selectNeighborhoods(market.neighborhoods, 8, 'listingCount');
  assert.deepEqual(volume.slice(0, 6).map(row => [row.neighborhood, row.listingCount]), [
    ['Guéliz', 342], ['Route Casablanca', 140], ['Agdal', 76], ['Hivernage', 74], ['Samlalia', 62], ['Ennakhil (Palmeraie)', 58],
  ]);
  assert.equal(selectNeighborhoods(market.neighborhoods, 8, 'medianPricePerM2')[0].neighborhood, 'Hivernage');
  assert.equal(selectNeighborhoods(market.neighborhoods, 8, 'listingCount', ' GUELIZ ')[0].neighborhood, 'Guéliz');
  assert.equal(selectNeighborhoods(market.neighborhoods, 8, 'listingCount', 'missing').length, 0);
  const unsafe = { ...volume[0], neighborhood: 'Too small', listingCount: 7, benchmarkEligible: true };
  assert.equal(selectNeighborhoods([unsafe], 8, 'listingCount').length, 0);
  const highlights = selectNeighborhoods(market.neighborhoods, 8, 'listingCount').slice(0, 6);
  assert.equal(highlights.length, 6);
  assert.equal(new Set(highlights.map(row => row.neighborhood)).size, 6);
  assert.ok(highlights.every(row => row.listingCount >= 8));
  assert.ok(volume.slice(0, 6).reduce((sum, row) => sum + row.listingCount, 0) / market.kpis.usableListings < 1);
  assert.equal(JSON.stringify(market), before, 'sorting and highlight selection cannot mutate city aggregates');
});

test('medians pool individual ratios, thresholds are inclusive, invalid observations fail closed', () => {
  const row = (i: number): MarrakechObservation => ({ id: String(i), neighborhood: 'Test', price: i < 4 ? 100 : 900, area: i < 4 ? 10 : 30, collectedAt: '2026-08-14T00:00:00Z' });
  const coverage = { sourceRows: 8, excluded: {}, collectedFrom: '2026-08-14', collectedTo: '2026-08-14' };
  assert.equal(buildMarrakechMarket([], coverage), null);
  const rows = Array.from({ length: 8 }, (_, i) => row(i));
  const market = buildMarrakechMarket(rows, coverage)!;
  assert.equal(market.kpis.medianPricePerM2, 20); // median(10,10,10,10,30,30,30,30), not 500/20
  assert.equal(market.neighborhoods[0].benchmarkEligible, true);
  assert.equal(buildMarrakechMarket(rows.slice(1), coverage)!.neighborhoods.length, 0);
  assert.equal(buildMarrakechMarket(rows.slice(1), coverage)!.suppressedNeighborhoods, 1);
  for (const bad of [{ area: 0 }, { price: NaN }, { price: Infinity }, { neighborhood: '' }, { collectedAt: 'invalid' }]) {
    assert.throws(() => buildMarrakechMarket([{ ...row(1), ...bad }], coverage));
  }
  assert.throws(() => buildMarrakechMarket([row(1), row(1)], coverage));
  assert.deepEqual(marrakechHistogram([0, 49, 50, 99, 100, 99999], [0, 50, 100]).map(bin => bin.count), [2, 2, 2]);
});
