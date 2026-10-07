import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { securityDatabase, userA, userB } from './database';
import { validateModelInput, validatePreparedModelInput } from '../../lib/security/model-input';
import { verifyPrediction, estimatorMetadata } from '../../lib/estimations/contracts';
import { createPassportExportData } from '../../lib/account/passport-export';
import { executeMain } from '../../lib/estimations/execute';

const cases = [
  { input: { city: 'Marrakech', property_type: 'appartement', neighborhood: 'Guéliz', area: 100, rooms: 3, bedrooms: 2, bathrooms: 1, current_state: 'bon état', age: '5-10 ans' }, expected: 1468447.422627404 },
  { input: { city: 'Marrakech', property_type: 'villa', neighborhood: 'Palmeraie', area: 393, rooms: 7, bedrooms: 4, bathrooms: 3, current_state: 'bon état', age: '+10 ans' }, expected: 4700250.321581060 },
  { input: { city: 'Marrakech', property_type: 'appartement', neighborhood: 'Targa', area: 81, rooms: 2, bedrooms: 2, bathrooms: 2, current_state: 'bon état', age: '+10 ans' }, expected: 1472533.476353344 },
];

test('public capability and complete city contracts reject bypasses and incompatible fields', () => {
  const input = cases[0].input;
  assert.equal(estimatorMetadata('Marrakech').public_enabled, true);
  assert.deepEqual(validateModelInput(input), validatePreparedModelInput(input));
  for (const invalid of [{ ...input, allow_prepared: true }, { ...input, Loc_Type: 'fake' }, { ...input, floor: 1 },
    { ...input, city: 'Rabat' }, { ...input, neighborhood: 'Maârif' }, { ...input, property_type: 'riad' },
    { ...input, current_state: 'Bon état' }, { ...input, age: '10-20 ans' }, { ...input, area: NaN }, { ...input, rooms: 16 }]) {
    assert.throws(() => validatePreparedModelInput(invalid));
  }
  for (const field of ['area','rooms','bedrooms','bathrooms','current_state','age']) {
    const missing: Record<string,unknown> = { ...input }; delete missing[field];
    assert.throws(() => validatePreparedModelInput(missing));
  }
});

