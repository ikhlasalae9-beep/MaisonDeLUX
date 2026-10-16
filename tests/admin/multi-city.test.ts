import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { PDFDocument } from 'pdf-lib';
import { NextRequest } from 'next/server';
import { getOverview, getEstimations, getProductionInputFeatures, resolvePeriod } from '../../lib/admin/analytics';
import { getDataIntelligence } from '../../lib/admin/data-intelligence';
import { getCasablancaDataQuality } from '../../lib/analytics/casablanca';
import { getModelIntegrity } from '../../lib/admin/model-integrity';
import { setDatabasePoolForTests } from '../../lib/admin/db';
import { createSessionToken } from '../../lib/admin/auth';
import { GET as intelligence } from '../../app/api/admin/data-intelligence/route';
import { GET as report } from '../../app/api/admin/report/route';
import metadata from '../../models/marrakech/v1/metadata.json';

const original = { ...process.env };
let db: PGlite;
const queries: { sql: string; values: unknown[] }[] = [];
test.before(async () => {
  process.env.POSTGRES_URL = 'postgresql://test:local@localhost/test';
  process.env.ADMIN_EMAIL = 'admin@example.test';
  process.env.ADMIN_SESSION_SECRET = 'test-only-admin-session-secret-32-characters';
  db = new PGlite();
  await db.exec(`CREATE TABLE cities (id bigint PRIMARY KEY, slug text, name text, region text, public_enabled boolean, created_at timestamptz DEFAULT now());
    CREATE TABLE model_versions (id bigint PRIMARY KEY, city_id bigint REFERENCES cities(id), version text, architecture text, status text, public_inference_enabled boolean, metrics jsonb, trained_at timestamptz, created_at timestamptz DEFAULT now());
    CREATE TABLE estimation_events (id bigint PRIMARY KEY, event_key text, city_id bigint REFERENCES cities(id), model_version_id bigint REFERENCES model_versions(id), input_features jsonb, estimated_price_mad numeric, is_test boolean DEFAULT false, created_at timestamptz DEFAULT now());
    CREATE TABLE estimation_passports (estimation_event_id bigint PRIMARY KEY REFERENCES estimation_events(id), prediction jsonb);
    INSERT INTO cities(id,slug,name,public_enabled) VALUES (1,'casablanca','Casablanca',true),(3,'marrakech','Marrakech',true);
    INSERT INTO model_versions(id,city_id,version,status,public_inference_enabled) VALUES (7,1,'casablanca-catboost-v1','registered',true),(9,3,'marrakech-stacking-v1','registered',true);
    INSERT INTO estimation_events(id,event_key,city_id,model_version_id,input_features,estimated_price_mad)
      SELECT n,'casa-'||n,1,7,'{"city":"Casablanca","area":100}'::jsonb,1000000 FROM generate_series(1,21) n;
    INSERT INTO estimation_events(id,event_key,city_id,model_version_id,input_features,estimated_price_mad)
      VALUES (30,'marrakech-1',3,9,'{"city":"Marrakech","area":80}',1200000),(31,'marrakech-2',3,9,'{"city":"Marrakech","area":120}',1800000);
    INSERT INTO estimation_events(id,event_key,city_id,model_version_id,input_features,estimated_price_mad,is_test) VALUES (32,'marrakech-test',3,9,'{"city":"Marrakech","area":100}',1500000,true);`);
  setDatabasePoolForTests({ query: async (sql: string, values: unknown[] = []) => {
    assert.match(sql.trim(), /^SELECT\b/i, 'Admin reads must not mutate the database');
    queries.push({ sql, values });
    return await db.query(sql, values) as any;
  } });
});
test.after(async () => { setDatabasePoolForTests(null); await db.close(); process.env = original; });

test('real SQL scopes events, models and city views while keeping platform totals and filter options global', async () => {
  const global: any = await getOverview('all');
  const casa: any = await getOverview('all', '1');
  const marrakech: any = await getOverview('all', '3');
  assert.equal(global.kpis.total, 23); assert.equal(casa.kpis.total, 21); assert.equal(marrakech.kpis.total, 2);
  assert.deepEqual(casa.platform, global.platform); assert.deepEqual(marrakech.platform, global.platform);
  assert.equal(marrakech.platform.recorded_estimations, 23);
  assert.deepEqual(marrakech.cities.map((city: any) => city.slug), ['marrakech']);
  assert.deepEqual(marrakech.models.map((model: any) => model.version), ['marrakech-stacking-v1']);
  assert.equal(marrakech.options.cities.length, 2); assert.equal(marrakech.options.models.length, 2);
  assert.equal(marrakech.models[0].public_inference_enabled, true);
  assert.equal(marrakech.models[0].documented_metadata.metrics_status, 'not_independently_recomputed');
  for (const key of ['activityByCity', 'recent', 'scatter']) assert.ok(marrakech[key].every((row: any) => !JSON.stringify(row).includes('Casablanca')));
  assert.equal((await getOverview('all', '1', '9') as any).kpis.total, 0);
  assert.equal((await getOverview('all', '1', '9') as any).models.length, 0);
  assert.equal((await getOverview('all', undefined, '9') as any).models[0].city_slug, 'marrakech');
  assert.equal((await getOverview('all', '3', undefined, true) as any).kpis.total, 3);
});

