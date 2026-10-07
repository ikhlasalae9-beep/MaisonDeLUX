import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { invokeInference } from '../../lib/estimations/gateway';
import { getCityBySlug } from '../../lib/cities/registry';
import type { CasablancaPredictPayload } from '../../lib/api/types';

test('signed gateway verifies city identity and uses Marrakech identity and rejects disabled city before transport', async () => {
  const originalFetch=globalThis.fetch, originalSecret=process.env.INFERENCE_GATEWAY_SECRET;
  const secret='gateway-test-secret'.repeat(3);
  process.env.INFERENCE_GATEWAY_SECRET=secret;
  const input: CasablancaPredictPayload={city:'Casablanca',property_type:'appartement',neighborhood:'Maârif',area:100,rooms:3,bedrooms:2,bathrooms:2,floor:4,current_state:null,age:null};
  const valid={city:'Casablanca',model_id:'casablanca-catboost-alae',model_version:'casablanca-catboost-v1',estimated_price_mad:1217911};
  let response:any=valid, calls=0;
  globalThis.fetch=async (_url, options) => {
    calls++;
    const headers=options!.headers as Record<string,string>;
    assert.equal(headers['X-MDL-Signature'],createHmac('sha256',secret).update(`${headers['X-MDL-Timestamp']}\n/api/ml/estimate\n${options!.body}`).digest('hex'));
    assert.equal(options!.redirect,'error');
    assert.equal(options!.cache,'no-store');
    return Response.json(response);
  };
  try {
    assert.deepEqual(await invokeInference('estimate',input),valid);
    for (const patch of [{city:'Marrakech'},{model_id:'marrakech-stacking-alae'},{model_version:'marrakech-stacking-v1'},{estimated_price_mad:0}]) {
      response={...valid,...patch};
      await assert.rejects(invokeInference('estimate',input),/INVALID_MODEL_RESULT/);
    }
    const m={city:'Marrakech' as const,property_type:'appartement',neighborhood:'Route de Casablanca',area:100,rooms:3,bedrooms:2,bathrooms:1,current_state:'bon état',age:'5-10 ans'};
    response={city:'Marrakech',model_id:'marrakech-stacking-alae',model_version:'marrakech-stacking-v1',estimated_price_mad:1468447};
    assert.deepEqual(await invokeInference('estimate',m),response);
    response=valid; await assert.rejects(invokeInference('estimate',m),/INVALID_MODEL_RESULT/);
    const city=getCityBySlug('marrakech')!;
    city.estimation.publicEnabled=false;
    const before=calls;
    await assert.rejects(invokeInference('estimate',{city:'Marrakech',property_type:'appartement',neighborhood:'Guéliz',area:100,rooms:3,bedrooms:2,bathrooms:1,current_state:'bon état',age:'5-10 ans'}),/CITY_NOT_PUBLIC/);
    assert.equal(calls,before);
    city.estimation.publicEnabled=true;
  } finally {
    getCityBySlug('marrakech')!.estimation.publicEnabled=true;
    globalThis.fetch=originalFetch;
    if(originalSecret===undefined) delete process.env.INFERENCE_GATEWAY_SECRET; else process.env.INFERENCE_GATEWAY_SECRET=originalSecret;
  }
});
