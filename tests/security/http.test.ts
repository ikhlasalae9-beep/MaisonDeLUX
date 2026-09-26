import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { sameOrigin,jsonBody,errorResponse } from '../../lib/security/http';

test('write boundaries reject cross-origin requests and oversized/unexpected JSON',async()=>{
  process.env.SITE_URL='http://localhost:3000';
  const request=(body:string,headers:Record<string,string>={})=>new NextRequest('http://localhost:3000/api/estimations',{method:'POST',body,headers:{'content-type':'application/json',origin:'http://localhost:3000',...headers}});
  assert.doesNotThrow(()=>sameOrigin(request('{}')));
  assert.throws(()=>sameOrigin(request('{}',{origin:'https://evil.test'})));
  assert.throws(()=>sameOrigin(request('{}',{'sec-fetch-site':'cross-site'})));
  assert.deepEqual(await jsonBody(request('{"input":1}'),['input']),{input:1});
  await assert.rejects(jsonBody(request('{"user_id":"attacker"}'),['input']));
  await assert.rejects(jsonBody(request('[]'),['input']));
  await assert.rejects(jsonBody(request(JSON.stringify({input:'x'.repeat(17000)})),['input']));
  const response=errorResponse(new Error('postgres://private:secret@host SQL filesystem-path'));
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{code:'SERVICE_UNAVAILABLE'});
  assert.match(response.headers.get('cache-control')!,/no-store/);
});