test('search, pagination, date and input-monitoring queries retain city/model ownership', async () => {
  assert.equal((await getEstimations('all', 1, '', '1') as any).rows.length, 20);
  assert.equal((await getEstimations('all', 2, '', '1') as any).rows.length, 1);
  assert.equal((await getEstimations('all', 1, '', '3') as any).rows.length, 2);
  assert.equal((await getEstimations('all', 1, 'casa', '3') as any).total, 0);
  assert.equal((await getEstimations('all', 1, "' OR 1=1 --", '3') as any).total, 0);
  assert.equal((await getEstimations('all', 1, '', '3', '7') as any).total, 0);
  await getOverview('7d', '3', '9');
  assert.ok(queries.some(query => query.sql.includes('e.city_id = $2') && query.sql.includes('e.model_version_id = $3') && JSON.stringify(query.values) === '[7,"3","9"]'));
  assert.equal((await getProductionInputFeatures('Marrakech', 'marrakech-stacking-v1')).length, 2);
  assert.equal((await getProductionInputFeatures('Marrakech', 'casablanca-catboost-v1')).length, 0);
  await getOverview('today', '3');
  assert.ok(queries.some(query => query.sql.includes('AVG(e.estimated_price_mad)') && query.sql.includes('e.created_at >= CURRENT_DATE') && JSON.stringify(query.values) === '["3"]'));
  assert.equal(resolvePeriod('toString'), '30d'); assert.equal(resolvePeriod('constructor'), '30d'); assert.equal(resolvePeriod('today'), 'today');
});

test('Marrakech quality reconciles snapshot provenance without exposing raw listings or inventing drift', async () => {
  const snapshot = JSON.parse(readFileSync('server-data/marrakech-market.json', 'utf8'));
  const data: any = await getDataIntelligence('marrakech'); const q = data.quality;
  assert.equal(q.totalRows, snapshot.sourceRows); assert.equal(q.usableRows, snapshot.rows.length);
  assert.equal(q.excludedRows + q.usableRows, q.totalRows);
  assert.deepEqual(q.invalidByRule, snapshot.excluded); assert.deepEqual(q.missingByField, snapshot.missing);
  assert.equal(q.neighborhoodCoverage.distinct, new Set(snapshot.rows.map((row: any) => row.neighborhood)).size);
  assert.equal(q.neighborhoodCoverage.eligible + q.neighborhoodCoverage.suppressed, q.neighborhoodCoverage.distinct);
  assert.equal(q.propertyTypeCoverage.reduce((sum: number, point: any) => sum + point.count, 0), q.totalRows);
  assert.ok(q.referenceDistributions.numeric.every((item: any) => item.count === q.usableRows && item.min <= item.q05 && item.q05 <= item.median && item.median <= item.q95 && item.q95 <= item.max));
  assert.equal(data.drift, null); assert.equal(q.duplicateRows, undefined);
  assert.ok(!JSON.stringify(data).includes(snapshot.rows[0].id));
  assert.deepEqual((await getDataIntelligence('casablanca')).quality, getCasablancaDataQuality());
});

test('integrity is derived from physical bytes, independently of database activation', () => {
  const integrity = getModelIntegrity(metadata.model_version)!;
  for (const [key, file, expected] of [['artifact', metadata.artifact, metadata.artifact_sha256], ['preprocessing', metadata.preprocessing, metadata.preprocessing_sha256]] as const)
    assert.equal(integrity[key], createHash('sha256').update(readFileSync(file)).digest('hex') === expected);
  assert.equal(integrity.runtimeVerified, false); assert.equal(getModelIntegrity('unknown'), null);
});

test('quality city parameters never bypass admin authorization and unsupported cities never fall back to Casablanca', async () => {
  for (const city of ['casablanca', 'marrakech', 'rabat', '../../etc/passwd'])
    assert.equal((await intelligence(new NextRequest(`http://localhost/api/admin/data-intelligence?city=${encodeURIComponent(city)}`))).status, 401);
  const token = await createSessionToken('admin@example.test');
  const request = (city: string) => new NextRequest(`http://localhost/api/admin/data-intelligence?city=${city}`, { headers: { cookie: `maisondelux_admin=${token}` } });
  assert.equal((await intelligence(request('rabat'))).status, 400);
  const result = await intelligence(request('marrakech'));
  assert.equal(result.status, 200); assert.equal((await result.json()).quality.city, 'Marrakech');
  assert.match(result.headers.get('cache-control')!, /private.*no-store/);
});

test('existing PDF report passes city/model/date filters to SQL and produces a protected three-page export', async () => {
  assert.equal((await report(new NextRequest('http://localhost/api/admin/report?cityId=3'))).status, 401);
  const token = await createSessionToken('admin@example.test'); queries.length = 0;
  const response = await report(new NextRequest('http://localhost/api/admin/report?period=7d&cityId=3&modelId=9', { headers: { cookie: `maisondelux_admin=${token}` } }));
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.equal((await PDFDocument.load(await response.arrayBuffer())).getPageCount(), 3);
  assert.ok(queries.some(query => query.sql.includes('AVG(e.estimated_price_mad)') && JSON.stringify(query.values) === '[7,"3","9"]'));
});
