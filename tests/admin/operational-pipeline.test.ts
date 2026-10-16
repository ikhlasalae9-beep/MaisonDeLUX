import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server';
import { securityDatabase, userA } from '../security/database';
import { setDatabasePoolForTests } from '../../lib/admin/db';
import { currentAdminData, readAdminJson, readAdminSnapshot } from '../../lib/admin/client-data';
import { predictCasablanca } from '../../lib/api/client';
import { estimatorFormInput } from '../../lib/estimations/form-input';
import { createPassportExportData } from '../../lib/account/passport-export';

(globalThis as any).React = React;
const original = { ...process.env }, originalFetch = globalThis.fetch;
const jar = new Map<string, string>();
let identity: { id: string } | null = { id: userA };
// Only framework/auth adapters and the HTTP transport are replaced. SQL, RPCs,
// gateway signing/verification, actual CPU inference, API handlers and UI renderers run unchanged.
function replace(module: string, exports: any) { const id = require.resolve(module); require.cache[id] = { id, filename: id, loaded: true, exports } as any; }
replace('next/headers', { cookies: () => ({ get: (key: string) => jar.has(key) ? { value: jar.get(key) } : undefined,
  set: (key: string, value: string) => jar.set(key, value), getAll: () => [] }) });
replace('../../lib/auth/server', { currentUser: async () => identity });
const main = require('../../app/api/estimations/route');
const overview = require('../../app/api/admin/overview/route');
const events = require('../../app/api/admin/estimations/route');
const users = require('../../app/api/admin/users-security/route');
const models = require('../../app/api/admin/model/route');
const report = require('../../app/api/admin/report/route');
const login = require('../../app/api/admin/login/route');
const { Overview, Estimations } = require('../../components/admin/AdminDashboard');
const { getProductionInputFeatures } = require('../../lib/admin/analytics');

let db: Awaited<ReturnType<typeof securityDatabase>>, failed = false, adminCookie = '', inferenceCalls = 0, readCalls = 0, inferenceUnavailable = false;
const cpuPredictions = new Map<string, any>();
const input = { city: 'Casablanca' as const, property_type: 'appartement', neighborhood: 'Maârif', area: 100,
  rooms: 3, bedrooms: 2, bathrooms: 2, floor: 4, current_state: 'Bon état', age: '10-20 ans' };

