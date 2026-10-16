-- Manual application only. Inspected against the project's live Supabase schema.
-- Requires the existing cities/model_versions schema and migrations 001-006.
-- Does not apply 007, change public permissions, or write estimation/user data.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $integration$
DECLARE
  v_city_id bigint;
  v_model public.model_versions%ROWTYPE;
  -- Verbatim values from models/marrakech/v1/metadata.json; NOT production metrics.
  v_metadata constant jsonb := $metadata${
    "source": "training_notebook",
    "metadata_source": "models/marrakech/v1/metadata.json",
    "artifact_sha256": "623de883b958bb3fca1bfd545fa0f1d41d084179a45f901940f8901170e8dcf4",
    "metrics_status": "not_independently_recomputed",
    "metrics_scope": "Notebook metrics describe the 746/187 holdout experiment before the final full-cohort refit of the serialized stack. Random Forest CV 0.705 ± 0.035 is not a stacking CV result.",
    "notebook_reported_metrics": {
      "R2_Test_log": 0.7276,
      "R2_Test_DH": 0.5822,
      "MAE_DH": 1408655,
      "MAPE_median_percent": 17.7
    }
  }$metadata$::jsonb;
BEGIN
  -- Serialize concurrent copies of this migration; unique constraints also
  -- protect against registration by other writers. No numeric IDs are assumed.
  PERFORM pg_advisory_xact_lock(hashtextextended('maisondelux:marrakech_admin_integration', 0));

  INSERT INTO public.cities (slug, name, region, public_enabled)
  SELECT 'marrakech', 'Marrakech', 'Marrakech-Safi', false
  WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'marrakech')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO STRICT v_city_id
  FROM public.cities WHERE slug = 'marrakech' FOR UPDATE;

  UPDATE public.cities
  SET name = COALESCE(NULLIF(name, ''), 'Marrakech'),
      region = COALESCE(NULLIF(region, ''), 'Marrakech-Safi')
  WHERE id = v_city_id AND (name = '' OR region IS NULL OR region = '');

  INSERT INTO public.model_versions
    (city_id, version, architecture, artifact_path, status,
     public_inference_enabled, model_identity)
  SELECT v_city_id, 'marrakech-stacking-v1', 'StackingRegressor',
    'models/marrakech/v1/model.pkl', 'registered', false, 'marrakech-stacking-alae'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.model_versions
    WHERE city_id = v_city_id AND version = 'marrakech-stacking-v1'
  )
  ON CONFLICT (city_id, version) DO NOTHING;

  SELECT * INTO STRICT v_model FROM public.model_versions
  WHERE city_id = v_city_id AND version = 'marrakech-stacking-v1' FOR UPDATE;

  -- Fail atomically rather than relabel a different artifact or replace history.
  IF (NULLIF(v_model.model_identity, '') IS NOT NULL
      AND v_model.model_identity <> 'marrakech-stacking-alae')
    OR (NULLIF(v_model.architecture, '') IS NOT NULL
      AND v_model.architecture <> 'StackingRegressor')
    OR (NULLIF(v_model.artifact_path, '') IS NOT NULL
      AND v_model.artifact_path <> 'models/marrakech/v1/model.pkl') THEN
    RAISE EXCEPTION 'Marrakech registration conflicts with verified project metadata';
  END IF;
  IF v_model.metrics IS NOT NULL AND jsonb_typeof(v_model.metrics) <> 'object' THEN
    RAISE EXCEPTION 'Existing Marrakech metrics must be reviewed: expected a JSON object';
  END IF;

  -- Existing metadata keys win; fill absent keys only. No invented RMSE,
  -- training date, deployment state, or conversion of log R2 into MAD R2.
  UPDATE public.model_versions
  SET model_identity = 'marrakech-stacking-alae',
      architecture = 'StackingRegressor',
      artifact_path = 'models/marrakech/v1/model.pkl',
      metrics = v_metadata || COALESCE(v_model.metrics, '{}'::jsonb)
  WHERE id = v_model.id AND (
    model_identity IS DISTINCT FROM 'marrakech-stacking-alae'
    OR architecture IS DISTINCT FROM 'StackingRegressor'
    OR artifact_path IS DISTINCT FROM 'models/marrakech/v1/model.pkl'
    OR metrics IS DISTINCT FROM (v_metadata || COALESCE(v_model.metrics, '{}'::jsonb))
  );
  -- Existing IDs, status, created_at, trained_at and both activation flags survive.
END;
$integration$;

COMMIT;
