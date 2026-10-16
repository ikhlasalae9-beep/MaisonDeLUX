// Run: node --require ./tests/register-server-only.cjs --import tsx scripts/audit_marrakech_geography.cjs
// Reads only the reviewed cohort and geographic evidence. No network or listing collection.
const { readFileSync, writeFileSync } = require('node:fs');
const { getMarrakechMapSummary } = require('../lib/analytics/marrakech-geography.ts');
const crosswalk = JSON.parse(readFileSync('data/geographic/marrakech-market-crosswalk.json', 'utf8'));
const report = { reviewedAt: crosswalk.reviewedAt, snapshotSha256: crosswalk.snapshotSha256,
  boundarySha256: crosswalk.boundarySha256, attributionScope: crosswalk.attributionScope,
  ...getMarrakechMapSummary(),
  neighborhoodCoverage: crosswalk.entries.map(({originalNeighborhood,normalizedNeighborhood,listingCount,boundaryId,status,ambiguityNotes})=>({originalNeighborhood,normalizedNeighborhood,listingCount,boundaryId,status,ambiguityNotes})) };
const output = 'reports/marrakech-geographical-coverage.json';
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(`${output}: ${report.mappedListings}/${report.attribution.retainedListings} mapped; ${report.attribution.unmappedListings} unassigned`);
