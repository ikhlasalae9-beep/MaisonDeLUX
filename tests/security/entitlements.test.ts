import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { securityDatabase, userA, userB } from './database';
import { executeMain } from '../../lib/estimations/execute';
import { coarseIdentity, hashIdentity } from '../../lib/security/identity';
import { validateSimulation } from '../../lib/security/model-input';

test('guest entitlement, failure release, race exclusion, durable limits, claims and authenticated continuation', async () => {
  const db=await securityDatabase();
  try {
    await db.exec(readFileSync('supabase/migrations/005_phase_c_entitlements.sql','utf8'));
    const token='a'.repeat(64), request=randomUUID(), prediction={estimated_price_mad:1500000,model_version:'casablanca-catboost-v1'}, input={city:'Casablanca'};
    const reserve=async(t=token,d='device',n='network',r=request,cap=8) => (await db.query<{decision:string}>('SELECT phase_c_reserve_guest($1,$2,$3,$4,30,$5) AS decision',[t,d,n,r,cap])).rows[0].decision;
    assert.equal(await reserve(),'ALLOWED');
    assert.equal(await reserve(),'ESTIMATION_IN_PROGRESS');
    assert.equal(await reserve('b'.repeat(64)),'ESTIMATION_IN_PROGRESS');
    await db.query('SELECT phase_c_release_guest($1,$2)',[token,request]);
    let calls=0;
    await assert.rejects(executeMain({reserve:async()=>{assert.equal(await reserve(),'ALLOWED');},predict:async()=>{calls++;throw new Error('MODEL_FAILED');},complete:async()=>{throw new Error('must not commit');},release:async()=>{await db.query('SELECT phase_c_release_guest($1,$2)',[token,request]);}}));
    assert.equal((await db.query<any>('SELECT trial_consumed_at FROM guest_trials WHERE token_hash=$1',[token])).rows[0].trial_consumed_at,null);
    const complete=async(user:string|null,r=request,t:string|null=token) => String((await db.query<{id:number}>('SELECT phase_c_complete_estimation($1,$2,$3,$4,$5) AS id',[t,r,user,input,prediction])).rows[0].id);
    const result=await executeMain({reserve:async()=>{assert.equal(await reserve(),'ALLOWED');},predict:async()=>{calls++;return prediction;},complete:()=>complete(null),release:async()=>{}});
    assert.equal(await reserve(),'GUEST_TRIAL_CONSUMED');
    await assert.rejects(executeMain({reserve:async()=>{if(await reserve()!=='ALLOWED')throw new Error('BLOCKED');},predict:async()=>{calls++;return prediction;},complete:()=>complete(null),release:async()=>{}}));
    assert.equal(calls,2); // exactly the failed first attempt plus the successful retry
    assert.equal(await reserve('c'.repeat(64)),'GUEST_TRIAL_CONSUMED'); // another browser / cleared storage
    assert.equal(await reserve('d'.repeat(64),'different-device','network',randomUUID(),1),'RATE_LIMITED');
    assert.equal(await reserve('e'.repeat(64),'other-device','other-network',randomUUID()),'ALLOWED');
    const before=(await db.query<any>('SELECT count(*)::int AS n FROM estimation_events')).rows[0].n;
    const base={city:'Casablanca' as const,property_type:'appartement',neighborhood:'Anfa',area:100,rooms:3,bedrooms:2,bathrooms:1,floor:2,current_state:null,age:null};
    assert.equal(validateSimulation(base,{...base,area:110}).area,110);
    assert.throws(()=>validateSimulation(base,{...base,neighborhood:'Oasis'}));
    assert.equal((await db.query<any>('SELECT count(*)::int AS n FROM estimation_events')).rows[0].n,before);
    const claim=async(t:string,u:string) => (await db.query<{id:number|null}>('SELECT phase_c_claim_guest($1,$2) AS id',[t,u])).rows[0].id;
    assert.equal(await claim('f'.repeat(64),userB),null);
    assert.equal(String(await claim(token,userA)),result.id);
    assert.equal(String(await claim(token,userA)),result.id);
    assert.equal(await claim(token,userB),null);
    assert.equal((await db.query<any>("SELECT count(*)::int AS n FROM security_audit_logs WHERE event_type='guest_estimation_claimed'")).rows[0].n,1);
    await complete(userA,randomUUID(),null); await complete(userA,randomUUID(),null);
    assert.equal((await db.query<any>('SELECT count(*)::int AS n FROM estimation_events WHERE user_id=$1',[userA])).rows[0].n,3);
    assert.equal((await db.query<any>('SELECT phase_c_rate_limit($1,1,60) AS allowed',['test'])).rows[0].allowed,true);
    assert.equal((await db.query<any>('SELECT phase_c_rate_limit($1,1,60) AS allowed',['test'])).rows[0].allowed,false);
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${userB}';`);
    await assert.rejects(db.query('SELECT phase_c_claim_guest($1,$2)',[token,userB]));
    await assert.rejects(db.query('SELECT phase_c_complete_estimation($1,$2,$3,$4,$5)',[null,randomUUID(),userB,input,prediction]));
    assert.equal((await db.query('SELECT * FROM estimation_events')).rows.length,0);
  } finally {await db.close();}
});

test('privacy heuristic ignores browser brand and uses normalized network prefixes', () => {
  process.env.GUEST_TRIAL_HMAC_SECRET='test-only-secret-not-a-production-value';
  process.env.TRUSTED_CLIENT_IP_HEADER='x-test-ip';
  const a=new Headers({'x-test-ip':'192.0.2.12','user-agent':'Windows Chrome','accept-language':'fr-FR'});
  const b=new Headers({'x-test-ip':'192.0.2.40','user-agent':'Windows Firefox','accept-language':'fr-FR'});
  assert.deepEqual(coarseIdentity(a),coarseIdentity(b));
  assert.equal(hashIdentity('token','secret').includes('secret'),false);
  delete process.env.TRUSTED_CLIENT_IP_HEADER;
});

test('local development creates a process-local guest key but production requires the dedicated variable', () => {
  const originalNodeEnv=process.env.NODE_ENV, originalGuest=process.env.GUEST_TRIAL_HMAC_SECRET;
  try {
    delete process.env.GUEST_TRIAL_HMAC_SECRET;
    (process.env as Record<string,string|undefined>).NODE_ENV='development';
    const first=hashIdentity('token','guest');
    assert.equal(first.length,64);
    assert.equal(first,hashIdentity('token','guest'));
    (process.env as Record<string,string|undefined>).NODE_ENV='production';
    assert.throws(()=>hashIdentity('token','guest'),/GUEST_SECRET_UNAVAILABLE/);
  } finally {
    if(originalNodeEnv===undefined)delete (process.env as Record<string,string|undefined>).NODE_ENV;else (process.env as Record<string,string|undefined>).NODE_ENV=originalNodeEnv;
    if(originalGuest===undefined)delete process.env.GUEST_TRIAL_HMAC_SECRET;else process.env.GUEST_TRIAL_HMAC_SECRET=originalGuest;
  }
});
