// Read-only live check of the process actually serving Admin; no SQL or inference submissions.
// Run: node scripts/verify-admin-model-details.cjs [http://localhost:3000]
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const json = file => JSON.parse(readFileSync(file, 'utf8'));

(async () => {
  const base = new URL(process.argv[2] || 'http://localhost:3000');
  assert.ok(['http:', 'https:'].includes(base.protocol), 'HTTP origin required');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'This check is restricted to the local Admin; credentials cannot be sent to another host');
  const login = await fetch(new URL('/api/admin/login', base), {
    method: 'POST', headers: { 'Content-Type': 'application/json', origin: base.origin },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
    redirect: 'error', signal: AbortSignal.timeout(20000),
  });
  assert.equal(login.status, 200, 'Normal Admin sign-in failed');
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie, 'Admin session missing');
  const response = await fetch(new URL('/api/admin/model', base), {
    headers: { cookie }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200, 'Model API unavailable');
  assert.match(response.headers.get('cache-control') || '', /private.*no-store/);
  const data = await response.json();
  const checks = [];
  for (const city of ['casablanca', 'marrakech', 'rabat']) {
    const metadata = json(`models/${city}/v1/metadata.json`);
    const preprocessing = json(`models/${city}/v1/preprocessing.json`);
    const model = data.models.find(row => row.version === metadata.model_version && row.city_slug === city);
    assert.ok(model, `${city}: missing registered model`);
    assert.equal(model.artifact_registered, true, `${city}: stale or missing documentary mapping; restart the serving process after building`);
    assert.equal(model.documented_metadata?.artifact, metadata.artifact, `${city}: missing verified artifact`);
    assert.deepEqual(model.logical_inputs, preprocessing.required_prepared_fields || preprocessing.logical_inputs, `${city}: incorrect fitted input mapping`);
    assert.ok(model.supported_property_types?.length, `${city}: missing supported categories`);
    if (city === 'rabat') {
      assert.equal(model.artifact_path, metadata.artifact, 'Rabat: database artifact missing or mismatched');
      assert.equal(model.documented_metadata.architecture, metadata.algorithm);
      assert.equal(model.documented_metadata.independent_test_metrics, null);
      assert.deepEqual(model.documented_metadata.fitted_property_types, preprocessing.categorical.Type);
      assert.equal(model.integrity?.artifact, true);
      assert.equal(model.integrity?.preprocessing, true);
      assert.equal(model.trained_at, null, 'Unexpected training date: review evidence before claiming it');
      assert.equal(model.deployment_status, 'unverified', 'Deployment availability requires separate evidence');
    }
    checks.push({ city, version: model.version, inputs: model.logical_inputs.length, artifactMapped: true });
  }
  console.log(JSON.stringify({ origin: base.origin, readAt: data.readAt, models: checks }, null, 2));
})().catch(error => {
  // Do not print request bodies, cookies, environment values or raw connection errors.
  console.error('ADMIN_MODEL_DETAILS_CHECK_FAILED:', error.code === 'ERR_ASSERTION' ? error.message : 'Server unavailable or request failed');
  process.exitCode = 1;
});
