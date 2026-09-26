export interface PredictPayload {
  surface_m2: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  region: string;
  city: string;
  neighborhood?: string;
  property_type: string;
  parking?: string;
  balcony?: string;
  sea_view?: string;
  furnished_status?: string;
}

export interface PredictResponse {
  estimated_price_mad: number;
  currency?: string;
  prix_min?: number;
  prix_max?: number;
  prix_par_m2?: number;
  ville?: string;
  quartier?: string;
  error?: string;
  model_version?: string;
  explanation?: {
    method: 'catboost_shap_values';
    baseline_mad: number;
    factors: Array<{
      key: string;
      contribution_mad: number;
    }>;
  };
  comparables?: Array<{
    property_type: string;
    neighborhood: string;
    listing_price_mad: number;
    area: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    floor: number;
    tags: string[];
    same_neighborhood: boolean;
    area_difference_m2: number;
  }>;
}

export interface CitiesResponse {
  villes: string[];
}

export interface ApiStatusCheck {
  isAvailable: boolean;
  modelVersion?: string;
  message?: string;
}

export interface CasablancaPredictPayload {
  city: 'Casablanca';
  property_type: string;
  neighborhood: string;
  area: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  current_state: string | null;
  age: string | null;
}

export interface CasablancaMetadata {
  city: 'Casablanca';
  status: 'available' | 'prepared' | 'unavailable';
  public_enabled: boolean;
  model_version: string;
  supported: {
    property_types: string[];
    neighborhoods: string[];
    current_states: string[];
    ages: string[];
  };
}

export interface CasablancaContextResponse {
  explanation?: PredictResponse['explanation'];
  comparables?: PredictResponse['comparables'];
  unavailable?: Array<'explanation' | 'comparables'>;
}
