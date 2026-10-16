-- FINAL RABAT REGISTRATION + PUBLIC DATABASE ACTIVATION. MANUAL EXECUTION ONLY.
-- Requires the existing schema and RPCs from migrations 001-007.
-- Public activation authorized by the user; no RLS/user/history changes or invented metrics.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $registration$
DECLARE
  v_city_id bigint;
  v_model public.model_versions%ROWTYPE;
  v_metadata constant jsonb := '{
    "metadata_source": "models/rabat/v1/metadata.json",
    "artifact_sha256": "e2d7355966d5424e09e9b2f3afb8f381dc4b1b2be183a2e4f31fdda17880ab60",
    "preprocessing_sha256": "37d2ea1a6ec1fb2e531818a648ca885b32fe21fae50f090ace1b276ce98c1f74",
    "metrics_status": "no_independent_holdout_validation",
    "independent_test_metrics": null
  }'::jsonb;
BEGIN
  IF to_regprocedure('public.phase_c_complete_estimation(text,uuid,uuid,jsonb,jsonb,text)') IS NULL
    OR to_regprocedure('public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)') IS NULL THEN
    RAISE EXCEPTION 'Existing Phase C RPCs missing; review migrations 001-007 first';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('maisondelux:rabat_application_integration', 0));
  INSERT INTO public.cities(slug,name,region,public_enabled)
  SELECT 'rabat','Rabat','Rabat-Salé-Kénitra',false
  WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug='rabat')
  ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO STRICT v_city_id FROM public.cities WHERE slug='rabat' FOR UPDATE;
  UPDATE public.cities SET name=COALESCE(NULLIF(name,''),'Rabat'),
    region=COALESCE(NULLIF(region,''),'Rabat-Salé-Kénitra')
  WHERE id=v_city_id AND (name='' OR region IS NULL OR region='');
  INSERT INTO public.model_versions(city_id,version,architecture,artifact_path,status,public_inference_enabled,model_identity)
  SELECT v_city_id,'rabat-random-forest-v1','RandomForestRegressor',
    'models/rabat/v1/model.joblib','registered',false,'rabat-random-forest'
  WHERE NOT EXISTS (SELECT 1 FROM public.model_versions WHERE city_id=v_city_id AND version='rabat-random-forest-v1')
  ON CONFLICT (city_id,version) DO NOTHING;
  SELECT * INTO STRICT v_model FROM public.model_versions
    WHERE city_id=v_city_id AND version='rabat-random-forest-v1' FOR UPDATE;
  IF (NULLIF(v_model.model_identity,'') IS NOT NULL AND v_model.model_identity<>'rabat-random-forest')
    OR (NULLIF(v_model.architecture,'') IS NOT NULL AND v_model.architecture<>'RandomForestRegressor')
    OR (NULLIF(v_model.artifact_path,'') IS NOT NULL AND v_model.artifact_path<>'models/rabat/v1/model.joblib') THEN
    RAISE EXCEPTION 'Existing Rabat registration conflicts with the reviewed package';
  END IF;
  IF v_model.metrics IS NOT NULL AND jsonb_typeof(v_model.metrics)<>'object' THEN
    RAISE EXCEPTION 'Existing Rabat metrics require review: expected a JSON object';
  END IF;
  UPDATE public.model_versions SET model_identity='rabat-random-forest',
    architecture='RandomForestRegressor',artifact_path='models/rabat/v1/model.joblib',
    metrics=v_metadata || COALESCE(v_model.metrics,'{}'::jsonb)
  WHERE id=v_model.id AND (model_identity IS DISTINCT FROM 'rabat-random-forest'
    OR architecture IS DISTINCT FROM 'RandomForestRegressor'
    OR artifact_path IS DISTINCT FROM 'models/rabat/v1/model.joblib'
    OR metrics IS DISTINCT FROM (v_metadata || COALESCE(v_model.metrics,'{}'::jsonb)));
  -- Keep IDs, status, trained_at, created_at and all existing metadata keys.
END;
$registration$;

