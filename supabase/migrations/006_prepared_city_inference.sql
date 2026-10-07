-- Prepared Marrakech support; public inference remains disabled. Apply after 005.
BEGIN;
ALTER TABLE public.model_versions ADD COLUMN IF NOT EXISTS model_identity text;
UPDATE public.model_versions SET model_identity='casablanca-catboost-alae'
 WHERE version='casablanca-catboost-v1' AND city_id IN (SELECT id FROM public.cities WHERE slug='casablanca');
INSERT INTO public.cities(slug,name,region,public_enabled)
 SELECT 'marrakech','Marrakech','Marrakech-Safi',false
 WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug='marrakech');
INSERT INTO public.model_versions(city_id,version,architecture,artifact_path,status,public_inference_enabled,model_identity)
 SELECT id,'marrakech-stacking-v1','StackingRegressor','models/marrakech/v1/model.pkl','registered',false,'marrakech-stacking-alae'
 FROM public.cities WHERE slug='marrakech'
 AND NOT EXISTS (SELECT 1 FROM public.model_versions WHERE city_id=public.cities.id AND version='marrakech-stacking-v1');
UPDATE public.model_versions SET model_identity='marrakech-stacking-alae',public_inference_enabled=false
 WHERE version='marrakech-stacking-v1' AND city_id IN (SELECT id FROM public.cities WHERE slug='marrakech');
UPDATE public.cities SET public_enabled=false WHERE slug='marrakech';

CREATE FUNCTION public.phase_c_complete_estimation_internal(p_token text,p_request uuid,p_user uuid,p_input jsonb,p_prediction jsonb,p_allow_prepared boolean) RETURNS bigint
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
                 ('Marrakech','marrakech-stacking-v1','marrakech-stacking-alae')) AS supported(city,version,identity)
    WHERE city=p_input->>'city';
  SELECT c.id,m.id INTO c_id,m_id FROM public.cities c JOIN public.model_versions m ON m.city_id=c.id
    WHERE c.slug=lower(expected_city) AND m.version=expected_version
      AND m.model_identity=expected_identity
      AND ((c.public_enabled=true AND m.public_inference_enabled=true) OR p_allow_prepared=true);
  IF c_id IS NULL OR m_id IS NULL OR (p_prediction->>'model_version') IS DISTINCT FROM expected_version
     OR (p_prediction ? 'city' AND (p_prediction->>'city') IS DISTINCT FROM expected_city)
     OR (p_prediction ? 'model_id' AND (p_prediction->>'model_id') IS DISTINCT FROM expected_identity)
     OR (expected_city='Marrakech' AND ((p_prediction->>'model_id') IS DISTINCT FROM expected_identity OR (p_prediction->>'city') IS DISTINCT FROM expected_city))
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

CREATE OR REPLACE FUNCTION public.phase_c_complete_estimation(p_token text,p_request uuid,p_user uuid,p_input jsonb,p_prediction jsonb) RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT public.phase_c_complete_estimation_internal(p_token,p_request,p_user,p_input,p_prediction,false);
$$;
-- The prepared operation is server-only and has no HTTP/client-controlled switch.
-- Preview runtime tests may invoke it using the protected server role.
REVOKE ALL ON FUNCTION public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean) TO service_role;
REVOKE ALL ON FUNCTION public.phase_c_complete_estimation(text,uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.phase_c_complete_estimation(text,uuid,uuid,jsonb,jsonb) TO service_role;
COMMIT;
