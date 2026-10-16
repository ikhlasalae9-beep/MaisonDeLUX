import type { CityPredictPayload } from '@/lib/api/types';
import { validatePreparedModelInput } from '@/lib/security/model-input';
import rabat from '@/models/rabat/v1/preprocessing.json';

/** Shared by the real form and flow tests. Rabat Age is derived, never guessed. */
export function estimatorFormInput(city: CityPredictPayload['city'], form: Record<string, string>): CityPredictPayload {
  const ages = rabat.age_band_to_years as Record<string, number>;
  return validatePreparedModelInput({
    city, property_type: form.property_type, neighborhood: form.neighborhood,
    area: Number(form.area), rooms: Number(form.rooms), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms),
    ...(city === 'Casablanca' ? { floor: Number(form.floor) } : {}),
    current_state: form.current_state || null,
    age: city === 'Rabat' ? ages[form.current_state] : form.age || null,
  });
}
