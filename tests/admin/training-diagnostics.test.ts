import assert from 'node:assert/strict';
import test from 'node:test';
import { modelPerformanceMetrics, rabatTrainingDiagnostics } from '../../lib/admin/model-performance';

const diagnostics = { scope: 'training_set_resubstitution', independent_test: false, sample_count: 700,
  source: 'docs/rabat-model-audit.md', r2_mad: 0.9521408362, mae_mad: 673900.58,
  rmse_mad: 1546508.58, median_ape_percent: 5.59955208 };
const model = { version: 'rabat-random-forest-v1', metrics: { training_diagnostics: diagnostics } };

test('Rabat training diagnostics come only from the scoped database JSON and never enter independent evaluation', () => {
  assert.deepEqual(rabatTrainingDiagnostics(model), diagnostics);
  assert.deepEqual(modelPerformanceMetrics(model), {});
  assert.equal(rabatTrainingDiagnostics({version:model.version,metrics:{}}),null);
  const documentaryOnly = {version:model.version,documented_metadata:{training_diagnostics:diagnostics}};
  assert.equal(rabatTrainingDiagnostics(documentaryOnly),null);
  for (const version of ['casablanca-catboost-v1','marrakech-stacking-v1']) {
    assert.equal(rabatTrainingDiagnostics({...model,version}),null);
    assert.deepEqual(modelPerformanceMetrics({version,metrics:{r2_test:0.8}}),{r2_test:0.8});
  }
});

test('missing, mislabelled or invalid training data fails closed without zero or manifest substitutes', () => {
  for (const patch of [{scope:'holdout'}, {independent_test:true}, {sample_count:0}, {sample_count:1.5},
    {source:''}, {r2_mad:NaN}, {r2_mad:Infinity}, {r2_mad:1.01}, {mae_mad:-1},
    {rmse_mad:'1546508.58'}, {median_ape_percent:null}, {median_ape_percent:-1}]) {
    assert.equal(rabatTrainingDiagnostics({...model,metrics:{training_diagnostics:{...diagnostics,...patch}}}),null);
  }
  for (const key of ['r2_mad','mae_mad','rmse_mad','median_ape_percent']) {
    const incomplete:Record<string,unknown>={...diagnostics};delete incomplete[key];
    assert.equal(rabatTrainingDiagnostics({...model,metrics:{training_diagnostics:incomplete}}),null);
  }
  assert.equal(rabatTrainingDiagnostics({...model,metrics:{training_diagnostics:{...diagnostics,r2_mad:-0.1}}})!.r2_mad,-0.1,'negative R² is valid');
});
