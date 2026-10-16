import React from 'react';
(globalThis as any).React = React;
import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { NextRequest } from 'next/server';
import { renderToStaticMarkup } from 'react-dom/server';
import { GET as modelDetails } from '../../app/api/admin/model/route';
import { createSessionToken } from '../../lib/admin/auth';
import { setDatabasePoolForTests } from '../../lib/admin/db';
import { ModelDetail } from '../../components/admin/AdminDashboard';
import { modelRegistry } from '../../lib/admin/model';

const environment = {...process.env};
let db: PGlite;
test.before(async()=>{
  process.env.POSTGRES_URL='postgresql://test:local@localhost/test';
  process.env.ADMIN_EMAIL='admin@example.test';
  process.env.ADMIN_SESSION_SECRET='test-only-admin-session-secret-32-characters';
  db=new PGlite();
  await db.exec(`
    CREATE TABLE cities(id bigint PRIMARY KEY,slug text,name text,region text,public_enabled boolean,created_at timestamptz DEFAULT now());
    CREATE TABLE model_versions(id bigint PRIMARY KEY,city_id bigint REFERENCES cities(id),version text,architecture text,artifact_path text,model_identity text,status text,public_inference_enabled boolean,metrics jsonb,trained_at timestamptz,created_at timestamptz DEFAULT now());
    CREATE TABLE estimation_events(id bigint PRIMARY KEY,event_key text,city_id bigint,model_version_id bigint,input_features jsonb,estimated_price_mad numeric,is_test boolean,created_at timestamptz DEFAULT now());
    CREATE TABLE estimation_passports(estimation_event_id bigint PRIMARY KEY,prediction jsonb);
    INSERT INTO cities(id,slug,name,public_enabled) VALUES(1,'casablanca','Casablanca',true),(3,'marrakech','Marrakech',true),(4,'rabat','Rabat',true);
    INSERT INTO model_versions(id,city_id,version,architecture,artifact_path,model_identity,status,public_inference_enabled,metrics) VALUES
      (1,1,'casablanca-catboost-v1','CatBoostRegressor','models/casablanca/v1/model.pkl','casablanca-catboost','registered',true,'{"r2_test":0.8}'),
      (2,3,'marrakech-stacking-v1','StackingRegressor','models/marrakech/v1/model.pkl','marrakech-stacking','registered',true,'{}'),
      (3,4,'rabat-random-forest-v1','RandomForestRegressor','models/rabat/v1/model.joblib','rabat-random-forest','registered',true,'{"r2_test":0.9521408362032084,"mae_test_mad":673900,"training_diagnostics":{"scope":"training_set_resubstitution","independent_test":false,"sample_count":700,"source":"docs/rabat-model-audit.md","r2_mad":0.9521408362,"mae_mad":673900.58,"rmse_mad":1546508.58,"median_ape_percent":5.59955208}}');
  `);
  setDatabasePoolForTests({query:async(sql:string,values:unknown[]=[])=>{
    assert.match(sql.trim(),/^SELECT\b/i);
    return await db.query(sql,values) as any;
  }});
});
test.after(async()=>{setDatabasePoolForTests(null);await db.close();process.env=environment;});

async function read(cityId:string,modelId?:string){
  const token=await createSessionToken('admin@example.test');
  const response=await modelDetails(new NextRequest(`http://localhost/api/admin/model?cityId=${cityId}${modelId?'&modelId='+modelId:''}`,{headers:{cookie:`maisondelux_admin=${token}`}}));
  assert.equal(response.status,200);
  assert.match(response.headers.get('cache-control')!,/private.*no-store/);
  return response.json();
}
const render=(model:any)=>renderToStaticMarkup(React.createElement(ModelDetail,{model,models:[model],onBack(){},onCity(){},onEstimates(){}}));

