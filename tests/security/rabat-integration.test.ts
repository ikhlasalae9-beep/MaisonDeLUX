import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { securityDatabase, userA, userB } from './database';
import { validateModelInput, validatePreparedModelInput } from '../../lib/security/model-input';
import { inferenceContract, requirePublicInference, verifyPrediction, estimatorMetadata } from '../../lib/estimations/contracts';
import { createSignedInferenceRequest, invokeInference } from '../../lib/estimations/gateway';
import { executeMain } from '../../lib/estimations/execute';
import { setDatabasePoolForTests } from '../../lib/admin/db';
import { createSessionToken } from '../../lib/admin/auth';
import { GET as overview } from '../../app/api/admin/overview/route';
import { getCityBySlug } from '../../lib/cities/registry';
import metadata from '../../models/rabat/v1/metadata.json';
import manifest from '../../models/rabat/v1/preprocessing.json';

const original = { ...process.env }, originalFetch = globalThis.fetch;
const fields = { property_type:'Type', neighborhood:'Localisation', area:'Area', rooms:'Rooms', bedrooms:'Bedrooms', bathrooms:'Bathrooms', current_state:'Current_state', age:'Age' };
const inputFor = (c: typeof metadata.golden_prediction_cases[number]) => ({ city:'Rabat', ...Object.fromEntries(Object.entries(fields).map(([source,target]) => [source, (c.input as Record<string,unknown>)[target]])) });
const input = inputFor(metadata.golden_prediction_cases[0]);
let db: Awaited<ReturnType<typeof securityDatabase>>, cityId: string;

test.before(async () => {
  process.env.POSTGRES_URL = 'postgresql://isolated:fixture@localhost/isolated';
  process.env.SITE_URL = 'http://localhost:3000';
  process.env.INFERENCE_GATEWAY_SECRET = 'test-only-rabat-gateway-secret-at-least-32-characters';
  process.env.ADMIN_EMAIL = 'admin@example.test';
  process.env.ADMIN_SESSION_SECRET = 'test-only-rabat-admin-secret-at-least-32-characters';
  db = await securityDatabase();
  await db.exec(readFileSync('supabase/migrations/005_phase_c_entitlements.sql', 'utf8'));
  // Do NOT execute the new manual migration. Exercise an isolated fixture of
  // the existing RPC with its canonical tuple extended; assert the resulting
  // function definition matches the reviewed manual migration exactly.
  const old = readFileSync('supabase/migrations/006_prepared_city_inference.sql', 'utf8');
  const fixture = old.replace("('Marrakech','marrakech-stacking-v1','marrakech-stacking-alae'))", "('Marrakech','marrakech-stacking-v1','marrakech-stacking-alae'),\n                 ('Rabat','rabat-random-forest-v1','rabat-random-forest'))")
    .replace("expected_city='Marrakech'", "expected_city IN ('Marrakech','Rabat')");
  const manual = readFileSync('supabase/migrations/rabat_application_integration.sql', 'utf8');
  const body = (sql: string) => sql.split('phase_c_complete_estimation_internal(p_token')[1].split('END; $$;')[0].replace(/\s+/g,' ').trim();
  assert.equal(body(fixture), body(readFileSync('supabase/migrations/rabat_public_integration.sql','utf8')));
  assert.equal(body(fixture), body(manual), 'Isolated writer body must match manual SQL; the migration file stays unapplied');
  await db.exec(fixture);
  await db.exec(readFileSync('supabase/migrations/007_public_marrakech_activation.sql', 'utf8'));
  await db.exec(`ALTER TABLE model_versions ADD COLUMN metrics jsonb, ADD COLUMN trained_at timestamptz, ADD COLUMN created_at timestamptz DEFAULT now();
    INSERT INTO cities(slug,name,region,public_enabled) VALUES('rabat','Rabat','Rabat-Salé-Kénitra',false);
    INSERT INTO model_versions(city_id,version,model_identity,architecture,artifact_path,status,public_inference_enabled)
      SELECT id,'rabat-random-forest-v1','rabat-random-forest','RandomForestRegressor','models/rabat/v1/model.joblib','registered',false FROM cities WHERE slug='rabat';`);
  cityId = String((await db.query<any>("SELECT id FROM cities WHERE slug='rabat'")).rows[0].id);
  setDatabasePoolForTests({ query: async (sql: string, values: unknown[] = []) => await db.query(sql, values) as any });
});
test.after(async () => { setDatabasePoolForTests(null); globalThis.fetch = originalFetch; await db.close(); process.env = original; });

