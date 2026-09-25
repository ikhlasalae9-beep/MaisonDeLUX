-- FINAL CLEANUP ONLY — review and apply manually after the relational writer is deployed
-- and all active readers have been verified against city_id/model_version_id/input_features.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.estimation_events
    WHERE city_id IS NULL OR model_version_id IS NULL OR input_features IS NULL
  ) THEN
    RAISE EXCEPTION 'Cleanup blocked: relational estimation fields still contain NULL values';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.estimation_events e
    JOIN public.model_versions mv ON mv.id = e.model_version_id
    WHERE mv.city_id <> e.city_id
  ) THEN
    RAISE EXCEPTION 'Cleanup blocked: an estimation model does not belong to its city';
  END IF;
END $$;

ALTER TABLE public.estimation_events
  ALTER COLUMN city_id SET NOT NULL,
  ALTER COLUMN model_version_id SET NOT NULL,
  ALTER COLUMN input_features SET NOT NULL;

DROP INDEX IF EXISTS public.estimation_events_region_idx;
DROP INDEX IF EXISTS public.estimation_events_city_idx;

ALTER TABLE public.estimation_events
  DROP COLUMN region,
  DROP COLUMN city,
  DROP COLUMN neighborhood,
  DROP COLUMN property_type,
  DROP COLUMN surface_m2,
  DROP COLUMN bedrooms,
  DROP COLUMN bathrooms,
  DROP COLUMN parking,
  DROP COLUMN balcony,
  DROP COLUMN sea_view,
  DROP COLUMN furnished_status,
  DROP COLUMN model_version,
  DROP COLUMN locale;

CREATE INDEX IF NOT EXISTS estimation_events_city_id_created_at_idx
  ON public.estimation_events(city_id, created_at DESC);
CREATE INDEX IF NOT EXISTS estimation_events_model_version_id_idx
  ON public.estimation_events(model_version_id);

COMMIT;
