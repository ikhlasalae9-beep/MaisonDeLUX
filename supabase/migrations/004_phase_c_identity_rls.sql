-- Additive Phase C migration. Review and run manually against the finalized V2 schema.
BEGIN;
ALTER TABLE public.estimation_events ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX estimation_events_user_history_idx ON public.estimation_events(user_id, created_at DESC, id DESC) WHERE user_id IS NOT NULL;

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '' CHECK (length(display_name) <= 80),
  preferred_locale text NOT NULL DEFAULT 'fr' CHECK (preferred_locale IN ('fr','ar')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'))
);
CREATE TABLE public.saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id bigint NOT NULL REFERENCES public.cities(id),
  label text NOT NULL CHECK (length(label) BETWEEN 1 AND 100),
  input_features jsonb NOT NULL CHECK (jsonb_typeof(input_features) = 'object' AND octet_length(input_features::text) < 16384),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saved_properties_owner_idx ON public.saved_properties(user_id, created_at DESC, id);
CREATE TABLE public.guest_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token_hash text NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  device_hint_hash text, network_hash text,
  created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(),
  trial_consumed_at timestamptz, estimation_event_id bigint UNIQUE REFERENCES public.estimation_events(id) ON DELETE SET NULL,
  claimed_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, claimed_at timestamptz,
  expires_at timestamptz NOT NULL,
  reserved_request_id uuid, reserved_until timestamptz,
  -- Preserve consumed status if an authorized retention job removes the event.
  CHECK (estimation_event_id IS NULL OR trial_consumed_at IS NOT NULL)
);
CREATE INDEX guest_trials_device_idx ON public.guest_trials(device_hint_hash, expires_at);
CREATE INDEX guest_trials_network_idx ON public.guest_trials(network_hash, trial_consumed_at, reserved_until);
CREATE TABLE public.security_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('signup_completed','login_completed','logout','guest_trial_consumed','guest_estimation_claimed','admin_access_denied','password_reset_requested','password_changed','role_changed')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX security_audit_logs_created_idx ON public.security_audit_logs(created_at DESC);
-- Snapshot storage avoids changing historical model output or adding V1 event columns.
CREATE TABLE public.estimation_passports (
  estimation_event_id bigint PRIMARY KEY REFERENCES public.estimation_events(id) ON DELETE CASCADE,
  prediction jsonb NOT NULL CHECK (jsonb_typeof(prediction) = 'object'),
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.security_rate_limits (
  key_hash text PRIMARY KEY, count integer NOT NULL CHECK (count > 0), expires_at timestamptz NOT NULL
);
CREATE INDEX security_rate_limits_expiry_idx ON public.security_rate_limits(expires_at);

CREATE FUNCTION public.phase_c_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles(user_id,display_name,preferred_locale) VALUES
    (NEW.id,left(coalesce(NEW.raw_user_meta_data->>'display_name',''),80),CASE WHEN NEW.raw_user_meta_data->>'preferred_locale'='ar' THEN 'ar' ELSE 'fr' END);
  INSERT INTO public.user_roles(user_id,role) VALUES (NEW.id,'user');
  INSERT INTO public.security_audit_logs(event_type,actor_user_id) VALUES ('signup_completed',NEW.id);
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.phase_c_new_user() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER phase_c_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.phase_c_new_user();
INSERT INTO public.profiles(user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles(user_id,role) SELECT id,'user' FROM auth.users ON CONFLICT DO NOTHING;

CREATE FUNCTION public.phase_c_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.phase_c_updated_at() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.phase_c_updated_at();
CREATE TRIGGER saved_properties_updated BEFORE UPDATE ON public.saved_properties FOR EACH ROW EXECUTE FUNCTION public.phase_c_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimation_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles,public.user_roles,public.saved_properties,public.estimation_events,public.guest_trials,public.security_audit_logs,public.estimation_passports,public.security_rate_limits FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.profiles,public.user_roles,public.saved_properties,public.estimation_events,public.estimation_passports TO authenticated;
GRANT UPDATE(display_name,preferred_locale) ON public.profiles TO authenticated;
GRANT INSERT,DELETE ON public.saved_properties TO authenticated;
GRANT UPDATE(label,input_features) ON public.saved_properties TO authenticated;
GRANT ALL ON public.profiles,public.user_roles,public.saved_properties,public.estimation_events,public.guest_trials,public.security_audit_logs,public.estimation_passports,public.security_rate_limits TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.security_audit_logs_id_seq TO service_role;

CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));
CREATE POLICY roles_read_own ON public.user_roles FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY properties_own ON public.saved_properties FOR ALL TO authenticated USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));
CREATE POLICY events_read_own ON public.estimation_events FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
-- Restrictive fence remains effective even if an older permissive policy is present.
CREATE POLICY events_owner_fence ON public.estimation_events AS RESTRICTIVE FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY passports_read_own ON public.estimation_passports FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.estimation_events e WHERE e.id=estimation_event_id AND e.user_id=(SELECT auth.uid()))
);
-- guest_trials, security_rate_limits, security_audit_logs intentionally have no client policies.
COMMIT;