test.before(async () => {
  process.env.POSTGRES_URL = 'postgresql://isolated:fixture@localhost/isolated';
  process.env.SITE_URL = 'http://localhost:3000';
  process.env.ML_BACKEND_URL = 'http://inference.fixture';
  process.env.GUEST_TRIAL_HMAC_SECRET = 'test-only-guest-secret-with-at-least-32-characters';
  process.env.INFERENCE_GATEWAY_SECRET = 'test-only-inference-secret-with-at-least-32-characters';
  process.env.ADMIN_EMAIL = 'admin@example.test'; process.env.ADMIN_PASSWORD = 'isolated-test-password';
  process.env.ADMIN_SESSION_SECRET = 'test-only-admin-secret-with-at-least-32-characters';
  db = await securityDatabase();
  for (const migration of ['005_phase_c_entitlements','006_prepared_city_inference','007_public_marrakech_activation']) {
    let sql = readFileSync(`supabase/migrations/${migration}.sql`, 'utf8');
    if (migration === '006_prepared_city_inference') sql=sql.replace("('Marrakech','marrakech-stacking-v1','marrakech-stacking-alae'))", "('Marrakech','marrakech-stacking-v1','marrakech-stacking-alae'),('Rabat','rabat-random-forest-v1','rabat-random-forest'))").replace("expected_city='Marrakech'", "expected_city IN ('Marrakech','Rabat')");
    await db.exec(sql); // Existing writer in an isolated fixture; do not run the new manual SQL files.
  }
  // Add the actual production read columns missing from this minimal security fixture only.
  await db.exec(`ALTER TABLE model_versions ADD COLUMN metrics jsonb, ADD COLUMN trained_at timestamptz, ADD COLUMN created_at timestamptz DEFAULT now();
    ALTER TABLE auth.users ADD COLUMN created_at timestamptz DEFAULT now();
    INSERT INTO cities(slug,name,public_enabled) VALUES ('rabat','Rabat',true);
    INSERT INTO model_versions(city_id,version,model_identity,architecture,artifact_path,status,public_inference_enabled) SELECT id,'rabat-random-forest-v1','rabat-random-forest','RandomForestRegressor','models/rabat/v1/model.joblib','registered',true FROM cities WHERE slug='rabat';`);
  setDatabasePoolForTests({ query: async (sql: string, values: unknown[] = []) => {
    if (failed) throw new Error('ISOLATED_DATABASE_FAILURE postgresql://fixture:must-not-leak@invalid/db');
    return await db.query(sql, values) as any;
  } });
  const session = await login.POST(new NextRequest('http://localhost:3000/api/admin/login', { method: 'POST',
    headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) }));
  assert.equal(session.status, 200); adminCookie = session.headers.get('set-cookie')!.split(';')[0];
  globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
    const address = String(url);
    if (address.startsWith('http://inference.fixture/')) {
      inferenceCalls++;
      if(inferenceUnavailable)return Response.json({error:'INFERENCE_UNAVAILABLE'},{status:503});
      const headers = new Headers(options?.headers), timestamp = headers.get('X-MDL-Timestamp')!;
      assert.equal(headers.get('X-MDL-Signature'), createHmac('sha256', process.env.INFERENCE_GATEWAY_SECRET!)
        .update(`${timestamp}\n/api/ml/estimate\n${options!.body}`).digest('hex'));
      const body = String(options!.body);
      if (!cpuPredictions.has(body)) {
        const result = spawnSync(process.env.MDL_TEST_PYTHON || 'python', ['-B', '-X', 'utf8', '-c',
          'import json,sys; from backend.inference import service; print(json.dumps(service.estimate(json.load(sys.stdin))))'],
        { input: body, encoding: 'utf8', timeout: 60000 });
        if (result.status !== 0) return Response.json({ error: 'INFERENCE_UNAVAILABLE' }, { status: 503 });
        cpuPredictions.set(body, JSON.parse(result.stdout));
      }
      return Response.json(cpuPredictions.get(body));
    }
    if (address === '/api/estimations') return main.POST(new NextRequest('http://localhost:3000'+address, {
      ...options, signal: options?.signal ?? undefined, headers: { ...Object.fromEntries(new Headers(options?.headers)), origin: 'http://localhost:3000' } }));
    if (address.startsWith('/api/admin/')) {
      readCalls++; assert.equal(options?.cache, 'no-store');
      const request = new NextRequest('http://localhost:3000'+address, { headers: { cookie: adminCookie } });
      return address.startsWith('/api/admin/overview?') ? overview.GET(request) : events.GET(request);
    }
    throw new Error('Unexpected external network request in isolated test');
  }) as typeof fetch;
});
test.after(async () => { globalThis.fetch = originalFetch; setDatabasePoolForTests(null); await db.close(); process.env = original; });
const cityId = async (slug: string) => String((await db.query<any>('SELECT id FROM cities WHERE slug=$1', [slug])).rows[0].id);
const snapshot = async (slug: string) => readAdminSnapshot({ period: 'all', cityId: await cityId(slug), modelId: '', includeTests: false, page: 1, search: '' }, new AbortController().signal);
const request = (path: string) => new NextRequest('http://localhost:3000/api/admin/'+path, { headers: { cookie: adminCookie } });

