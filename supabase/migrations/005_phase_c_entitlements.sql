-- Server-only transactional operations; apply manually after 004.
BEGIN;
CREATE FUNCTION public.phase_c_rate_limit(p_key text,p_limit integer,p_seconds integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n integer;
BEGIN
  IF p_limit < 1 OR p_seconds < 1 THEN RAISE EXCEPTION 'Invalid rate policy'; END IF;
  INSERT INTO public.security_rate_limits(key_hash,count,expires_at) VALUES(p_key,1,now()+make_interval(secs=>p_seconds))
  ON CONFLICT(key_hash) DO UPDATE SET count=CASE WHEN public.security_rate_limits.expires_at<=now() THEN 1 ELSE public.security_rate_limits.count+1 END,
    expires_at=CASE WHEN public.security_rate_limits.expires_at<=now() THEN now()+make_interval(secs=>p_seconds) ELSE public.security_rate_limits.expires_at END
  RETURNING count INTO n;
  RETURN n<=p_limit;
END; $$;

CREATE FUNCTION public.phase_c_reserve_guest(p_token text,p_device text,p_network text,p_request uuid,p_days integer,p_network_cap integer) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE trial public.guest_trials; n integer;
BEGIN
  IF p_token IS NULL OR p_device IS NULL OR p_network IS NULL OR p_request IS NULL OR p_days NOT BETWEEN 1 AND 365 OR p_network_cap < 1 THEN RAISE EXCEPTION 'Invalid entitlement'; END IF;
  -- Serialize same-network requests before checking the shared device/network budget.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_network,0));
  INSERT INTO public.guest_trials(token_hash,device_hint_hash,network_hash,expires_at)
    VALUES(p_token,p_device,p_network,now()+make_interval(days=>p_days)) ON CONFLICT(token_hash) DO NOTHING;
  SELECT * INTO trial FROM public.guest_trials WHERE token_hash=p_token FOR UPDATE;
  IF trial.trial_consumed_at IS NOT NULL OR trial.claimed_at IS NOT NULL THEN RETURN 'GUEST_TRIAL_CONSUMED'; END IF;
  IF trial.expires_at<=now() THEN RETURN 'GUEST_TRIAL_EXPIRED'; END IF;
  IF trial.reserved_until>now() THEN RETURN 'ESTIMATION_IN_PROGRESS'; END IF;
  IF EXISTS (SELECT 1 FROM public.guest_trials WHERE device_hint_hash=p_device AND id<>trial.id AND expires_at>now() AND trial_consumed_at IS NOT NULL) THEN RETURN 'GUEST_TRIAL_CONSUMED'; END IF;
  IF EXISTS (SELECT 1 FROM public.guest_trials WHERE device_hint_hash=p_device AND id<>trial.id AND reserved_until>now()) THEN RETURN 'ESTIMATION_IN_PROGRESS'; END IF;
  SELECT count(*) INTO n FROM public.guest_trials WHERE network_hash=p_network AND (trial_consumed_at>now()-interval '1 day' OR reserved_until>now());
  IF n>=p_network_cap THEN RETURN 'RATE_LIMITED'; END IF;
  UPDATE public.guest_trials SET last_seen_at=now(),reserved_request_id=p_request,reserved_until=now()+interval '120 seconds' WHERE id=trial.id;
  RETURN 'ALLOWED';
END; $$;

