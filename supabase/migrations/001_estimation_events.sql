CREATE TABLE IF NOT EXISTS public.estimation_events (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  property_type TEXT NOT NULL,
  surface_m2 NUMERIC NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking TEXT,
  balcony TEXT,
  sea_view TEXT,
  furnished_status TEXT,
  estimated_price_mad NUMERIC NOT NULL,
  model_version TEXT,
  locale TEXT
);

CREATE INDEX IF NOT EXISTS estimation_events_created_at_idx
  ON public.estimation_events(created_at);

CREATE INDEX IF NOT EXISTS estimation_events_region_idx
  ON public.estimation_events(region);

CREATE INDEX IF NOT EXISTS estimation_events_city_idx
  ON public.estimation_events(city);