test('A/E/F: real website client → signed gateway → CPU inference → transactional RPC → Admin API → existing React UI, refreshed once', async () => {
  const before = await snapshot('casablanca'); assert.equal(before.overview.kpis.total, 0);
  const requestId = randomUUID();
  const prediction = await predictCasablanca(input, { requestId, locale: 'ar' });
  assert.equal(prediction.estimated_price_mad, 1217911); assert.equal(inferenceCalls, 1);
  const stored = (await db.query<any>(`SELECT e.*,c.slug,m.version,p.prediction FROM estimation_events e
    JOIN cities c ON c.id=e.city_id JOIN model_versions m ON m.id=e.model_version_id AND m.city_id=e.city_id
    JOIN estimation_passports p ON p.estimation_event_id=e.id WHERE e.event_key=$1`, [requestId])).rows[0];
  assert.equal(stored.slug, 'casablanca'); assert.equal(stored.version, 'casablanca-catboost-v1');
  assert.equal(stored.locale, 'ar'); assert.equal(Number(stored.estimated_price_mad), prediction.estimated_price_mad);
  const after = await snapshot('casablanca');
  assert.equal(after.overview.kpis.total, 1); assert.equal(after.estimations.total, 1);
  assert.equal(after.overview.kpis.saved_results, 1); assert.equal(after.estimations.rows[0].has_saved_result, true);
  assert.equal(after.overview.activity.reduce((sum: number, row: any) => sum + row.count, 0), 1);
  assert.equal(String(after.overview.recent[0].id), String(prediction.estimation_event_id));
  assert.ok(Date.parse(after.overview.readAt) >= Date.parse(before.overview.readAt));
  assert.equal(readCalls, 4, 'One explicit snapshot refresh repeats both real API reads');
  const html = renderToStaticMarkup(React.createElement(Overview, { data: after.overview, period: 'all', cityId: stored.city_id, onCity() {}, onModel() {}, onEstimates() {} }));
  const table = renderToStaticMarkup(React.createElement(Estimations, { data: after.overview, rows: after.estimations, search: '', page: 1, includeTests: false }));
  assert.match(html, /Casablanca/); assert.doesNotMatch(html, /Aucune activité récente/);
  assert.ok(table.includes('casablanca-catboost-v1')); assert.ok(table.includes('1 217 911'));
  assert.equal((await predictCasablanca(input, { requestId, locale: 'ar' })).estimation_event_id, prediction.estimation_event_id);
  assert.equal(inferenceCalls, 1, 'Idempotent replay does not infer or persist again');
});

test('B/E/F: real Marrakech CPU output is persisted through the public client and appears only in its refreshed Admin views', async () => {
  const before = await snapshot('marrakech'); assert.equal(before.overview.kpis.total, 0);
  const prediction = await predictCasablanca({ city: 'Marrakech', property_type: 'appartement', neighborhood: 'Guéliz', area: 100,
    rooms: 3, bedrooms: 2, bathrooms: 1, current_state: 'bon état', age: '5-10 ans' }, { requestId: randomUUID(), locale: 'fr' });
  assert.ok(Math.abs(Number((prediction as any).raw_price_mad) - 1468447.422627404) <= 1e-6);
  const after = await snapshot('marrakech');
  assert.equal(after.overview.kpis.total, 1); assert.equal(after.overview.kpis.saved_results, 1);
  assert.equal(after.overview.activity.reduce((sum: number, row: any) => sum + row.count, 0), 1);
  assert.equal(after.estimations.rows[0].city, 'Marrakech');
  assert.equal(after.estimations.rows[0].model_version, 'marrakech-stacking-v1');
  assert.equal(after.estimations.rows[0].has_saved_result, true);
  assert.equal(String(after.estimations.rows[0].id), String(prediction.estimation_event_id));
  assert.equal(after.overview.platform.recorded_estimations, 2);
  const html = renderToStaticMarkup(React.createElement(Overview, { data: after.overview, period: 'all', onCity() {}, onModel() {}, onEstimates() {} }));
  const table = renderToStaticMarkup(React.createElement(Estimations, { data: after.overview, rows: after.estimations, search: '', page: 1, includeTests: false }));
  assert.match(html, /Marrakech/); assert.doesNotMatch(html, /casablanca-catboost-v1/);
  assert.match(table, /Résultat sauvegardé/); assert.match(table, /marrakech-stacking-v1/);
});

test('B/C: city FK isolation and a genuinely empty city are preserved independently of Market listings', async () => {
  for (const slug of ['marrakech', 'rabat']) {
    const data = await snapshot(slug), expected = slug === 'marrakech' ? 1 : 0;
    assert.equal(data.overview.kpis.total, expected); assert.equal(data.estimations.total, expected);
    const html = renderToStaticMarkup(React.createElement(Overview, { data: data.overview, period: 'all', onCity() {}, onModel() {}, onEstimates() {} }));
    if (!expected) {
      assert.equal(data.overview.activity.length, 0); assert.equal(data.overview.recent.length, 0);
      assert.match(html, /Aucune activité récente/); assert.match(html, /Aucune estimation sur cette période/);
    }
  }
  await db.query("UPDATE cities SET name='Changed display name' WHERE slug='casablanca'");
  assert.equal((await getProductionInputFeatures('Casablanca', 'casablanca-catboost-v1')).length, 1, 'Monitoring uses slug/FK, not mutable city name');
  await db.query("UPDATE cities SET name='Casablanca' WHERE slug='casablanca'");
});

