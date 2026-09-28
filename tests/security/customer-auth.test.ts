import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

let current:any=null;
let signup:any={data:{user:null,session:null},error:null};
let login:any={data:{user:null,session:null},error:{code:'invalid_credentials'}};
let signedOut=false;
const queries:{sql:string;values:any[]}[]=[];
const cookieJar=new Map<string,string>();
const replace=(path:string,exports:any)=>{const filename=require.resolve(path);require.cache[filename]={id:filename,filename,loaded:true,exports} as any;};

replace('next/headers',{cookies:()=>({get:(key:string)=>cookieJar.has(key)?{value:cookieJar.get(key)}:undefined,set:()=>{},getAll:()=>[]})});
replace('../../lib/auth/server',{
  currentUser:async()=>current,
  authClient:()=>({auth:{
    signUp:async()=>signup,
    signInWithPassword:async()=>login,
    signOut:async()=>{signedOut=true;return {error:null};},
    resetPasswordForEmail:async()=>({error:null}),
    updateUser:async()=>({error:null}),
  },from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{display_name:'Client'},error:null})})})})}),
});
replace('../../lib/admin/db',{query:async(sql:string,values:any[]=[])=>{
  queries.push({sql,values});
  if(sql.includes('phase_c_rate_limit'))return {rows:[{allowed:true}]};
  if(sql.includes('phase_c_claim_guest'))return {rows:[{id:123}]};
  return {rows:[]};
}});

const route=require('../../app/api/auth/[action]/route');
const accountRoute=require('../../app/api/account/route');
const userId='11111111-1111-4111-8111-111111111111';
function request(action:string,body:any){return new NextRequest(`http://localhost:3000/api/auth/${action}`,{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json','sec-fetch-site':'same-origin'},body:JSON.stringify(body)});}

test.beforeEach(()=>{
  process.env.SITE_URL='http://localhost:3000';
  process.env.GUEST_TRIAL_HMAC_SECRET='test-only-guest-hmac-secret-32-characters';
  current=null;signup={data:{user:null,session:null},error:null};login={data:{user:null,session:null},error:{code:'invalid_credentials'}};signedOut=false;queries.length=0;cookieJar.clear();
});

test('signup supports confirmation and immediate-session provider modes',async()=>{
  const confirmation=await route.POST(request('signup',{locale:'fr',email:'client@example.test',password:'a-secure-password',display_name:'Client',next:'/fr/account'}),{params:{action:'signup'}});
  assert.equal(confirmation.status,200);
  assert.deepEqual(await confirmation.json(),{ok:true,confirmationRequired:true});

  signup={data:{user:{id:userId,email_confirmed_at:'2026-01-01'},session:{access_token:'hidden'}},error:null};
  cookieJar.set('mdl_guest','a'.repeat(43));
  const immediate=await route.POST(request('signup',{locale:'ar',email:'client@example.test',password:'a-secure-password',display_name:'عميل',next:'/ar/cities/casablanca/estimate?resume=1'}),{params:{action:'signup'}});
  assert.equal(immediate.status,200);
  assert.equal((await immediate.json()).redirect,'/ar/cities/casablanca/estimate?resume=1');
  assert.ok(queries.some(item=>item.sql.includes('phase_c_claim_guest')&&item.values[1]===userId));
});

test('signup validation rejects weak input before calling the provider',async()=>{
  const response=await route.POST(request('signup',{locale:'fr',email:'not-an-email',password:'short',display_name:'Client'}),{params:{action:'signup'}});
  assert.equal(response.status,400);assert.equal((await response.json()).code,'INVALID_REQUEST');
});

test('login rejects invalid credentials and a valid session claims only its guest estimate',async()=>{
  const invalid=await route.POST(request('login',{locale:'fr',email:'client@example.test',password:'wrong',next:'/fr/account'}),{params:{action:'login'}});
  assert.equal(invalid.status,401);assert.equal((await invalid.json()).code,'INVALID_CREDENTIALS');
  login={data:{user:{id:userId,email_confirmed_at:'2026-01-01'},session:{}},error:null};cookieJar.set('mdl_guest','b'.repeat(43));
  const valid=await route.POST(request('login',{locale:'fr',email:'client@example.test',password:'correct',next:'/fr/account'}),{params:{action:'login'}});
  assert.equal(valid.status,200);assert.equal((await valid.json()).redirect,'/fr/account');
  assert.ok(queries.some(item=>item.sql.includes('phase_c_claim_guest')&&item.values[1]===userId));
});

test('post-auth routing defaults to account and preserves only safe internal destinations',async()=>{
  login={data:{user:{id:userId,email_confirmed_at:'2026-01-01'},session:{}},error:null};
  const generic=await route.POST(request('login',{locale:'fr',email:'client@example.test',password:'correct'}),{params:{action:'login'}});
  assert.equal((await generic.json()).redirect,'/fr/account');
  const deepLink=await route.POST(request('login',{locale:'fr',email:'client@example.test',password:'correct',next:'/fr/account/estimations'}),{params:{action:'login'}});
  assert.equal((await deepLink.json()).redirect,'/fr/account/estimations');
  const resume=await route.POST(request('login',{locale:'fr',email:'client@example.test',password:'correct',next:'/fr/cities/casablanca/estimate?resume=1'}),{params:{action:'login'}});
  assert.equal((await resume.json()).redirect,'/fr/cities/casablanca/estimate?resume=1');
  const rejected=await route.POST(request('login',{locale:'fr',email:'client@example.test',password:'correct',next:'https://evil.example/account'}),{params:{action:'login'}});
  assert.equal((await rejected.json()).redirect,'/fr/account');
});

test('customer logout is local to the customer provider session',async()=>{
  current={id:userId,email_confirmed_at:'2026-01-01'};
  const response=await route.POST(request('logout',{locale:'fr'}),{params:{action:'logout'}});
  assert.equal(response.status,200);assert.equal(signedOut,true);assert.equal((await response.json()).redirect,'/fr');
});

test('authenticated public navigation receives the customer menu identity',async()=>{
  current={id:userId,email:'client@example.test',email_confirmed_at:'2026-01-01'};
  const response=await route.GET(new NextRequest('http://localhost:3000/api/auth/session'),{params:{action:'session'}});
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{authenticated:true,displayName:'Client',email:'client@example.test'});
});

test('password recovery stays enumeration-safe and account data rejects anonymous callers',async()=>{
  const recovery=await route.POST(request('forgot-password',{locale:'ar',email:'unknown@example.test'}),{params:{action:'forgot-password'}});
  assert.equal(recovery.status,200);assert.deepEqual(await recovery.json(),{ok:true});
  const account=await accountRoute.GET(new NextRequest('http://localhost:3000/api/account?page=1'));
  assert.equal(account.status,401);assert.equal((await account.json()).code,'AUTH_REQUIRED');
});
