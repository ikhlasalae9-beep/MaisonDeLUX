# Rabat final website integration

## Current status

The application now exposes the Rabat estimator in French and Arabic, using
the existing website/API/security architecture and the unchanged verified
`rabat-random-forest-v1` pipeline. The project owner has confirmed Alae's model
was approved by the professor supervising the project and has authorized this
integration. No new training, optimization, replacement or independent model
evaluation is a prerequisite imposed by this implementation.

**Live Supabase registration/activation and successful live persistence remain
unverified/pending your manual SQL application and checks.** No production SQL
was executed, including read-only inspection during this phase. The review uses
the previously inspected actual schema, existing migrations and application
contracts. Database state may have changed since that inspection; no claim is
made that a live Rabat row/event currently exists or does not exist.

No commit, push or deployment was performed.

## Application changes

- `/fr/cities/rabat/estimate` and `/ar/cities/rabat/estimate` use the shared
  Casablanca/Marrakech design, request lifecycle, authenticated/guest behavior,
  resume storage, idempotency, error handling and saved-result architecture.
- City capabilities, navigation/CTAs, sitemap/static routes, localized city copy,
  product header/back link and model metadata now target Rabat itself. No Rabat
  market analytics or fabricated neighborhood price data were added.
- `lib/estimations/form-input.ts` is used by the real form and end-to-end tests.
  It builds Rabat's exact eight-feature input: Type, Localisation, Area, Rooms,
  Bedrooms, Bathrooms, Current_state and numeric Age. The form has four raw
  numeric fields, property/location selectors, an age-band selector and a read-only
  derived Age. There is no floor input, free-text unknown category or Loc_Type.
- Choosing `5-10 ans` produces Age **7.5**. Explicit Inconnu produces **15** as
  documented by the original preparation. The fitted encoder/forest and single
  expm1 conversion are unchanged; known rare locations retain their original
  Autre mapping. Counts/area retain the existing Phase 1 validation envelope.
- Python registry and application city gates are now enabled in source. HTTP
  requests still require the existing signed gateway; client flags cannot bypass
  validation, identity, auth/guest limits, ownership or database persistence.
- Result/Passport views and exports identify Rabat/الرباط and its Random Forest,
  translate age bands/property types and display numeric years. They suppress
  unsupported explanations, comparables and market context instead of falling
  back to Casablanca. Existing Casablanca/Marrakech content remains intact.
- Admin recognizes the Rabat artifact/contract, reports read-only integrity and
  records the project owner's supervisor-approval confirmation. Its operational
  counts/events still come from actual database queries. No fake activity, metric,
  training date or deployment status was introduced.
- Next output tracing includes the immutable Rabat files needed by Admin
  integrity checks. Existing Python packaging already includes `models/**`.

Core files: `app/[locale]/cities/[citySlug]/estimate/page.tsx`,
`components/estimation/CasablancaEstimator.tsx`, `CasablancaEstimateResult.tsx`,
`components/layout/CompactHeader.tsx`, `RouteShell.tsx`, `config/cities.config.ts`,
`config/city-content.ts`, `lib/estimations/contracts.ts`, `form-input.ts`,
`lib/account/presentation.ts`, `passport-export.ts`, `lib/admin/model.ts`,
`model-integrity.ts`, `backend/inference/registry.py`, `service.py`,
`backend/app.py`, `next.config.mjs`, and the associated frontend/flow tests.

## Model preservation and evaluation documentation

The artifact remains byte-identical to `ml/notebooks/rabat/rf_price_model.joblib`:

```text
model.joblib      e2d7355966d5424e09e9b2f3afb8f381dc4b1b2be183a2e4f31fdda17880ab60
preprocessing.json 37d2ea1a6ec1fb2e531818a648ca885b32fe21fae50f090ace1b276ce98c1f74
metadata.json     72730f0817c6365654e0977e56779329d5743b37a1234894ff2c5794304f2865
```

None of these model files, source datasets or the original alternative artifact
were modified. All 26 frozen golden cases still pass. The 700-row fitted pipeline
still produces raw MAD **1885593.2799045164**, whole MAD **1885593** for appartement,
Agdal, area 110, rooms 3, bedrooms 2, bathrooms 1, band 5-10 ans, numeric Age 7.5.

