# Rabat Phase 2 — application integration

> Historical Phase 2 snapshot. The subsequent [final integration report](rabat-final-integration.md)
> supersedes the disabled-application status and earlier release prerequisites:
> the project owner confirmed supervisor approval and authorized public website
> integration. Evaluation limitations remain documented without imposing new
> training/evaluation. Final database activation remains manual/unverified.

Rabat is registered in the **application code** as a prepared model. Public
inference remains disabled. The Supabase registration/RPC migration is prepared
for manual review and **has not been executed**. No model was retrained, dataset
edited, model artifact changed, deployment made or live database contacted.

## Implemented application path

- `backend/inference/registry.py` registers Rabat with status `prepared`,
  `public_enabled=False`, identity `rabat-random-forest` and version
  `rabat-random-forest-v1`. Existing Casablanca/Marrakech entries retain their
  identities and public flags.
- `backend/inference/service.py` maps application fields to Rabat's eight prepared
  inputs and delegates validation/math to the Phase 1 adapter. It preserves
  numeric Age and returns normalized persistence input with known rare labels
  mapped to Autre. Rabat responses must explicitly match city/model/version;
  missing/incorrect identity is rejected. Only an explicit trusted Python
  `allow_prepared=True` invocation can estimate for Rabat.
- Existing metadata and signed health checks can discover Rabat truthfully as
  prepared, disabled and not operationally deployed. Numeric Age has no string
  choice list; the explicit `age_band_to_years` mapping documents its meaning.
- `lib/api/types.ts`, `lib/estimations/contracts.ts` and
  `lib/security/model-input.ts` support Rabat's discriminated application payload:
  city, property_type, neighborhood, area, rooms, bedrooms, bathrooms,
  current_state and **numeric** age. Category checks, exact field membership,
  numeric bounds, integer counts and state/age consistency mirror Python. No
  floor, Loc_Type, hidden defaults or unrecognized neighborhood is accepted.
- The public TypeScript validator rejects Rabat before auth, entitlement,
  transport or persistence. A release guard in `requirePublicInference` rejects
  it independently of the unchanged disabled city-page capability configuration.
- `lib/estimations/gateway.ts` separates the existing server-only request signing
  primitive from public authorization. `createSignedInferenceRequest` validates
  the registered prepared contract and signs the normalized body. It does not
  send a request or authorize prediction. `invokeInference` still checks public
  capability **before** signing/sending. The Python HTTP handlers never forward a
  caller's allow_prepared field; even correctly signed public Rabat estimates and
  context requests remain rejected.
- `app/api/estimations/route.ts` preserves existing entitlement, rate limiting,
  guest leases, authenticated ownership, event-key replay and transactional
  event/passport persistence. Replay continues to allow historical Casablanca
  records without embedded identities; all other supported cities require their
  explicit city/model identity.

Example internal application input:

```python
from backend.inference import service

result = service.estimate({
    "city": "Rabat", "property_type": "appartement", "neighborhood": "Agdal",
    "area": 110, "rooms": 3, "bedrooms": 2, "bathrooms": 1,
    "current_state": "5-10 ans", "age": 7.5,
}, allow_prepared=True)  # Trusted Python invocation; not an HTTP input switch.
# raw_price_mad=1885593.2799045164, estimated_price_mad=1885593
```

The earlier prepared discovery helper remains available for local package
diagnostics. Discovery/loading does not prove deployment or independent accuracy.

Two presentation-facing changes are **type compatibility only**:
`CasablancaEstimateResult.tsx` accepts the expanded response-city type, and
`lib/account/passport-export.ts` permits numeric Age in its source record type.
No markup, customer text, styling, CTA, navigation or public estimator was changed.
Customer-facing Rabat presentation remains a future release review item.

## Manual Supabase SQL

Complete SQL is in
[`supabase/migrations/rabat_application_integration.sql`](../supabase/migrations/rabat_application_integration.sql).
Copy the entire file into Supabase SQL Editor yourself after review. It requires
the schema/RPCs from migrations 001–007, including the existing six-argument
locale wrapper. Do not reapply historical activation scripts as part of this work.

The migration is transaction-wrapped with bounded lock/statement timeouts. It:

1. Inserts missing Rabat city/model rows using the verified unique slug and
   `(city_id,version)` constraints, resolves actual IDs rather than assuming them,
   and sets both new public flags **false**. Region comes from the existing
   project city configuration: `Rabat-Salé-Kénitra`.
2. Registers architecture `RandomForestRegressor`, artifact
   `models/rabat/v1/model.joblib`, internal identity/version and metadata provenance
   hashes. `status='registered'` satisfies the actual database enum-like check;
   it is catalog registration, not trained/validated/deployed approval.
3. Preserves existing IDs, timestamps, status and existing metadata keys; fills
   missing technical values only. It does not manufacture a training date or
   independent metric. Database metadata records no independent holdout evidence;
   resubstitution scores are not copied into generic test-accuracy fields.
4. Aborts atomically on conflicting artifact identity/architecture/path,
   non-object existing metrics, or an already-public Rabat city/model. The latter
   requires manual review rather than silently changing a previous release's
   authorization. Existing disabled flags stay disabled.
5. Uses CREATE OR REPLACE on the existing internal completion function, preserving
   its signature, owner, empty search_path, guest-row locking, canonical city/model
   resolution, positive-price checks, event/passport transaction and guest
   consumption. The only writer changes are the canonical Rabat tuple and mandatory
   Rabat city/model identity checks. Casablanca/Marrakech tuples remain unchanged.
6. Retains server-role-only execution for the internal prepared RPC. Existing
   five-/six-argument public wrappers are unchanged and pass prepared=false, so
   disabled database flags still reject Rabat. No HTTP parameter can select the
   internal prepared operation. Tables, foreign keys, policies, user records,
   estimation history and other cities' activation flags are not rewritten.

Registration is idempotent: unique-key insert checks, stable resolved IDs,
fill-only metadata, updates that skip unchanged rows and replaceable RPC definition
permit reruns. The full registration migration has deliberately **not** been run,
even in a test database. It has been reviewed against the previously inspected
actual schema. Its registration/rerun behavior is therefore a reviewed property,
not a claimed executed-migration test result. On an editor error, issue ROLLBACK
before resolving the cause and retrying.

Verification SQL to run manually before/after application:

```sql
SELECT c.id AS city_id, c.slug, c.region, c.public_enabled,
       m.id AS model_version_id, m.version, m.model_identity,
       m.architecture, m.artifact_path, m.status,
       m.public_inference_enabled, m.trained_at, m.metrics,
       (SELECT count(*) FROM public.estimation_events e
        WHERE e.city_id=c.id AND e.model_version_id=m.id
          AND e.is_test=false) AS recorded_estimations
FROM public.cities c
JOIN public.model_versions m ON m.city_id=c.id
WHERE c.slug IN ('casablanca','marrakech','rabat')
ORDER BY c.slug,m.version;

SELECT position('rabat-random-forest-v1' IN pg_get_functiondef(
  'public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)'::regprocedure
)) > 0 AS rabat_rpc_registered,
has_function_privilege('service_role',
  'public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)',
  'EXECUTE') AS server_can_complete_prepared,
has_function_privilege('authenticated',
  'public.phase_c_complete_estimation_internal(text,uuid,uuid,jsonb,jsonb,boolean)',
  'EXECUTE') AS customer_can_complete_prepared;
```

After application, expect Rabat's flags false, trained_at unchanged/null,
server_can_complete_prepared true and customer_can_complete_prepared false.
Existing Casablanca/Marrakech IDs, flags, metrics and history should be unchanged.
New real user activity can independently increase their counts between reads.
The existing Admin database queries can list registration after manual application;
this does not authorize inference or certify operational deployment.

## Internal end-to-end test boundary

`tests/security/rabat-integration.test.ts` uses PGlite and fixture identities.
It does **not** connect to configured Supabase or execute the new migration file.
It extends the historical 006 fixture's canonical model mapping, compares its
entire normalized RPC body with the manual migration's function body, and then
executes that equivalent writer in the isolated fixture. Registration rows are
fixture setup rather than a claimed application of the new migration.

The tested flow is:

```text
Prepared TypeScript validation
  → shared server signing helper
  → real Python gateway signature verification in a Flask test request context
  → explicit trusted Python prepared service → real frozen CPU prediction
  → strict response identity verification
  → protected internal RPC in isolated PostgreSQL
  → owned event + saved passport → authenticated Admin query
```

This is an internal end-to-end test, not a claim that a disabled public HTTP
endpoint serves Rabat. Separate tests assert the public main route fails before
entitlement/inference/writes, a signed HTTP caller cannot activate Rabat, public
RPC wrappers reject its disabled flags, and authenticated customers cannot execute
the prepared RPC. Owner isolation, duplicate event-key rejection, guest failure
release, one-use completion, claim idempotency and cross-user claim denial use the
existing real SQL procedures in the fixture. Existing Casablanca/Marrakech tests
continue exercising locale-aware public wrappers and actual CPU predictions.

## XGBoost harness investigation

The old preview report unconditionally requested distribution metadata for
`xgboost-cpu`. This Windows runtime has standard `xgboost` 3.4.1 instead. Marrakech's
loader already accepts either distribution at the pinned version. Predictions,
context and golden cases succeeded before the report reached that lookup.

`preview_validation.xgboost_runtime()` now reports the actual supported installed
distribution and version under `xgboost_runtime`. It supports either package,
prefers CPU when both agree, and rejects missing, mismatched or conflicting
versions. Tests cover each case. No model loader, estimator, preprocessing,
weights, dependency installation or production prediction behavior was changed.
The previous failing preview harness now passes.

## Validation results

- **402/402 Python tests passed**: new Rabat application tests, all Phase 1
  artifact/input/golden checks, Casablanca/Marrakech inference and API tests,
  gateway/security, service and startup/preview regressions.
- **110/110 `npm run test:security` tests passed**, including the four new internal
  Rabat end-to-end/security cases and existing real-CPU, transactional persistence,
  RLS, ownership, auth, Admin and public capability regressions.
- `npx tsc --noEmit`, `npm run lint` and `git diff --check` passed.
- Final source/package checks confirm the original Rabat files, all three frozen
  Rabat package files, and existing Casablanca/Marrakech artifacts are unchanged.

Reproduce with the existing local compatibility runtime (or an equivalent clean
runtime satisfying the pinned package contracts):

```powershell
outputs/admin-data/runtime/Scripts/python.exe -m pytest `
  tests/test_rabat_application.py tests/test_rabat_inference.py `
  tests/test_marrakech_inference.py tests/test_marrakech_availability.py `
  tests/test_casablanca_inference.py tests/test_casablanca_api.py `
  tests/test_city_service.py tests/test_gateway_security.py `
  tests/test_preview_startup.py `
  --basetemp=outputs/rabat-audit/pytest-phase2-final --tb=short -q

$env:MDL_TEST_PYTHON = (Resolve-Path '.\outputs\admin-data\runtime\Scripts\python.exe').Path
npm run test:security
npx tsc --noEmit
npm run lint
```

Use a new dedicated writable basetemp path when reproducing; pytest owns/clears
that directory. No manual Supabase migration or production estimation request is
part of these commands.

## Remaining activation blockers

- Independent accuracy evidence for the **frozen** artifact is still absent.
  The training-data diagnostics and 26 golden fixtures are not holdout/CV results.
- Resolve the inconsistent notebook/export provenance and obtain the original
  training runtime/date evidence where available; no values have been invented.
- Review supported public types (especially one bureau/two studio examples),
  neighborhood policy, age semantics and numeric/count constraints using proper
  independent evaluation across coverage/price segments.
- Validate the pinned package on the intended deployment runtime, including cold
  start, memory, concurrency and request budgets. Local passes do not certify a
  deployment that has not occurred.
- Review and manually apply the SQL migration. Until then, the live database has
  not been registered or updated by this task; fixture results are not live proof.
- Review Rabat customer-facing forms, Passport/export/model-transparency text,
  locales and optional capability handling before allowing user-generated Rabat
  records. No public estimator UI was added in this phase.
- Obtain explicit release approval before changing the independent TypeScript,
  Python, city capability and database activation gates. No automatic activation
  migration or public bypass was introduced.

Explanation, comparables, market context and uncertainty remain unavailable for
Rabat unless separately implemented and validated. No commit, push or deployment
is part of Phase 2.