test('protected model API maps the real Rabat row through manifests into the existing model detail',async()=>{
  assert.equal((await modelDetails(new NextRequest('http://localhost/api/admin/model?cityId=4'))).status,401);
  const first=await read('4','3');
  const refreshed=await read('4','3');
  assert.equal(first.models.length,1);
  const model=refreshed.models[0];
  assert.deepEqual(model,first.models[0]);
  assert.equal(model.artifact_registered,true);
  assert.equal(model.artifact_path,'models/rabat/v1/model.joblib');
  assert.equal(model.model_identity,'rabat-random-forest');
  assert.equal(model.public_inference_enabled,true);
  assert.equal(model.status,'registered');
  assert.equal(model.trained_at,null);
  assert.equal(model.deployment_status,'unverified');
  assert.equal(model.integrity.artifact,true);
  assert.equal(model.integrity.preprocessing,true);
  assert.deepEqual(model.logical_inputs,['Type','Localisation','Area','Rooms','Bedrooms','Bathrooms','Current_state','Age']);
  assert.deepEqual(model.documented_metadata.fitted_property_types,['appartement','bureau','maison','studio','villa']);
  assert.deepEqual(model.supported_property_types,model.documented_metadata.fitted_property_types);
  const html=render(model);
  assert.match(html,/models\/rabat\/v1\/model.joblib/);
  assert.match(html,/RandomForestRegressor · 500 arbres/);
  assert.match(html,/Types ajustés \(pipeline\)/);
  assert.match(html,/Types acceptés par le formulaire public/);
  assert.equal((html.match(/<code\b/g)||[]).length,8);
  assert.doesNotMatch(html,/0\.9521408362032084|673900|Types de biens<\/dt>.*?Non documentés/);
  assert.match(html,/Aucune mesure indépendante de test documentée/);
  assert.match(html,/Non vérifié/);
  assert.match(html,/Diagnostics sur données d&#x27;entraînement/);
  assert.match(html,/700 observations/);
  assert.match(html,/0,9521408362/);
  assert.match(html,/673[\s\u202f\u00a0]900,58 MAD/);
  assert.match(html,/1[\s\u202f\u00a0]546[\s\u202f\u00a0]508,58 MAD/);
  assert.match(html,/5,59955208 %/);
  assert.match(html,/docs\/rabat-model-audit.md/);
  const independent=html.split('<section aria-label="Diagnostics')[0];
  assert.doesNotMatch(independent,/0,9521408362|673[\s\u202f\u00a0]900,58/);
  const changed=render({...model,metrics:{...model.metrics,training_diagnostics:{...model.metrics.training_diagnostics,r2_mad:0.25,sample_count:17}}});
  assert.match(changed,/0,25/);assert.match(changed,/17 observations/);assert.doesNotMatch(changed,/0,9521408362/);
  const absent=render({...model,metrics:{}});
  assert.match(absent,/Diagnostics d’entraînement indisponibles/);assert.doesNotMatch(absent,/5,59955208/);
});

test('Casablanca and Marrakech retain their own mapping, performance policy and rendered details',async()=>{
  for(const [city,id,version] of [['1','1','casablanca-catboost-v1'],['3','2','marrakech-stacking-v1']]){
    const {models}=await read(city,id);
    assert.equal(models.length,1);
    const model=models[0];
    const entry=(modelRegistry as any)[version];
    assert.equal(model.version,version);
    assert.deepEqual(model.logical_inputs,entry.logicalInputs);
    assert.deepEqual(model.documented_metadata,entry.metadata);
    assert.deepEqual(model.supported_property_types,entry.supportedPropertyTypes);
    const html=render(model);
    assert.ok(html.includes(entry.metadata.artifact));
    assert.equal((html.match(/<code\b/g)||[]).length,entry.logicalInputs.length);
    assert.doesNotMatch(html,/rabat-random-forest|Types ajustés \(pipeline\)|Diagnostics sur données/);
    assert.match(html,/R² test/);
  }
  assert.deepEqual((await read('4','2')).models,[],'a mismatched city/model must never display another city model');
});