The immutable package JSON retains its historical prepared/public-disabled
packaging labels and original evaluation notes. Those describe Phase 1 packaging;
current application authorization is owned by the city registry/Python registry
and database flags, not by rewriting model metadata. Earlier audit/Phase 1/Phase 2
reports are historical snapshots superseded by this requested final integration.

Known limitations remain documented: supplied notebook outputs do not establish
an independently reproduced holdout score; the 700-row diagnostics are training
resubstitution, and studio/bureau support comes from very small cohorts. No
independent accuracy metrics were invented. These are transparency notes, not a
new evaluation/training condition for the professor-approved model.

## SQL review and manual activation

The prepared migration `rabat_application_integration.sql` remains available as
the earlier disabled-registration script. For this final integration, use the
standalone **`supabase/migrations/rabat_public_integration.sql`** instead. It
includes registration, compatible RPC support and narrowly scoped public database
activation. It handles both a fresh Rabat registration and an already-applied
prepared migration; do not run both scripts as a new sequence.

Reviewed schema requirements: `cities` has bigint ID, unique slug, name, region
and public_enabled; `model_versions` has bigint ID, city FK, unique
`(city_id,version)`, architecture/artifact/status/public flag, JSONB metrics,
model_identity and nullable training date. Existing estimation city/model ownership
foreign keys and the Phase C tables/procedures remain in place. The script checks
the six-argument locale wrapper and internal completion RPC from 001–007 before
changing registration. Do not reapply old Casablanca/Marrakech activation scripts.

Safety/idempotence properties:

- One transaction, bounded lock/statement timeouts, advisory serialization,
  unique-key inserts and resolved IDs; reruns do not duplicate city/model rows.
- Existing Rabat technical identities are checked before activation; conflicts
  or non-object metrics abort the transaction. Existing metadata keys, dates,
  status and IDs are preserved. New status is the actual schema's `registered`,
  not a fabricated trained/deployed state.
- The canonical Rabat tuple is added to the existing internal RPC while preserving
  its signature, SECURITY DEFINER/empty search_path, guest-row locking, entitlement
  checks, positive-price validation and transactional event/passport creation.
  Required Rabat response identities prevent another city's model result from
  being saved as Rabat.
- Existing public wrappers/locale behavior, table/RLS policies, users/history and
  Casablanca/Marrakech registrations/flags are unchanged. The internal prepared
  writer retains service-role-only execution.
- Final UPDATE statements activate only city slug `rabat` and its exact reviewed
  `rabat-random-forest-v1` / `rabat-random-forest` tuple, and skip unchanged flags.
- The complete migration has **not been executed**, including in a test database.
  Isolated tests execute an equivalent fixture of the existing writer, compare
  its body with both manual files, and supply fixture registration rows. Thus the
  writer flow is tested; full migration application/rerun is not claimed tested.

## Exact activation and verification steps

1. In Supabase SQL Editor, record current Casablanca/Marrakech IDs, flags and event
   counts with the query below. This is for you to run; it was not executed here.
2. Review and execute the **entire** `rabat_public_integration.sql` file. If an
   error leaves the editor transaction aborted, run `ROLLBACK;`, resolve the
   reported conflict/schema prerequisite and retry. Do not substitute numeric IDs.
3. Run the verification queries. Expect exactly the canonical Rabat model row,
   both public flags true, its existing/null trained_at preserved, canonical RPC
   support true, service_role execution true and authenticated/anon execution
   false. Compare Casablanca/Marrakech against the recorded snapshot.
4. Restart the existing Next.js and Python services with this reviewed code.
   Keep the existing matching gateway secret, Supabase/POSTGRES_URL and auth
   configuration; no new secret or client bypass is needed. Use the pinned
   sklearn 1.9.0 runtime already used for Marrakech, not the workstation's default
   sklearn 1.8.0. The validated local Python executable is
   `outputs/admin-data/runtime/Scripts/python.exe`; a local backend can be started
   with `outputs/admin-data/runtime/Scripts/python.exe -m backend.app`.
   Next uses `npm run build` then `npm run start`. No restart/deployment to a
   remote environment was performed by this task.