test('Users: actual auth.users changes and existing signup trigger are reflected by the protected global API', async () => {
  const before = await (await users.GET(request('users-security'))).json(); assert.equal(before.total, 2);
  await db.query('INSERT INTO auth.users(id,raw_user_meta_data) VALUES ($1,$2)', [randomUUID(), {}]);
  const after = await (await users.GET(request('users-security'))).json();
  assert.equal(after.total, 3); assert.equal(after.roles.find((row: any) => row.role === 'user').count, 3);
  assert.equal(after.signups.length, 3); assert.ok(after.events.some((row: any) => row.event_type === 'signup_completed'));
  assert.ok(after.signups.every((row: any) => Object.keys(row).join() === 'created_at'), 'No account identity or email returned');
});

test('D: database failure produces errors and hides previous KPIs; it never becomes a zero-valued dashboard', async t => {
  const previous = await snapshot('casablanca');
  const logged: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { logged.push(args); }); failed = true;
  try {
    for (const route of [overview, events, models, users, report]) {
      const response = await route.GET(request('overview?period=all'));
      assert.ok(response.status >= 500); const body = await response.json();
      assert.equal(body.kpis, undefined); assert.equal(body.total, undefined);
      assert.ok(!JSON.stringify(body).includes('ISOLATED_DATABASE_FAILURE'));
    }
    await assert.rejects(snapshot('casablanca'));
    assert.equal(currentAdminData({ ...previous.overview, scopeKey: 'same' }, 'same', 'Failed refresh'), null);
    assert.equal(currentAdminData({ configured: false, scopeKey: 'same' }, 'same', ''), null);
    assert.equal(currentAdminData({ ...previous.overview, scopeKey: 'old-city' }, 'new-city', ''), null);
    assert.ok(!JSON.stringify(logged).includes('must-not-leak'));
    assert.match(JSON.stringify(logged), /REDACTED_POSTGRES_URL/);
  } finally { failed = false; }
});

test('An unconfigured database is unavailable, while only a successfully queried empty source returns zero', async () => {
  const configured = process.env.POSTGRES_URL;
  delete process.env.POSTGRES_URL;
  try {
    for (const route of [overview, events, models, report]) {
      const response = await route.GET(request('overview?period=all'));
      assert.equal(response.status, 503); const body = await response.json();
      assert.equal(body.total, undefined); assert.equal(body.kpis, undefined);
    }
    await assert.rejects(snapshot('casablanca'));
  } finally { process.env.POSTGRES_URL = configured; }
});

test('A malformed successful HTTP response is unavailable rather than zero-filled', async () => {
  const transport = (async () => Response.json({ configured: true, kpis: {}, platform: {}, total: 0, rows: [] })) as typeof fetch;
  await assert.rejects(readAdminSnapshot({ period: 'all', cityId: '', modelId: '', includeTests: false, page: 1, search: '' }, new AbortController().signal, transport), /ADMIN_INVALID_SNAPSHOT/);
});

test('Hung reads have a finite deadline and caller cancellation still cancels the underlying request', async () => {
  const transport = ((_url: unknown, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    options!.signal!.addEventListener('abort', () => reject(new Error('ABORTED')), { once: true });
  })) as typeof fetch;
  await assert.rejects(readAdminJson('/api/admin/overview', new AbortController().signal, transport, 10), /ADMIN_READ_TIMEOUT/);
  const controller = new AbortController();
  const pending = readAdminJson('/api/admin/overview', controller.signal, transport);
  controller.abort(); await assert.rejects(pending, /ABORTED/);
});

test('Failed inference creates no successful-estimation event and does not invent an attempt/failure counter', async t => {
  identity = null; t.mock.method(console, 'error', () => {});
  const before = await snapshot('marrakech');
  // Simulate unavailable transport, independently of any release checksum issue.
  inferenceUnavailable = true;
  await assert.rejects(predictCasablanca({ city: 'Marrakech', property_type: 'appartement', neighborhood: 'Guéliz', area: 100,
    rooms: 3, bedrooms: 2, bathrooms: 1, current_state: 'bon état', age: '5-10 ans' }, { requestId: randomUUID() }));
  inferenceUnavailable = false;
  const after = await snapshot('marrakech');
  assert.equal(after.overview.kpis.total, before.overview.kpis.total);
  assert.equal((await db.query('SELECT * FROM estimation_events WHERE city_id=$1', [await cityId('marrakech')])).rows.length, before.overview.kpis.total);
  assert.equal((await db.query<any>('SELECT trial_consumed_at,reserved_until FROM guest_trials')).rows[0].trial_consumed_at, null);
});


