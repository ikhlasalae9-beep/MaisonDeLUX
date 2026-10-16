import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { aggregateMarrakechGeography, getMarrakechMapSummary, normalizeMarrakechNeighborhood, type MarrakechAttribution } from '../lib/analytics/marrakech-geography';
import { getMarrakechMarketRows, getMarrakechMarketAnalytics } from '../lib/analytics/marrakech';
import { selectMarketBoundaries } from '../lib/analytics/market-geometry';
import { arrondissementColor } from '../lib/analytics/arrondissement-market';

const crosswalk = JSON.parse(readFileSync('data/geographic/marrakech-market-crosswalk.json', 'utf8'));
const boundaries = selectMarketBoundaries(JSON.parse(readFileSync('public/maps/marrakech-boundaries.geojson', 'utf8')).features, '10');

test('Marrakech evidence allocates only reviewed exact labels, reconciles all records and preserves city KPIs', () => {
  const data = getMarrakechMarketAnalytics()!;
  const summary = getMarrakechMapSummary();
  assert.equal(crosswalk.entries.length, 62);
  assert.equal(summary.mappedNeighborhoodCount, 17);
  assert.equal(summary.mappedListings, 716);
  assert.equal(summary.attribution?.unmappedListings, 623);
  assert.equal(summary.attribution?.mappedSharePercent, 53.5);
  assert.equal(summary.arrondissements.reduce((n, row) => n + row.listingCount, 0), 716);
  assert.deepEqual(summary.arrondissements.filter(row => row.eligible).map(row => [row.boundaryId, row.listingCount, row.medianListingPriceMad, row.medianPricePerM2, row.medianArea]), [['relation/2799533',627,1550000,18690,85],['relation/2799537',89,762000,9239,77]]);
  assert.deepEqual(data.kpis, { usableListings:1339, medianListingPriceMad:1470000, medianPricePerM2:17347, averageArea:93.2, neighborhoodsRepresented:62 });
  assert.equal(summary.attribution!.retainedListings, data.kpis.usableListings);
  for (const label of ['Route Casablanca','Route de Safi','Ennakhil (Palmeraie)','Agdal','Hay Targa']) {
    assert.ok(summary.unmappedNeighborhoods.includes(label));
    assert.equal(crosswalk.entries.find((entry: MarrakechAttribution) => entry.originalNeighborhood === label).status, 'ambiguous');
  }
  assert.equal(normalizeMarrakechNeighborhood(' Guéliz '), 'gueliz');
  assert.equal(crosswalk.entries.find((entry: MarrakechAttribution) => entry.originalNeighborhood === 'Daoudiat').evidence[0].source, 'programme-2025-2027');
});

test('Marrakech aggregation pools individual ratios, enforces 7/8 threshold, rejects double counting and invalid evidence', () => {
  const rows = Array.from({length:8},(_,i)=>({id:String(i),neighborhood:i<4?'A':'B',price:i===7?200:100,area:i<4||i===7?10:1,collectedAt:'2026-08-14'}));
  const entry = (label:string,count:number): MarrakechAttribution => ({...crosswalk.entries.find((x: MarrakechAttribution)=>x.originalNeighborhood==='Guéliz'),originalNeighborhood:label,normalizedNeighborhood:label.toLowerCase(),listingCount:count});
  const entries = [entry('A',4),entry('B',4)];
  const result = aggregateMarrakechGeography(rows,entries,boundaries,crosswalk.sources);
  const item = result.arrondissements.find(x=>x.boundaryId==='relation/2799533')!;
  assert.equal(item.medianPricePerM2,15); // median(price)/median(area) would incorrectly give 10.
  assert.equal(item.medianListingPriceMad,100);
  assert.equal(item.medianArea,10);
  assert.equal(item.eligible,true);
  const low = aggregateMarrakechGeography(rows.slice(1),[entry('A',3),entry('B',4)],boundaries,crosswalk.sources).arrondissements.find(x=>x.boundaryId===item.boundaryId)!;
  assert.equal(low.eligible,false);assert.equal(low.medianPricePerM2,null);
  assert.equal(arrondissementColor(low,result.bins),'#e2e8f0');
  assert.throws(()=>aggregateMarrakechGeography([...rows,rows[0]],entries,boundaries,crosswalk.sources),/duplicate/);
  assert.throws(()=>aggregateMarrakechGeography(rows,[...entries,entries[0]],boundaries,crosswalk.sources),/Duplicate/);
  assert.throws(()=>aggregateMarrakechGeography(rows,[{...entries[0],status:'ambiguous'},entries[1]],boundaries,crosswalk.sources),/Unverified/);
  assert.throws(()=>aggregateMarrakechGeography(rows,[{...entries[0],evidence:[]},entries[1]],boundaries,crosswalk.sources),/evidence/);
  assert.throws(()=>aggregateMarrakechGeography(rows,[{...entries[0],administrativeIdentifier:'wrong'},entries[1]],boundaries,crosswalk.sources),/evidence/);
  assert.throws(()=>aggregateMarrakechGeography(rows.map((r,i)=>i? r:{...r,area:0}),entries,boundaries,crosswalk.sources),/Invalid/);
});

test('Marrakech bins are data-derived and only eligible original observations contribute', () => {
  const summary = getMarrakechMapSummary();
  assert.deepEqual(summary.bins.map(bin=>[bin.min,bin.max]),[[9239,9239],[9240,18690]]);
  for (const item of summary.arrondissements) {
    if (item.eligible) assert.equal(arrondissementColor(item,summary.bins), summary.bins.find(bin=>item.medianPricePerM2!<=bin.max)!.color);
    else assert.equal(item.medianPricePerM2,null);
  }
  assert.equal(new Set(getMarrakechMarketRows().map(row=>row.id)).size,1339);
});