CREATE FUNCTION public.phase_c_release_guest(p_token text,p_request uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
  UPDATE public.guest_trials SET reserved_until=NULL,reserved_request_id=NULL
  WHERE token_hash=p_token AND reserved_request_id=p_request AND trial_consumed_at IS NULL;
$$;

CREATE FUNCTION public.phase_c_complete_estimation(p_token text,p_request uuid,p_user uuid,p_input jsonb,p_prediction jsonb) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE trial public.guest_trials; event_id bigint; c_id bigint; m_id bigint;
BEGIN
  IF p_request IS NULL THEN RAISE EXCEPTION 'Request required'; END IF;
  IF p_user IS NULL THEN
    SELECT * INTO trial FROM public.guest_trials WHERE token_hash=p_token FOR UPDATE;
    IF trial.id IS NULL OR trial.trial_consumed_at IS NOT NULL OR trial.reserved_request_id IS DISTINCT FROM p_request OR trial.reserved_until IS NULL OR trial.reserved_until<=now() OR trial.expires_at<=now() THEN RAISE EXCEPTION 'Reservation unavailable'; END IF;
  END IF;
  SELECT c.id,m.id INTO c_id,m_id FROM public.cities c JOIN public.model_versions m ON m.city_id=c.id
    WHERE c.slug='casablanca' AND c.public_enabled=true AND m.public_inference_enabled=true AND m.version=p_prediction->>'model_version';
  IF c_id IS NULL OR m_id IS NULL OR (p_input->>'city') IS DISTINCT FROM 'Casablanca' OR p_prediction->>'estimated_price_mad' IS NULL OR NOT ((p_prediction->>'estimated_price_mad')::numeric>0) THEN RAISE EXCEPTION 'Invalid model result'; END IF;
  INSERT INTO public.estimation_events(event_key,city_id,model_version_id,input_features,estimated_price_mad,is_test,user_id)
    VALUES(p_request::text,c_id,m_id,p_input,(p_prediction->>'estimated_price_mad')::numeric,false,p_user) RETURNING id INTO event_id;
  INSERT INTO public.estimation_passports(estimation_event_id,prediction) VALUES(event_id,p_prediction);
  IF p_user IS NULL THEN
    UPDATE public.guest_trials SET trial_consumed_at=now(),estimation_event_id=event_id,reserved_request_id=NULL,reserved_until=NULL WHERE id=trial.id;
    INSERT INTO public.security_audit_logs(event_type) VALUES('guest_trial_consumed');
  END IF;
  RETURN event_id;
END; $$;

CREATE FUNCTION public.phase_c_claim_guest(p_token text,p_user uuid) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE trial public.guest_trials; owner uuid;
BEGIN
  IF p_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO trial FROM public.guest_trials WHERE token_hash=p_token FOR UPDATE;
  IF trial.id IS NULL OR trial.trial_consumed_at IS NULL OR trial.estimation_event_id IS NULL OR trial.expires_at<=now() THEN RETURN NULL; END IF;
  IF trial.claimed_at IS NOT NULL THEN
    IF trial.claimed_user_id=p_user THEN RETURN trial.estimation_event_id; END IF;
    RETURN NULL;
  END IF;
  SELECT user_id INTO owner FROM public.estimation_events WHERE id=trial.estimation_event_id FOR UPDATE;
  IF owner IS NOT NULL AND owner<>p_user THEN RETURN NULL; END IF;
  UPDATE public.estimation_events SET user_id=p_user WHERE id=trial.estimation_event_id;
  UPDATE public.guest_trials SET claimed_user_id=p_user,claimed_at=now() WHERE id=trial.id;
  INSERT INTO public.security_audit_logs(event_type,actor_user_id) VALUES('guest_estimation_claimed',p_user);
  RETURN trial.estimation_event_id;
END; $$;

REVOKE ALL ON FUNCTION public.phase_c_rate_limit(text,integer,integer),public.phase_c_reserve_guest(text,text,text,uuid,integer,integer),public.phase_c_release_guest(text,uuid),public.phase_c_complete_estimation(text,uuid,uuid,jsonb,jsonb),public.phase_c_claim_guest(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.phase_c_rate_limit(text,integer,integer),public.phase_c_reserve_guest(text,text,text,uuid,integer,integer),public.phase_c_release_guest(text,uuid),public.phase_c_complete_estimation(text,uuid,uuid,jsonb,jsonb),public.phase_c_claim_guest(text,uuid) TO service_role;
COMMIT;