test('approved Rabat contracts cover frozen cases and still enforce a disabled city gate', async () => {
  assert.equal(inferenceContract('Rabat').version, 'rabat-random-forest-v1');
  assert.equal(estimatorMetadata('Rabat').public_enabled, true);
  assert.equal(estimatorMetadata('Rabat').status, 'available');
  assert.deepEqual(estimatorMetadata('Rabat').age_band_to_years, manifest.age_band_to_years);
  for (const c of metadata.golden_prediction_cases) {
    const prepared = validatePreparedModelInput(inputFor(c));
    assert.equal(prepared.neighborhood, c.expected_location);
    assert.equal(prepared.age, c.input.Age);
    assert.deepEqual(validateModelInput(inputFor(c)), prepared);
  }
  assert.equal(requirePublicInference('Rabat').version, 'rabat-random-forest-v1');
  const capability = getCityBySlug('rabat')!.estimation;
  const prior = capability.publicEnabled; capability.publicEnabled = false;
  let calls = 0;
  globalThis.fetch = (async () => { calls++; throw new Error('Public transport must not run'); }) as typeof fetch;
  await assert.rejects(invokeInference('estimate', validatePreparedModelInput(input)), /CITY_NOT_PUBLIC/);
  assert.equal(calls, 0);
  capability.publicEnabled = prior;
  globalThis.fetch = originalFetch;
  for (const invalid of [{...input, age:'5-10 ans'}, {...input, age:15}, {...input, rooms:true},
    {...input, current_state:'Bon état'}, {...input, neighborhood:'__proto__'}, {...input, neighborhood:'unknown'},
    {...input, area:34}, {...input, rooms:19}, {...input, floor:1}, {...input, allow_prepared:true}]) {
    assert.throws(() => validatePreparedModelInput(invalid));
  }
  for (const field of Object.keys(input)) {
    const incomplete:Record<string,unknown> = {...input}; delete incomplete[field];
    assert.throws(() => validatePreparedModelInput(incomplete));
  }
});

function cpu(input: ReturnType<typeof validatePreparedModelInput>) {
  const request = createSignedInferenceRequest('estimate', input);
  const child = spawnSync(process.env.MDL_TEST_PYTHON || 'python', ['-B','-X','utf8','-c', `
import json,sys
from backend.app import app
from backend.security import require_gateway
from backend.inference import service
request=json.load(sys.stdin)
with app.test_request_context(request['path'],method='POST',data=request['body'],headers=request['headers']):
    assert require_gateway() is None, 'Gateway signature invalid'
    payload=json.loads(request['body'])
    result=service.estimate(payload,allow_prepared=True) # Explicit trusted test invocation only; HTTP never forwards this.
    _,_,normalized=service.normalized_input(payload,allow_prepared=True)
    print(json.dumps({'prediction':result,'normalized':normalized}))
`], { input:JSON.stringify(request), encoding:'utf8', timeout:60000 });
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout);
}

