import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { buildRabatMarket, getRabatMarketAnalytics, getRabatMarketRows, type RabatObservation } from '../lib/analytics/rabat';
import { getRabatMapSummary } from '../lib/analytics/rabat-geography';
import { selectNeighborhoods } from '../lib/analytics/neighborhood-presentation';

test('Rabat reference reproduces the original 1165 → 700 cohort without changing sources', () => {
  const before = readFileSync('server-data/rabat-market.json');
  const snapshot = JSON.parse(before.toString());
  for (const source of snapshot.sources) assert.equal(createHash('sha256').update(readFileSync(source.path)).digest('hex'), source.sha256);
  const generated = spawnSync('python', ['scripts/build_rabat_market.py'], {encoding:'utf8'});
  assert.equal(generated.status, 0, generated.stderr);
  assert.deepEqual(readFileSync('server-data/rabat-market.json'), before);
  assert.deepEqual(snapshot.funnel, {raw:1165,after_bounds:1015,essential_complete:880,deduplicated:857,after_ppm2_iqr:700});
  const data = getRabatMarketAnalytics()!;
  assert.deepEqual(data.kpis, {usableListings:700, medianListingPriceMad:3800000, medianPricePerM2:15923, averageArea:519.8, neighborhoodsRepresented:33});
  assert.deepEqual(Object.fromEntries(data.propertyTypes.map(row=>[row.label,row.count])), {appartement:386,bureau:1,maison:35,studio:2,villa:276});
  assert.equal(data.neighborhoods.reduce((sum,row)=>sum+row.listingCount,0)+data.suppressedListings,700);
  assert.equal(data.charts.pricePerM2.reduce((sum,row)=>sum+row.count,0),700);
  assert.equal(data.charts.surface.reduce((sum,row)=>sum+row.count,0),700);
  assert.ok(getRabatMarketRows().every(row=>!('collectedAt' in row)));
  assert.equal(selectNeighborhoods(data.neighborhoods,8,'listingCount','AGDAL').length,2);
});

test('Rabat geography pools only evidenced listings, suppresses unresolved geography and uses price bins', () => {
  const map=getRabatMapSummary();
  assert.equal(map.boundaryCount,5);
  assert.equal(map.mappedListings,125);
  assert.equal(map.attribution!.unmappedListings,575);
  assert.deepEqual(map.mappedNeighborhoods,['Agdal','El Youssoufia','Hay Nahda']);
  assert.equal(map.arrondissements.filter(row=>row.eligible).length,2);
  assert.ok(map.arrondissements.filter(row=>!row.eligible).every(row=>row.medianPricePerM2===null));
  for(const item of map.arrondissements.filter(row=>row.eligible)) {
    const ratios=getRabatMarketRows().filter(row=>item.neighborhoods.includes(row.neighborhood)).map(row=>row.pricePerM2).sort((a,b)=>a-b);
    const middle=Math.floor(ratios.length/2);
    assert.equal(item.medianPricePerM2,Math.round(ratios.length%2?ratios[middle]:(ratios[middle-1]+ratios[middle])/2));
    assert.ok(map.bins.some(bin=>item.medianPricePerM2!>=bin.min&&item.medianPricePerM2!<=bin.max));
  }
  for(const name of ['Rabat','Skhirat','Souissi','Guich Oudaya','Hassan - Centre Ville']) assert.ok(map.unmappedNeighborhoods.includes(name));
});

test('Rabat provider rejects duplicate IDs, invalid types, nonfinite prices and areas; minimum is inclusive', () => {
  const row:RabatObservation={id:'1',neighborhood:'Test',propertyType:'appartement',price:1000000,area:100};
  const coverage={sourceRows:8,cleanRows:8,excluded:{}};
  assert.equal(buildRabatMarket([],coverage),null);
  for(const patch of [{area:0},{price:NaN},{price:Infinity},{propertyType:'unknown'},{neighborhood:''}]) assert.throws(()=>buildRabatMarket([{...row,...patch}],coverage));
  assert.throws(()=>buildRabatMarket([row,row],coverage));
  assert.equal(buildRabatMarket(Array.from({length:8},(_,i)=>({...row,id:String(i)})),coverage)!.neighborhoods.length,1);
  assert.equal(buildRabatMarket(Array.from({length:7},(_,i)=>({...row,id:String(i)})),coverage)!.neighborhoods.length,0);
});
