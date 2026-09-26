import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';

// Mock external session/model/database adapters, not route authorization logic.
// Database role/ownership enforcement is separately exercised in real PGlite.
let user:any=null,role='user',decision='ALLOWED',modelCalls=0,contextCalls=0,phaseReady=true,persistenceFails=false,passport:any=null,queries:{sql:string;values:any[]}[]=[];
const cookieJar=new Map<string,string>();
const userId='11111111-1111-4111-8111-111111111111';
const prediction={estimated_price_mad:1500000,model_version:'casablanca-catboost-v1'};
const replace=(path:string,exports:any)=>{const filename=require.resolve(path);require.cache[filename]={id:filename,filename,loaded:true,exports} as any;};
replace('next/headers',{cookies:()=>({get:(key:string)=>cookieJar.has(key)?{value:cookieJar.get(key)}:undefined,set:(key:string,value:string)=>cookieJar.set(key,value),getAll:()=>[]})});
replace('../../lib/auth/server',{
  currentUser:async()=>user,
  authClient:()=>({from:(table:string)=>{assert.equal(table,'user_roles');return {select:()=>({eq:(column:string,id:string)=>{assert.equal(column,'user_id');assert.equal(id,userId);return {single:async()=>({data:{role},error:null})};}})};},auth:{exchangeCodeForSession:async()=>({data:{user},error:null})}}),
});
replace('../../lib/admin/db',{query:async(sql:string,values:any[]=[])=>{
  queries.push({sql,values});
  if(sql.includes("to_regclass('public.guest_trials')"))return {rows:[{ready:phaseReady}]};
  if(sql.includes('phase_c_rate_limit'))return {rows:[{allowed:true}]};
  if(sql.includes('phase_c_reserve_guest'))return {rows:[{decision}]};
  if(sql.includes('phase_c_complete_estimation')){if(persistenceFails)throw new Error('DB_WRITE_FAILED');return {rows:[{id:123}]};}
  if(sql.includes('LEFT JOIN public.estimation_passports'))return {rows:passport?[passport]:[]};
  return {rows:[]};
}});
replace('../../lib/estimations/gateway',{invokeInference:async(kind:string)=>{if(kind==='context'){contextCalls++;return {comparables:[]};}modelCalls++;return prediction;}});
const main=require('../../app/api/estimations/route');
const {requireAdmin}=require('../../lib/admin/require');
const callback=require('../../app/[locale]/auth/callback/route');
const simulation=require('../../app/api/estimations/[id]/[action]/route');
const input={city:'Casablanca',property_type:'appartement',neighborhood:'Maârif',area:100,rooms:3,bedrooms:2,bathrooms:2,floor:4,current_state:'Bon état',age:'10-20 ans'};
const request=(body:any)=>new NextRequest('http://localhost:3000/api/estimations',{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json'},body:JSON.stringify(body)});
test.beforeEach(()=>{
  process.env.SITE_URL='http://localhost:3000';process.env.ADMIN_AUTH_MODE='supabase-only';process.env.GUEST_TRIAL_HMAC_SECRET='test-only-guest-hmac-secret-32-characters';
  user=null;role='user';decision='ALLOWED';modelCalls=0;contextCalls=0;phaseReady=true;persistenceFails=false;passport=null;queries=[];cookieJar.clear();
});
test('actual main route checks entitlement before inference, persists success and refuses forged ownership',async()=>{
  const first=await main.POST(request({input,request_id:randomUUID()}));
  assert.equal(first.status,200);assert.equal((await first.json()).estimation_event_id,'123');assert.equal(modelCalls,1);
  assert.ok(queries.some(q=>q.sql.includes('phase_c_complete_estimation')&&q.values[2]===null));
  decision='GUEST_TRIAL_CONSUMED';
  const second=await main.POST(request({input,request_id:randomUUID()}));
  assert.equal(second.status,403);assert.equal((await second.json()).code,'GUEST_TRIAL_CONSUMED');assert.equal(modelCalls,1);
  assert.equal((await main.POST(request({input,request_id:randomUUID(),user_id:userId}))).status,400);
});
test('authenticated main route uses verified identity and does not reserve guest trials',async()=>{
  user={id:userId,email_confirmed_at:'2026-01-01'};
  for(let i=0;i<2;i++)assert.equal((await main.POST(request({input,request_id:randomUUID()}))).status,200);
  assert.equal(modelCalls,2);assert.ok(!queries.some(q=>q.sql.includes('SELECT public.phase_c_reserve_guest')));
  assert.ok(queries.filter(q=>q.sql.includes('SELECT public.phase_c_complete_estimation')).every(q=>q.values[2]===userId));
});
test('missing Phase C schema and optional persistence failures never erase a valid prediction',async()=>{
  phaseReady=false;
  const compatibility=await main.POST(request({input,request_id:randomUUID()}));
  assert.equal(compatibility.status,200);assert.equal((await compatibility.json()).phase_c_degraded,true);
  assert.equal(modelCalls,1);assert.equal(contextCalls,1);assert.ok(!queries.some(q=>q.sql.includes('SELECT public.phase_c_reserve_guest')));
  phaseReady=true;persistenceFails=true;modelCalls=0;contextCalls=0;queries=[];
  const degraded=await main.POST(request({input,request_id:randomUUID()}));const body=await degraded.json();
  assert.equal(degraded.status,200);assert.equal(body.estimated_price_mad,1500000);assert.equal(body.phase_c_degraded,true);
  assert.equal(modelCalls,1);assert.equal(contextCalls,1);
  assert.ok(queries.some(q=>q.sql.includes('phase_c_release_guest')));
});
test('server Admin authority rejects normal users and accepts only database admin role',async()=>{
  const req=new NextRequest('http://localhost:3000/api/admin/overview',{headers:{'x-role':'admin'}});
  await assert.rejects(requireAdmin(req));
  user={id:userId,email_confirmed_at:'2026-01-01',user_metadata:{role:'admin'}};
  await assert.rejects(requireAdmin(req));
  role='admin';assert.deepEqual(await requireAdmin(req),{userId,source:'supabase'});
});
test('every privileged Admin read endpoint rejects a normal verified user',async()=>{
  user={id:userId,email_confirmed_at:'2026-01-01'};
  for(const name of ['overview','estimations','model','db-health','data-intelligence','report','users-security']){
    const route=require(`../../app/api/admin/${name}/route`);
    const response=await route.GET(new NextRequest(`http://localhost:3000/api/admin/${name}`));
    assert.equal(response.status,403,name);
  }
});
test('actual what-if route checks ownership and never creates or consumes a main trial',async()=>{
  cookieJar.set('mdl_guest','a'.repeat(43));
  const params={params:{id:'123',action:'simulate'}};
  assert.equal((await simulation.POST(request({input:{...input,area:110}}),params)).status,404);
  assert.equal(modelCalls,0);
  passport={id:'123',input_features:input,prediction};
  const response=await simulation.POST(request({input:{...input,area:110}}),params);
  assert.equal(response.status,200);assert.equal(modelCalls,1);
  assert.equal((await simulation.POST(request({input:{...input,neighborhood:'Anfa'}}),params)).status,400);
  assert.equal(modelCalls,1);
  assert.ok(!queries.some(q=>/phase_c_(complete_estimation|reserve_guest)/.test(q.sql)));
});
test('recovery callback preserves Arabic and invalid links return to localized recovery',async()=>{
  const good=await callback.GET(new NextRequest('http://localhost:3000/ar/auth/callback?code=test&flow=recovery'),{params:{locale:'ar'}});
  assert.equal(good.headers.get('location'),'http://localhost:3000/ar/auth/reset-password');
  const invalid=await callback.GET(new NextRequest('http://localhost:3000/ar/auth/callback?flow=recovery'),{params:{locale:'ar'}});
  assert.equal(invalid.headers.get('location'),'http://localhost:3000/ar/auth/forgot-password?error=link');
});