test('Rabat: real form payload → public API → signed Python HTTP → frozen RF → public RPC → Admin; guest/auth/replay and pending database', async t => {
  identity={id:userA};
  const form={property_type:'appartement',neighborhood:'Agdal',area:'110',rooms:'3',bedrooms:'2',bathrooms:'1',current_state:'5-10 ans',age:'ignored',floor:''};
  const input=estimatorFormInput('Rabat',form);
  assert.equal(input.age,7.5); assert.ok(!('floor' in input));
  const transport=globalThis.fetch;
  globalThis.fetch=(async (url: string | URL | Request, options?:RequestInit)=>{
    if(String(url).startsWith('http://inference.fixture/')) {
      inferenceCalls++;
      const processResult=spawnSync(process.env.MDL_TEST_PYTHON||'python',['-B','-X','utf8','-c',
        "import json,sys; from backend.app import app; r=json.load(sys.stdin); response=app.test_client().post('/api/ml/estimate',data=r['body'],headers=r['headers']); assert response.status_code==200,response.get_json(); print(json.dumps(response.get_json()))"],
        {input:JSON.stringify({body:options!.body,headers:Object.fromEntries(new Headers(options?.headers))}),encoding:'utf8',timeout:60000});
      if(processResult.status!==0)throw new Error(processResult.stderr);
      return Response.json(JSON.parse(processResult.stdout));
    }
    return transport(url,options);
  }) as typeof fetch;
  try {
    const before=await snapshot('rabat'); assert.equal(before.overview.kpis.total,0);
    for(const locale of ['fr','ar']) {
      const requestId=randomUUID(),prediction=await predictCasablanca(input,{requestId,locale});
      assert.equal(prediction.city,'Rabat');assert.equal(prediction.model_version,'rabat-random-forest-v1');assert.equal(prediction.estimated_price_mad,1885593);
      const calls=inferenceCalls;
      assert.equal((await predictCasablanca(input,{requestId,locale})).estimation_event_id,prediction.estimation_event_id);
      assert.equal(inferenceCalls,calls,'Owned replay must not call inference again');
      const stored=(await db.query<any>('SELECT e.*,p.prediction FROM estimation_events e JOIN estimation_passports p ON p.estimation_event_id=e.id WHERE e.event_key=$1',[requestId])).rows[0];
      assert.equal(stored.locale,locale);assert.equal(stored.user_id,userA);assert.deepEqual(stored.input_features,input);
      assert.equal(stored.prediction.raw_price_mad,1885593.2799045164);
      const exported=createPassportExportData(stored,locale);assert.equal(exported.city,locale==='ar'?'الرباط':'Rabat');assert.equal(exported.market,null);assert.deepEqual(exported.comparables,[]);
    }
    identity=null;
    const guest=await predictCasablanca(input,{requestId:randomUUID(),locale:'fr'});assert.equal(guest.guest,true);
    await assert.rejects(predictCasablanca(input,{requestId:randomUUID()}));
    const after=await snapshot('rabat');assert.equal(after.overview.kpis.total,3);assert.equal(after.overview.kpis.saved_results,3);
    assert.ok(after.overview.recent.every((row:any)=>row.city==='Rabat'));
    assert.equal(after.overview.models[0].artifact_registered,true);assert.equal(after.overview.models[0].integrity.artifact,true);
    assert.equal((await snapshot('casablanca')).overview.kpis.total,1);assert.equal((await snapshot('marrakech')).overview.kpis.total,1);
    // Database not manually activated: actual main route must not return an unpersisted success.
    identity={id:userA};await db.query("UPDATE model_versions SET public_inference_enabled=false WHERE version='rabat-random-forest-v1'");
    const logged=t.mock.method(console,'error',()=>{});
    await assert.rejects(predictCasablanca(input,{requestId:randomUUID()}));
    assert.equal((await snapshot('rabat')).overview.kpis.total,3);
    logged.mock.restore();
  } finally {globalThis.fetch=transport;identity={id:userA};}
});
