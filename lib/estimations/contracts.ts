import casablanca from '@/models/casablanca/v1/metadata.json';
import marrakech from '@/models/marrakech/v1/metadata.json';
import c from '@/models/casablanca/v1/preprocessing.json';
import m from '@/models/marrakech/v1/preprocessing.json';
import { getCityBySlug } from '@/lib/cities/registry';
import type { CityMetadata, CityPredictPayload } from '@/lib/api/types';

export const INFERENCE_CONTRACTS = {
  Casablanca: { slug: 'casablanca', version: casablanca.model_version, modelId: casablanca.model_id },
  Marrakech: { slug: 'marrakech', version: marrakech.model_version, modelId: marrakech.model_id },
} as const;

export function inferenceContract(city: unknown) {
  if (city !== 'Casablanca' && city !== 'Marrakech') throw new Error('INVALID_CITY');
  return INFERENCE_CONTRACTS[city];
}
export function requirePublicInference(city: unknown) {
  const contract = inferenceContract(city);
  if (!getCityBySlug(contract.slug)?.estimation.publicEnabled) throw new Error('CITY_NOT_PUBLIC');
  return contract;
}
export function verifyPrediction(input: CityPredictPayload, result: Record<string, any>) {
  const expected = inferenceContract(input.city);
  if (result.city !== input.city || result.model_id !== expected.modelId || result.model_version !== expected.version ||
      typeof result.estimated_price_mad !== 'number' || !Number.isFinite(result.estimated_price_mad) || result.estimated_price_mad <= 0) throw new Error('INVALID_MODEL_RESULT');
  return result;
}
export function estimatorMetadata(city: 'Casablanca' | 'Marrakech'): CityMetadata {
  const identity = inferenceContract(city);
  const supported = city === 'Casablanca' ? {
    property_types: Object.keys(c.categorical.Type.accepted), neighborhoods: [...c.categorical.Localisation.accepted],
    current_states: [...c.categorical.Current_state.accepted], ages: [...c.categorical.Age.accepted],
  } : {
    property_types: m.categorical.Type.map(value => value.toLowerCase()), neighborhoods: [...m.categorical.Localisation],
    current_states: [...m.categorical.Current_state], ages: [...m.categorical.Age],
  };
  return { city, status: getCityBySlug(identity.slug)!.estimation.status, public_enabled: !!getCityBySlug(identity.slug)?.estimation.publicEnabled, model_version: identity.version, supported };
}