test('public pipeline uses real CPU model, exact city identity and transactional persistence', async () => {
  const db = await securityDatabase();
  try {
    await db.exec(readFileSync('supabase/migrations/005_phase_c_entitlements.sql', 'utf8'));
    await db.exec(readFileSync('supabase/migrations/006_prepared_city_inference.sql', 'utf8'));
    const beforeActivation=validateModelInput(cases[0].input);
    await assert.rejects(db.query('SELECT phase_c_complete_estimation($1,$2,$3,$4,$5)',[null,randomUUID(),userA,beforeActivation,{city:'Marrakech',model_id:'marrakech-stacking-alae',model_version:'marrakech-stacking-v1',estimated_price_mad:1468447}]));
    await db.exec(readFileSync('supabase/migrations/007_public_marrakech_activation.sql', 'utf8'));
    assert.equal((await db.query<any>("SELECT c.public_enabled,m.public_inference_enabled FROM cities c JOIN model_versions m ON m.city_id=c.id WHERE c.slug='marrakech'")).rows[0].public_enabled,true);
    const run = (input: unknown) => {
      const process = spawnSync(globalThis.process.env.MDL_TEST_PYTHON || 'python', ['-B','-X','utf8','-c',
        "import json,sys; from backend.inference import service; p=json.load(sys.stdin); print(json.dumps(service.estimate(p)))"], { input: JSON.stringify(input), encoding: 'utf8' });
      assert.equal(process.status, 0, process.stderr);
      return JSON.parse(process.stdout);
    };
    for (const [index, item] of Array.from(cases.entries())) {
      const input = validateModelInput(item.input), prediction = verifyPrediction(input, run(input));
      assert.ok(Math.abs(prediction.raw_price_mad - item.expected) <= 1e-6);
      const result = await db.query<{id:number}>('SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,$6::text) AS id', [null, randomUUID(), userA, input, prediction,index ? 'ar' : 'fr']);
      const event = (await db.query<any>('SELECT c.slug,m.version,m.model_identity,e.input_features,e.locale,p.prediction FROM estimation_events e JOIN cities c ON c.id=e.city_id JOIN model_versions m ON m.id=e.model_version_id JOIN estimation_passports p ON p.estimation_event_id=e.id WHERE e.id=$1', [result.rows[0].id])).rows[0];
      assert.equal(event.locale,index ? 'ar' : 'fr'); assert.equal(event.slug, 'marrakech'); assert.equal(event.version, 'marrakech-stacking-v1');
      assert.equal(event.model_identity, 'marrakech-stacking-alae'); assert.deepEqual(event.input_features, input);
      assert.equal(event.prediction.raw_price_mad, prediction.raw_price_mad);
      assert.throws(() => verifyPrediction(input, { ...prediction, model_version: 'casablanca-catboost-v1' }));
      assert.throws(() => verifyPrediction(input, { ...prediction, city: 'Casablanca' }));
      assert.throws(() => verifyPrediction(input, { ...prediction, model_id: 'casablanca-catboost-alae' }));
      await assert.rejects(db.query('SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,$6::text)', [null, randomUUID(), userA, input, prediction,'invalid']));
      const exported = createPassportExportData({created_at:'2026-10-06T12:00:00Z', estimated_price_mad:prediction.estimated_price_mad,input_features:input,prediction}, index ? 'ar' : 'fr');
      assert.equal(exported.city, index ? 'مراكش' : 'Marrakech'); assert.equal(exported.floor, undefined);
      assert.equal(exported.market, null); assert.equal(exported.comparables.length, 0);
    }
    const route = validatePreparedModelInput({...cases[0].input, neighborhood:'Route de Casablanca'});
    assert.equal(verifyPrediction(route, run(route)).city, 'Marrakech');
    const c = validateModelInput({city:'Casablanca',property_type:'appartement',neighborhood:'Maârif',area:100,rooms:3,bedrooms:2,bathrooms:2,floor:4,current_state:'Bon état',age:'10-20 ans'});
    const cPrediction = verifyPrediction(c, run(c)); assert.equal(cPrediction.estimated_price_mad,1217911);
    await db.query('SELECT phase_c_complete_estimation($1,$2,$3,$4,$5)',[null,randomUUID(),userA,c,cPrediction]);
    // Public Marrakech execution retains the very same guest lease and consumption rules.
    const token='m'.repeat(64), request=randomUUID(), input=validatePreparedModelInput(cases[0].input), prediction=run(input);
    const reserve=async()=>{const result=await db.query<any>('SELECT phase_c_reserve_guest($1,$2,$3,$4,30,8) AS decision',[token,'device-m','network-m',request]);assert.equal(result.rows[0].decision,'ALLOWED');};
    const release=async()=>{await db.query('SELECT phase_c_release_guest($1,$2)',[token,request]);};
    await assert.rejects(executeMain({reserve,predict:async()=>{throw new Error('FAILED_INFERENCE');},complete:async()=>{throw new Error('not reached');},release}));
    assert.equal((await db.query<any>('SELECT trial_consumed_at FROM guest_trials WHERE token_hash=$1',[token])).rows[0].trial_consumed_at,null);
    await executeMain({reserve,predict:async()=>prediction,complete:async()=>String((await db.query<any>("SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,'ar'::text) AS id",[token,request,null,input,prediction])).rows[0].id),release});
    const countBefore=(await db.query<any>('SELECT count(*)::int AS n FROM estimation_events')).rows[0].n;
    await assert.rejects(db.query("SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,'ar'::text)",[token,request,null,input,prediction]));
    assert.equal((await db.query<any>('SELECT count(*)::int AS n FROM estimation_events')).rows[0].n,countBefore);
    for (const patch of [{city:'Casablanca'},{model_id:'casablanca-catboost-alae'},{model_version:'casablanca-catboost-v1'}]) {
      await assert.rejects(db.query("SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,'ar'::text)",[null,randomUUID(),userA,input,{...prediction,...patch}]));
    }
    const claimed=(await db.query<any>('SELECT phase_c_claim_guest($1,$2) AS id',[token,userA])).rows[0].id;
    assert.ok(claimed);
    assert.equal((await db.query<any>('SELECT phase_c_claim_guest($1,$2) AS id',[token,userA])).rows[0].id,claimed);
    assert.equal((await db.query<any>('SELECT phase_c_claim_guest($1,$2) AS id',[token,userB])).rows[0].id,null);
    // Authenticated repetitions require no guest reservation and have no one-use cap.
    for(let i=0;i<2;i++) await db.query("SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,'ar'::text)",[null,randomUUID(),userA,input,prediction]);
    assert.equal((await db.query<any>('SELECT phase_c_reserve_guest($1,$2,$3,$4,30,8) AS decision',[token,'device-m','network-m',randomUUID()])).rows[0].decision,'GUEST_TRIAL_CONSUMED');
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${userB}';`);
    assert.equal((await db.query('SELECT * FROM estimation_events')).rows.length,0);
    await assert.rejects(db.query("SELECT phase_c_complete_estimation($1,$2,$3,$4,$5,'ar'::text)",[null,randomUUID(),userB,input,prediction]));
  } finally { await db.close(); }
});