5. Open `/fr/cities/rabat/estimate`, enter the golden example above, and submit
   once. Confirm the response has Rabat's exact model identity/version and an
   `estimation_event_id`. The normal endpoint fails closed rather than returning
   a successful unsaved result if schema/flags/persistence are unavailable.
6. Confirm that event and saved passport with the SQL below, including owner or
   guest association, locale and matching price. In Admin, select Rabat and
   all-time, refresh, and check the new event/saved-result count. Repeat in Arabic
   and with an authenticated account; guest reuse should follow the existing
   one-use/auth continuation policy. Until these live checks are performed,
   live persistence and live Admin visibility remain **pending**.

Manual verification SQL:

```sql
SELECT c.id AS city_id,c.slug,c.region,c.public_enabled,
       m.id AS model_version_id,m.version,m.model_identity,m.architecture,
       m.artifact_path,m.status,m.public_inference_enabled,m.trained_at,
       (SELECT count(*) FROM public.estimation_events e
        WHERE e.city_id=c.id AND e.model_version_id=m.id AND e.is_test=false)
        AS recorded_estimations
FROM public.cities c JOIN public.model_versions m ON m.city_id=c.id
WHERE c.slug IN ('casablanca','marrakech','rabat') ORDER BY c.slug,m.version;

SELECT position('rabat-random-forest-v1' IN pg_get_functiondef(
 'public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)'::regprocedure
)) > 0 AS rabat_rpc_supported,
has_function_privilege('service_role',
 'public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)',
 'EXECUTE') AS server_can_complete,
has_function_privilege('authenticated',
 'public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)',
 'EXECUTE') AS customer_can_complete_prepared,
has_function_privilege('anon',
 'public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)',
 'EXECUTE') AS anon_can_complete_prepared;

SELECT e.id,e.event_key,e.created_at,e.locale,e.user_id,c.slug,m.version,
       e.input_features,e.estimated_price_mad,
       p.estimation_event_id IS NOT NULL AS saved_passport,
       p.prediction->>'model_id' AS returned_model_id,
       p.prediction->>'estimated_price_mad' AS saved_price_mad
FROM public.estimation_events e
JOIN public.cities c ON c.id=e.city_id
JOIN public.model_versions m ON m.id=e.model_version_id AND m.city_id=e.city_id
LEFT JOIN public.estimation_passports p ON p.estimation_event_id=e.id
WHERE c.slug='rabat' ORDER BY e.created_at DESC LIMIT 10;
```

## Validation evidence

| Boundary | Result |
|---|---|
| Production build/routes | Passed; generated both Rabat FR/AR estimate routes |
| Python model/service/API/security regressions | 402 passed, including Casablanca/Marrakech golden predictions |
| Application/security/frontend tests | 114 passed; TypeScript and build lint passed |
| Real public-path flow in isolated PostgreSQL | Passed using the real submit builder/client/API, normal signed Python HTTP endpoint, unchanged CPU model, locale-aware public RPC, saved passport and authenticated Admin reads |
| Auth/guest/idempotency | Passed: authenticated FR/AR, owned replay without reinference, guest use/reuse protection, ownership/RLS/security regressions |
| Unmigrated/disabled DB behavior | Passed in fixture: request errors; no successful event/passport or successful unsaved prediction |
| Browser form | FR/AR, desktop 1280 and mobile 390, light/dark; age derives 7.5, no horizontal overflow, correct Rabat back links |
| Model/source preservation | SHA-256 and original artifact copy checks passed; all model files/datasets unchanged |
| Live Supabase migration/persistence/Admin | Pending manual application and verification; not executed/claimed successful |

Browser validation used a separate localhost visual-check server with API calls
blocked, so filling the form could not create production events. Stored screenshots
are under ignored `outputs/rabat-final/`. The browser form was not submitted to
live Supabase. The complete successful application path was exercised with real
CPU inference and isolated PostgreSQL fixtures, not mock predictions. React
review confirmed shared layout/hooks behavior, labeled controls and derived Age,
with an accessible mobile back link added.

## Complete executable SQL

The following is an exact copy of the standalone manual script. Run it yourself
only after reviewing the steps and verification requirements above.

```sql
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
```