test('internal signed transport → real Rabat CPU service → protected RPC → event/passport → authenticated Admin', async () => {
  const cases = [metadata.golden_prediction_cases[0], metadata.golden_prediction_cases.find(c => c.id === 'Type-villa')!, metadata.golden_prediction_cases.find(c => c.id.startsWith('rare-'))!];
  for (const c of cases) {
    const validated = validatePreparedModelInput(inputFor(c));
    const result = cpu(validated);
    assert.deepEqual(result.normalized, validated, 'Python and TypeScript must agree on persisted inputs');
    const prediction = verifyPrediction(validated, result.prediction);
    assert.ok(Math.abs(prediction.raw_price_mad-c.expected_mad) <= 1e-6);
    for (const bad of [{city:'Casablanca'}, {model_id:'marrakech-stacking-alae'}, {model_version:'casablanca-catboost-v1'}]) {
      assert.throws(() => verifyPrediction(validated, {...prediction,...bad}));
      await assert.rejects(db.query('SELECT phase_c_complete_estimation_internal($1,$2,$3,$4,$5,true)', [null,randomUUID(),userA,validated,{...prediction,...bad}]));
    }
    // The public six-argument wrapper remains closed even for authentic CPU output.
    await assert.rejects(db.query("SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,'fr')", [null,randomUUID(),userA,validated,prediction]));
    const request = randomUUID();
    await db.exec('SET ROLE service_role');
    const completed = await db.query<any>('SELECT phase_c_complete_estimation_internal($1,$2,$3,$4,$5,true) AS id', [null,request,userA,validated,prediction]);
    await db.exec('RESET ROLE');
    const stored = (await db.query<any>(`SELECT e.*,c.slug,m.version,m.model_identity,p.prediction FROM estimation_events e
      JOIN cities c ON c.id=e.city_id JOIN model_versions m ON m.id=e.model_version_id AND m.city_id=e.city_id
      JOIN estimation_passports p ON p.estimation_event_id=e.id WHERE e.id=$1`, [completed.rows[0].id])).rows[0];
    assert.equal(stored.slug,'rabat'); assert.equal(stored.version,'rabat-random-forest-v1');
    assert.equal(stored.model_identity,'rabat-random-forest'); assert.equal(stored.user_id,userA);
    assert.deepEqual(stored.input_features, validated); assert.equal(stored.prediction.raw_price_mad, prediction.raw_price_mad);
    await assert.rejects(db.query('SELECT phase_c_complete_estimation_internal($1,$2,$3,$4,$5,true)', [null,request,userA,validated,prediction]));
  }
  const session = await createSessionToken(process.env.ADMIN_EMAIL!);
  const response = await overview(new NextRequest('http://localhost:3000/api/admin/overview?period=all&cityId='+cityId, {headers:{cookie:`maisondelux_admin=${session}`}}));
  assert.equal(response.status,200);
  const data = await response.json(); assert.equal(data.kpis.total,3); assert.equal(data.kpis.saved_results,3);
  assert.ok(data.recent.every((event:any) => event.city === 'Rabat'));
  assert.ok(data.models.every((model:any) => model.public_inference_enabled === false));
  await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${userB}'`);
  assert.equal((await db.query('SELECT * FROM estimation_events')).rows.length,0);
  await assert.rejects(db.query('SELECT phase_c_complete_estimation_internal($1,$2,$3,$4,$5,true)', [null,randomUUID(),userB,input,{}]));
  await db.exec('RESET ROLE');
});

test('guest reservation, failure release, one-use completion and claims retain existing rules', async () => {
  const validated = validatePreparedModelInput(input), prediction = cpu(validated).prediction;
  const token='r'.repeat(64), request=randomUUID();
  const reserve = async () => { assert.equal((await db.query<any>('SELECT phase_c_reserve_guest($1,$2,$3,$4,30,8) AS decision',[token,'device-r','network-r',request])).rows[0].decision,'ALLOWED'); };
  const release = async () => { await db.query('SELECT phase_c_release_guest($1,$2)',[token,request]); };
  const complete = async () => String((await db.query<any>('SELECT phase_c_complete_estimation_internal($1,$2,$3,$4,$5,true) AS id',[token,request,null,validated,prediction])).rows[0].id);
  await assert.rejects(executeMain({reserve,predict:async()=>{throw new Error('INFERENCE_FAILED');},complete,release}));
  assert.equal((await db.query<any>('SELECT trial_consumed_at FROM guest_trials WHERE token_hash=$1',[token])).rows[0].trial_consumed_at,null);
  const id = await executeMain({reserve,predict:async()=>prediction,complete,release});
  assert.ok(id);
  await assert.rejects(complete());
  const claimed = (await db.query<any>('SELECT phase_c_claim_guest($1,$2) AS id',[token,userA])).rows[0].id;
  assert.ok(claimed);
  assert.equal((await db.query<any>('SELECT phase_c_claim_guest($1,$2) AS id',[token,userA])).rows[0].id,claimed);
  assert.equal((await db.query<any>('SELECT phase_c_claim_guest($1,$2) AS id',[token,userB])).rows[0].id,null);
});

test('unmigrated database state refuses public persistence without writing a successful event', async () => {
  const before = (await db.query<any>('SELECT count(*) AS n FROM estimation_events')).rows[0];
  const prediction = (await db.query<any>('SELECT prediction FROM estimation_passports ORDER BY estimation_event_id LIMIT 1')).rows[0].prediction;
  await assert.rejects(db.query("SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,'fr')",[null,randomUUID(),userA,validateModelInput(input),prediction]));
  assert.deepEqual((await db.query<any>('SELECT count(*) AS n FROM estimation_events')).rows[0],before);
  const flags=(await db.query<any>("SELECT c.public_enabled,m.public_inference_enabled FROM cities c JOIN model_versions m ON m.city_id=c.id WHERE c.slug='rabat'")).rows[0];
  assert.equal(flags.public_enabled,false); assert.equal(flags.public_inference_enabled,false);
});
