import manifest from '@/models/casablanca/v1/preprocessing.json';
import type { CasablancaPredictPayload, CityPredictPayload, MarrakechPredictPayload } from '@/lib/api/types';
import marrakech from '@/models/marrakech/v1/preprocessing.json';
import { inferenceContract, requirePublicInference } from '@/lib/estimations/contracts';
// Validation only: transforms and model mathematics remain exclusively in the approved Python pipeline.
export function validateModelInput(value: unknown): CityPredictPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_INPUT');
  try { requirePublicInference((value as Record<string, unknown>).city); } catch { throw new Error('INVALID_INPUT'); }
  return validatePreparedModelInput(value);
}

// Internal validation has no transport bypass; public callers use the wrapper above.
export function validatePreparedModelInput(value: unknown): CityPredictPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_INPUT');
  const city = (value as Record<string, unknown>).city;
  inferenceContract(city);
  if (city === 'Marrakech') return validateMarrakech(value as Record<string, unknown>);
  return validateCasablanca(value);
}

function validateCasablanca(value: unknown): CasablancaPredictPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_INPUT');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !manifest.logical_inputs.includes(key)) || input.city !== 'Casablanca') throw new Error('INVALID_INPUT');
  if (!Object.keys(manifest.categorical.Type.accepted).includes(String(input.property_type)) || !manifest.categorical.Localisation.accepted.includes(String(input.neighborhood))) throw new Error('INVALID_INPUT');
  for (const rule of Object.values(manifest.numeric)) {
    const number = input[rule.input];
    if (typeof number !== 'number' || !Number.isFinite(number) || ('minimum_exclusive' in rule ? number <= rule.minimum_exclusive : number < rule.minimum) || (rule.transform === 'integer_cap' && !Number.isInteger(number))) throw new Error('INVALID_INPUT');
  }
  for (const key of ['Current_state','Age'] as const) {
    const rule = manifest.categorical[key], field = input[rule.input];
    if (field != null && (typeof field !== 'string' || !rule.accepted.includes(field))) throw new Error('INVALID_INPUT');
  }
  return { ...input, current_state: input.current_state ?? null, age: input.age ?? null } as unknown as CasablancaPredictPayload;
}
function validateMarrakech(input: Record<string, unknown>): MarrakechPredictPayload {
  const fields = ['city','property_type','neighborhood','area','rooms','bedrooms','bathrooms','current_state','age'];
  if (Object.keys(input).length !== fields.length || fields.some(key => !(key in input))) throw new Error('INVALID_INPUT');
  const typeMap: Record<string,string> = { appartement: 'Appartement', villa: 'Villa', Appartement: 'Appartement', Villa: 'Villa' };
  if (typeof input.property_type !== 'string' || !typeMap[input.property_type]) throw new Error('INVALID_INPUT');
  const aliases = marrakech.verified_training_location_aliases as Record<string,string>;
  const location = typeof input.neighborhood === 'string' ? aliases[input.neighborhood] || input.neighborhood : '';
  if (!marrakech.categorical.Localisation.includes(location) || !marrakech.categorical.Current_state.includes(String(input.current_state)) || !marrakech.categorical.Age.includes(String(input.age))) throw new Error('INVALID_INPUT');
  if (typeof input.current_state !== 'string' || typeof input.age !== 'string') throw new Error('INVALID_INPUT');
  for (const [field, rule] of Object.entries(marrakech.numerical)) {
    const key = field.toLowerCase(), number = input[key];
    const minimum = 'minimum_inclusive' in rule ? rule.minimum_inclusive : rule.minimum;
    if (typeof number !== 'number' || !Number.isFinite(number) || number < minimum || (rule.maximum !== null && number > rule.maximum) || (field !== 'Area' && !Number.isInteger(number))) throw new Error('INVALID_INPUT');
  }
  return { ...input, property_type: typeMap[input.property_type].toLowerCase(), neighborhood: location } as unknown as MarrakechPredictPayload;
}

export function validateSimulation(base: CityPredictPayload, candidate: unknown) {
  const input = validateModelInput(candidate);
  const editable = ['area','floor','current_state','age'];
  if (Object.keys(base).some(key => !editable.includes(key) && (input as unknown as Record<string,unknown>)[key] !== (base as unknown as Record<string,unknown>)[key])) throw new Error('INVALID_SIMULATION');
  return input;
}
export const eventId = (value: unknown) => typeof value === 'string' && /^[1-9][0-9]{0,17}$/.test(value);
export const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
