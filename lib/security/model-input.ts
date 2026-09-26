import manifest from '@/models/casablanca/v1/preprocessing.json';
import type { CasablancaPredictPayload } from '@/lib/api/types';
// Validation only: transforms and model mathematics remain exclusively in the approved Python pipeline.
export function validateModelInput(value: unknown): CasablancaPredictPayload {
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
export function validateSimulation(base: CasablancaPredictPayload, candidate: unknown) {
  const input = validateModelInput(candidate);
  const editable = ['area','floor','current_state','age'];
  if (manifest.logical_inputs.some(key => !editable.includes(key) && input[key as keyof typeof input] !== base[key as keyof typeof base])) throw new Error('INVALID_SIMULATION');
  return input;
}
export const eventId = (value: unknown) => typeof value === 'string' && /^[1-9][0-9]{0,17}$/.test(value);
export const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