-- Preserve the existing RPC signature and transactional entitlement/persistence
-- behavior. Only add the canonical Rabat tuple and mandatory Rabat identity.
CREATE OR REPLACE FUNCTION public.phase_c_complete_estimation_internal(p_token text,p_request uuid,p_user uuid,p_input jsonb,p_prediction jsonb,p_allow_prepared boolean) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE trial public.guest_trials; event_id bigint; c_id bigint; m_id bigint; expected_city text; expected_version text; expected_identity text;
BEGIN
  IF p_request IS NULL THEN RAISE EXCEPTION 'Request required'; END IF;
  IF p_user IS NULL THEN
    SELECT * INTO trial FROM public.guest_trials WHERE token_hash=p_token FOR UPDATE;
    IF trial.id IS NULL OR trial.trial_consumed_at IS NOT NULL OR trial.reserved_request_id IS DISTINCT FROM p_request OR trial.reserved_until IS NULL OR trial.reserved_until<=now() OR trial.expires_at<=now() THEN RAISE EXCEPTION 'Reservation unavailable'; END IF;
  END IF;
  SELECT city,version,identity INTO expected_city,expected_version,expected_identity
    FROM (VALUES ('Casablanca','casablanca-catboost-v1','casablanca-catboost-alae'),
                 ('Marrakech','marrakech-stacking-v1','marrakech-stacking-alae'),
                 ('Rabat','rabat-random-forest-v1','rabat-random-forest')) AS supported(city,version,identity)
    WHERE city=p_input->>'city';
  SELECT c.id,m.id INTO c_id,m_id FROM public.cities c JOIN public.model_versions m ON m.city_id=c.id
    WHERE c.slug=lower(expected_city) AND m.version=expected_version
      AND m.model_identity=expected_identity
      AND ((c.public_enabled=true AND m.public_inference_enabled=true) OR p_allow_prepared=true);
  IF c_id IS NULL OR m_id IS NULL OR (p_prediction->>'model_version') IS DISTINCT FROM expected_version
     OR (p_prediction ? 'city' AND (p_prediction->>'city') IS DISTINCT FROM expected_city)
     OR (p_prediction ? 'model_id' AND (p_prediction->>'model_id') IS DISTINCT FROM expected_identity)
     OR (expected_city IN ('Marrakech','Rabat') AND ((p_prediction->>'model_id') IS DISTINCT FROM expected_identity OR (p_prediction->>'city') IS DISTINCT FROM expected_city))
     OR p_prediction->>'estimated_price_mad' IS NULL OR NOT ((p_prediction->>'estimated_price_mad')::numeric>0)
     OR (p_prediction->>'estimated_price_mad') IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid model result'; END IF;
  INSERT INTO public.estimation_events(event_key,city_id,model_version_id,input_features,estimated_price_mad,is_test,user_id)
    VALUES(p_request::text,c_id,m_id,p_input,(p_prediction->>'estimated_price_mad')::numeric,false,p_user) RETURNING id INTO event_id;
  INSERT INTO public.estimation_passports(estimation_event_id,prediction) VALUES(event_id,p_prediction);
  IF p_user IS NULL THEN
    UPDATE public.guest_trials SET trial_consumed_at=now(),estimation_event_id=event_id,reserved_request_id=NULL,reserved_until=NULL WHERE id=trial.id;
    INSERT INTO public.security_audit_logs(event_type) VALUES('guest_trial_consumed');
  END IF;
  RETURN event_id;
END; $$;

-- Existing five-/six-argument public wrappers remain unchanged and pass false.
-- Only the existing trusted server role can invoke internal prepared execution.
REVOKE ALL ON FUNCTION public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)
  TO service_role;
-- Activate only the reviewed Rabat city/version/identity. Safe to rerun.
UPDATE public.cities SET public_enabled=true WHERE slug='rabat' AND public_enabled IS DISTINCT FROM true;
UPDATE public.model_versions m SET public_inference_enabled=true
FROM public.cities c WHERE m.city_id=c.id AND c.slug='rabat'
  AND m.version='rabat-random-forest-v1' AND m.model_identity='rabat-random-forest'
  AND m.public_inference_enabled IS DISTINCT FROM true;
COMMIT;
