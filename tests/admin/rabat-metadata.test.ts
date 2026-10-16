import assert from 'node:assert/strict';
import test from 'node:test';
import { modelRegistry } from '../../lib/admin/model';
import { modelPerformanceMetrics } from '../../lib/admin/model-performance';
import { estimatorMetadata } from '../../lib/estimations/contracts';
import { getModelIntegrity } from '../../lib/admin/model-integrity';

test('Rabat documentary metadata retains eight fitted inputs and distinguishes fitted/public policy and historical packaging',()=>{
  const entry=modelRegistry['rabat-random-forest-v1'] as any;
  assert.equal(entry.metadata.artifact,'models/rabat/v1/model.joblib');
  assert.equal(entry.metadata.architecture,'RandomForestRegressor');
  assert.equal(entry.metadata.forest_parameters.n_estimators,500);
  assert.deepEqual(entry.logicalInputs,['Type','Localisation','Area','Rooms','Bedrooms','Bathrooms','Current_state','Age']);
  assert.deepEqual(entry.supportedPropertyTypes,estimatorMetadata('Rabat').supported.property_types);
  assert.equal(entry.metadata.status,'prepared_internal_only');
  assert.deepEqual(modelPerformanceMetrics({version:'rabat-random-forest-v1',documented_metadata:entry.metadata,metrics:{r2_test:.9521408362032084,mae_test_mad:673900}}),{});
  assert.deepEqual(modelPerformanceMetrics({version:'marrakech-stacking-v1',metrics:{test:42}}),{test:42});
  const integrity=getModelIntegrity('rabat-random-forest-v1')!;
  assert.equal(integrity.artifact,true);assert.equal(integrity.preprocessing,true);
});
