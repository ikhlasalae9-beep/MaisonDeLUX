import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';

// Mock external session/model/database adapters, not route authorization logic.
// Database role/ownership enforcement is separately exercised in real PGlite.
let user:any=null,role='user',decision='ALLOWED',modelCalls=0,contextCalls=0,phaseReady=true,persistenceFails=false,verifyError=false,verifiedType='',passport:any=null,queries:{sql:string;values:any[]}[]=[];
const cookieJar=new Map<string,string>();
let existing:any=null;
const userId='11111111-1111-4111-8111-111111111111';
const prediction={estimated_price_mad:1500000,model_version:'casablanca-catboost-v1'};
const replace=(path:string,exports:any)=>{const filename=require.resolve(path);require.cache[filename]={id:filename,filename,loaded:true,exports} as any;};
replace('next/headers',{cookies:()=>({get:(key:string)=>cookieJar.has(key)?{value:cookieJar.get(key)}:undefined,set:(key:string,value:string)=>cookieJar.set(key,value),getAll:()=>[]})});
replace('../../lib/auth/server',{
  currentUser:async()=>user,
  authClient:()=>({from:(table:string)=>{assert.equal(table,'user_roles');return {select:()=>({eq:(column:string,id:string)=>{assert.equal(column,'user_id');assert.equal(id,userId);return {single:async()=>({data:{role},error:null})};}})};},auth:{exchangeCodeForSession:async()=>({data:{user},error:null}),verifyOtp:async({type}:{type:string})=>{verifiedType=type;return verifyError?{data:{user:null},error:new Error('INVALID')}:{data:{user:{id:userId}},error:null};}}}),
});
replace('../../lib/admin/db',{query:async(sql:string,values:any[]=[])=>{
  queries.push({sql,values});
  if(sql.includes('c.slug AS city_slug')&&sql.includes('e.event_key=$1'))return {rows:existing?[existing]:[]};
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
const confirm=require('../../app/auth/confirm/route');
const simulation=require('../../app/api/estimations/[id]/[action]/route');
const input={city:'Casablanca',property_type:'appartement',neighborhood:'Maârif',area:100,rooms:3,bedrooms:2,bathrooms:2,floor:4,current_state:'Bon état',age:'10-20 ans'};
const request=(body:any)=>new NextRequest('http://localhost:3000/api/estimations',{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json'},body:JSON.stringify(body)});
test.beforeEach(()=>{
  process.env.SITE_URL='http://localhost:3000';process.env.ADMIN_AUTH_MODE='supabase-only';process.env.GUEST_TRIAL_HMAC_SECRET='test-only-guest-hmac-secret-32-characters';
  user=null;role='user';decision='ALLOWED';modelCalls=0;contextCalls=0;phaseReady=true;persistenceFails=false;verifyError=false;verifiedType='';passport=null;existing=null;queries=[];cookieJar.clear();
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
test('public Marrakech rejection happens before any entitlement or inference operation',async()=>{
  const prepared={city:'Marrakech',property_type:'appartement',neighborhood:'Guéliz',area:100,rooms:3,bedrooms:2,bathrooms:1,current_state:'bon état',age:'5-10 ans'};
  const result=await main.POST(request({input:prepared,request_id:randomUUID()}));
  assert.equal(result.status,400); assert.equal(modelCalls,0); assert.equal(contextCalls,0);
  assert.ok(!queries.some(q=>q.sql.includes('phase_c_reserve_guest')||q.sql.includes('phase_c_complete_estimation')));
});
test('idempotent replay preserves legacy Casablanca identity and rejects another city result',async()=>{
  existing={id:123,city_slug:'casablanca',model_version:'casablanca-catboost-v1',prediction};
  assert.equal((await main.POST(request({input,request_id:randomUUID()}))).status,200);
  assert.equal(modelCalls,0);
  existing={...existing,city_slug:'marrakech',model_version:'marrakech-stacking-v1'};
  assert.equal((await main.POST(request({input,request_id:randomUUID()}))).status,503);
  assert.equal(modelCalls,0);
});
test('missing Phase C schema and persistence failures fail closed without reporting a successful estimate',async()=>{
  phaseReady=false;
  const compatibility=await main.POST(request({input,request_id:randomUUID()}));
  assert.equal(compatibility.status,503);assert.equal((await compatibility.json()).code,'SERVICE_UNAVAILABLE');
  assert.equal(modelCalls,0);assert.equal(contextCalls,0);assert.ok(!queries.some(q=>q.sql.includes('SELECT public.phase_c_reserve_guest')));
  phaseReady=true;persistenceFails=true;modelCalls=0;contextCalls=0;queries=[];
  const degraded=await main.POST(request({input,request_id:randomUUID()}));const body=await degraded.json();
  assert.equal(degraded.status,503);assert.equal(body.code,'SERVICE_UNAVAILABLE');
  assert.equal(modelCalls,1);assert.equal(contextCalls,0);
  assert.ok(queries.some(q=>q.sql.includes('phase_c_release_guest')));
});
test('customer identity and metadata never grant access to the separate admin session',async()=>{
  const req=new NextRequest('http://localhost:3000/api/admin/overview',{headers:{'x-role':'admin'}});
  await assert.rejects(requireAdmin(req));
  user={id:userId,email_confirmed_at:'2026-01-01',user_metadata:{role:'admin'}};
  await assert.rejects(requireAdmin(req));
  role='admin';await assert.rejects(requireAdmin(req));
});
test('every privileged Admin read endpoint rejects a verified customer without an admin session',async()=>{
  user={id:userId,email_confirmed_at:'2026-01-01'};
  for(const name of ['overview','estimations','model','db-health','data-intelligence','report','users-security']){
    const route=require(`../../app/api/admin/${name}/route`);
    const response=await route.GET(new NextRequest(`http://localhost:3000/api/admin/${name}`));
    assert.equal(response.status,401,name);
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
test('first-party token-hash confirmation establishes the session and preserves a safe localized continuation',async()=>{
  const nested=encodeURIComponent('http://localhost:3000/ar/auth/callback?next=%2Far%2Fcities%2Fcasablanca%2Festimate%3Fresume%3D1');
  const response=await confirm.GET(new NextRequest(`http://localhost:3000/auth/confirm?token_hash=valid-token-hash&type=email&locale=ar&redirect_to=${nested}`));
  assert.equal(response.status,307);assert.equal(verifiedType,'email');
  const location=new URL(response.headers.get('location')!);
  assert.equal(location.pathname,'/ar/auth/confirmed');assert.equal(location.searchParams.get('status'),'success');
  assert.equal(location.searchParams.get('next'),'/ar/cities/casablanca/estimate?resume=1');
});
test('confirmation rejects invalid tokens and never follows an external continuation',async()=>{
  verifyError=true;
  const invalid=await confirm.GET(new NextRequest('http://localhost:3000/auth/confirm?token_hash=expired&type=email&locale=fr&next=https://evil.test'));
  const location=new URL(invalid.headers.get('location')!);
  assert.equal(location.pathname,'/fr/auth/confirmed');assert.equal(location.searchParams.get('status'),'error');assert.equal(location.searchParams.has('token_hash'),false);
  verifiedType='';
  const malformed=await confirm.GET(new NextRequest('http://localhost:3000/auth/confirm?token_hash=bad%20token&type=email&locale=ar'));
  assert.equal(verifiedType,'');assert.match(malformed.headers.get('location')!,/\/ar\/auth\/confirmed\?status=error/);
});
