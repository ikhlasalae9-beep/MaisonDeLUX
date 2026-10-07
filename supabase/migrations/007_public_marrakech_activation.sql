-- Apply manually after 006. No model bytes or entitlement rules change.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.cities c JOIN public.model_versions m ON m.city_id=c.id
    WHERE c.slug='marrakech' AND m.version='marrakech-stacking-v1'
      AND m.model_identity='marrakech-stacking-alae'
  ) THEN RAISE EXCEPTION 'Certified Marrakech registration missing; apply 006 first'; END IF;
END $$;
UPDATE public.cities SET public_enabled=true WHERE slug='marrakech';
UPDATE public.model_versions SET public_inference_enabled=true
 WHERE version='marrakech-stacking-v1' AND model_identity='marrakech-stacking-alae'
 AND city_id IN (SELECT id FROM public.cities WHERE slug='marrakech');

-- Preserve the existing five-argument entrypoint for historical callers.
ALTER TABLE public.estimation_events ADD COLUMN IF NOT EXISTS locale text;
CREATE FUNCTION public.phase_c_complete_estimation(p_token text,p_request uuid,p_user uuid,p_input jsonb,p_prediction jsonb,p_locale text) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE event_id bigint;
BEGIN
  IF p_locale IS NULL OR p_locale NOT IN ('fr','ar') THEN RAISE EXCEPTION 'Invalid locale'; END IF;
  event_id := public.phase_c_complete_estimation(p_token,p_request,p_user,p_input,p_prediction);
  UPDATE public.estimation_events SET locale=p_locale WHERE id=event_id;
  RETURN event_id;
END; $$;
REVOKE ALL ON FUNCTION public.phase_c_complete_estimation(text,uuid,uuid,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.phase_c_complete_estimation(text,uuid,uuid,jsonb,jsonb,text) TO service_role;
COMMIT;
