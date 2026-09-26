import assert from 'node:assert/strict';
import test from 'node:test';
import { getCasablancaDataQuality, getCasablancaDrift, getCasablancaMarketAnalytics, MIN_DRIFT_OBSERVATIONS } from '../lib/analytics/casablanca';

test('Casablanca market aggregates come from the approved reference dataset', () => {
  const market = getCasablancaMarketAnalytics();
  assert.equal(market.dataset, 'server-data/casablanca-market.csv');
  assert.equal(market.kpis.usableListings, 1172);
  assert.equal(market.kpis.neighborhoodsRepresented, 100);
  assert.equal(market.kpis.medianListingPriceMad, 2_300_000);
  assert.equal(market.kpis.medianPricePerM2, 15_089);
  assert.equal(market.propertyTypes.reduce((total, item) => total + item.count, 0), market.kpis.usableListings);
  assert.ok(market.neighborhoods.every((item) => item.benchmarkEligible === (item.listingCount >= market.minimumNeighborhoodObservations)));
});

test('data quality is calculated without invented percentages', () => {
  const quality = getCasablancaDataQuality();
  assert.equal(quality.totalRows, 1172);
  assert.equal(quality.usableRows, 1172);
  assert.equal(quality.duplicateRows, 0);
  assert.equal(quality.missingByField.Type, 0);
  assert.equal(quality.missingByField.Localisation, 0);
  assert.equal(quality.missingByField.Current_state, 49);
  assert.equal(quality.missingByField.Age, 290);
  assert.equal(quality.neighborhoodCoverage.outsideModelManifest, 0);
});

test('drift is suppressed below the transparent production threshold', () => {
  const drift = getCasablancaDrift(Array.from({ length: MIN_DRIFT_OBSERVATIONS - 1 }, () => ({ area: 100 })));
  assert.equal(drift.sufficientData, false);
  assert.equal(drift.features.length, 0);
  assert.equal(drift.message, 'Données insuffisantes pour évaluer la dérive.');
});
