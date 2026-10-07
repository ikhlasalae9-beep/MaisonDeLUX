# Marrakech final integration sprint — 2026-10-06

1. **FINAL INTEGRATION SPRINT: PASS.** The complete prepared implementation is ready for one Vercel Preview. Public Marrakech inference remains disabled. No Git commands, commits, pushes, deployments, or live migration application were performed.

2. **Runtime:** `.python-version` pins Python 3.12. A fresh Python 3.12.10 environment installed the production requirements successfully. Models remain lazy loaded. An opt-in Preview startup validator exercises prepared inference internally, without adding an HTTP endpoint or accepting a client bypass.

3. **Dependencies:** scikit-learn 1.9.0; xgboost-cpu 3.4.1; numpy 2.4.4; pandas 2.2.3; scipy 1.17.1; joblib 1.5.3; CatBoost 1.2.10. Existing Flask/Werkzeug ranges remain. `pip check` passes. The fresh environment contains neither the standard XGBoost distribution nor NVIDIA packages. The distribution guard accepts exact certified CPU or standard XGBoost versions and rejects absent, wrong, or conflicting versions. Development requirements inherit these production pins.

4. **Packaging:** Fluid Compute is declared. Python-specific includes cover backend code, production models, Casablanca reference CSV, and the lightweight historical class import required at startup. Research notebooks, scraping, datasets, reports, tests and frontend sources are excluded from the Python function. Frontend public assets remain available to Next.js. The prior Linux dependency estimate was approximately 695 MB, with 0.75–0.90 GB planning allowance; this is not a measured Vercel bundle. Actual packaging must be measured in Preview.

5. **API:** shared signed estimate/context endpoints dispatch through explicit Casablanca/Marrakech application contracts and the existing registry. Unsupported cities fail explicitly. HTTP never forwards a caller's `allow_prepared`. Metadata selects a city; signed health verifies that city's model readiness independently of its public capability.

6. **Marrakech validation:** exactly city plus property_type, neighborhood, area, rooms, bedrooms, bathrooms, current_state and age. Types normalize approved Appartement/Villa spellings; locations use the certified vocabulary and documented exact aliases only. Conditions are bon état/neuf/à rénover; ages are 0-5 ans/5-10 ans/+10 ans. Area is raw, finite and at least 15; counts are finite integers within the certified limits. Missing values, Floor, client Loc_Type, controls and unknown fields are rejected. The adapter derives Loc_Type, preserves nine-feature order and applies the certified inverse target transform once. Mathematics and model bytes are unchanged.

7. **Gateway/model identity:** the signed server gateway checks the exact requested city, model identifier and version before accepting a prediction. Public capability is checked before transport. Idempotent replay also checks the stored database city/version and response identity. Historical Casablanca responses without city/model_id retain compatibility through their authoritative database city/version. Cross-city responses fail closed.

8. **Persistence:** completion resolves the exact city/version/model identity and stores normalized inputs and the original prediction. Required entitlement completion remains transactional and fails closed; inference or completion failure releases the guest lease. Optional analytics do not alter model mathematics. The prepared completion helper is server-role-only and has no public route switch.

9. **New migration:** `supabase/migrations/006_prepared_city_inference.sql`, applied only in local PGlite tests so far. It adds model identity, registers the prepared Marrakech city/model with both database flags false, and replaces the existing public completion function with a protected wrapper. Existing migrations were not edited. The eventual Preview database must receive 006 after 005 before persistence verification.

10. **Entitlements/security:** guest one-free use, lease checks, failure release, duplicate event protection, verified authenticated continuation, guest claim idempotency, cross-user claim rejection, ownership and RLS are retained. Tests exercise real PostgreSQL semantics in PGlite. Anonymous/authenticated database roles cannot execute the prepared helper; only the privileged server role can. Gateway HMAC, redirect refusal, request bounds and authentication/admin separation remain intact.

11. **Account/results:** persisted Marrakech records display Marrakech and their own model version, use their own re-estimation route and supported categories, and export the correct city in PNG/PDF. Legacy records without a city retain their Casablanca display convention. Marrakech result/export enrichment is suppressed rather than showing another city's SHAP, comparables or market data. Existing account layouts and Casablanca editorial rendering remain intact.

12. **Estimator UI:** the existing shared estimator receives city metadata. Marrakech collects its eight model fields, requires condition and age, omits Floor and Loc_Type, uses the correct vocabulary and keeps resume storage isolated by city. Saved input from a different city is rejected. Public route gating still prevents access to the prepared form.

13. **FR/AR:** prepared form render tests pass in both locales, including Arabic category labels and age labels; export city identity is checked in both languages. Existing Casablanca/Rabat markup parity tests pass.

14. **Mobile/theme:** existing responsive grids, touch-sized controls, RTL layout and semantic light/dark theme tokens are reused. Prepared form markup is tested. Hosted browser appearance at mobile/desktop sizes is a Preview verification item; no hosted visual measurement is claimed here.

15. **Public capability:** frontend city configuration and Python registry remain false for Marrakech. Migration 006 explicitly keeps database city/model inference flags false. Marrakech estimator URLs return not-found; normal Next API validation, signed gateway and direct Python inference reject public Marrakech. Tests reject client controls and ensure no entitlement reservation or model call occurs on public Marrakech requests. Rabat remains unavailable for inference.

16. **Marrakech goldens:** all three use the immutable production package, with absolute tolerance 0.000001 MAD:

| Case | Certified raw MAD | Notebook display MAD | Status |
| --- | ---: | ---: | --- |
| Guéliz apartment | 1468447.422627404 | 1468000 | PASS |
| Palmeraie villa | 4700250.321581060 | 4700000 | PASS |
| Targa apartment | 1472533.476353344 | 1473000 | PASS |

Production retains raw_price_mad and display_price_mad; estimated_price_mad uses the existing whole-MAD result convention.

17. **Casablanca:** protected prediction remains **1,217,911 MAD**. Existing SHAP explanation method and real comparables pass. Its adapter is byte-identical. City/editorial FR/AR parity tests also pass.

18. **Artifact integrity:** all six certified model/preprocessing/metadata hashes match the recorded baselines. Casablanca adapter bytes also match. Exact hashes are recorded in `MARRAKECH_FINAL_ARTIFACT_INTEGRITY.json`. Neither model was retrained or reserialized.

19. **Python tests:** active city/API/gateway suite: **156 passed**, with warnings treated as errors. Adding production entrypoint/archived parity tests: **164 passed**, with seven sklearn 1.8→1.9 warnings confined to the archived national joblib parity test. The actual city startup validator emits zero compatibility warnings. A broader exploratory run exposed 16 stale national HTTP tests expecting the retired endpoint to return 200/400/503; it correctly returns 410. These historical tests were not used to weaken the endpoint or public capability. One old dependency assertion was updated for the explicitly approved two-city CPU runtime.

20. **Security tests:** complete `npm run test:security`: **86 passed, zero failed**. Includes real CPU model → validated result → transactional PGlite completion; three goldens; cross-city identity rejection; leases, failures, duplicate completion, claims, authenticated repetitions and RLS. Route tests cover disabled-city rejection before reservation and safe idempotent replay.

21. **Frontend tests:** separate frontend suite: **42 passed, zero failed**. Includes prepared Marrakech FR/AR form, responsive/theme markup, unavailable route, discovery capabilities, account/export behaviors and unchanged Casablanca/Rabat rendering.

22. **Typecheck/lint:** `npx tsc --noEmit --incremental false` passes. Lint passes without warnings/errors. Next's Windows sandbox initially misclassified installed TypeScript dependencies; the authorized local lint/build outside that sandbox completed normally.

23. **Production build:** final `npm run build` passes compilation, lint/type validation, all **35** static pages and build traces. Only Casablanca estimator pages are statically generated. No public Marrakech estimator was generated.

24. **Files created:**

- `.python-version`
- `backend/inference/service.py`
- `backend/inference/preview_validation.py`
- `lib/estimations/contracts.ts`
- `supabase/migrations/006_prepared_city_inference.sql`
- `tests/test_city_service.py`
- `tests/security/marrakech-integration.test.ts`
- `tests/security/city-gateway.test.ts`
- `tests/frontend/marrakech-estimator.test.ts`
- `docs/MARRAKECH_FINAL_ARTIFACT_INTEGRITY.json`
- `docs/MARRAKECH_FINAL_INTEGRATION_REPORT.md`

25. **Files modified:** requirements.txt; requirements-dev.txt; vercel.json; api/index.py; backend/app.py; backend/inference/marrakech.py; lib/api/types.ts; lib/api/client.ts; lib/security/model-input.ts; lib/estimations/gateway.ts; app/api/estimations/route.ts; app/api/account/properties/route.ts; app/[locale]/cities/[citySlug]/estimate/page.tsx; components/estimation/CasablancaEstimator.tsx; components/estimation/CasablancaEstimateResult.tsx; components/account/SavePropertyButton.tsx; components/account/SavedPassport.tsx; components/account/AccountWorkspace.tsx; components/account/PassportExportActionsClient.tsx; lib/account/presentation.ts; lib/account/passport-export.ts; tests/test_gateway_security.py; tests/test_production_api.py; tests/security/database.ts; tests/security/routes.test.ts; README.md. Local build output is generated under .next; no Git inventory was run.

26. **Preview-only unknowns:** actual Large Function selection and Linux bundle/native library loading; Linux memory and cold/warm/request latency; concurrent hosted behavior; gateway routing/secrets on Vercel; visual browser behavior; and migration/persistence against an isolated Preview database. Local Windows startup passed repeated requests and two-worker inference with zero warnings; those timings are not Vercel measurements.

27. **Exact one-Preview checklist:**

- Use the current Vercel architecture with Fluid Compute. Set `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` in the **Preview environment only** if required, and verify the build actually selects a Large Function. Record the final uncompressed Python function bundle size and confirm it is below 5 GB. Confirm Next public media is present.
- Configure matching server-only gateway secrets for Preview Next/Python and isolated Preview auth/database settings. Do not log secret values or change production settings. Apply migration 006 after 005 only to the isolated Preview database; confirm Marrakech city/model flags are both false. If no isolated database is configured, record persistence as unverified rather than using production.
- Set `MDL_PREVIEW_RUNTIME_CHECK=1` for Preview. Trigger one signed Python health request and inspect the `MDL_PREVIEW_RUNTIME_CHECK` startup record. Require Python 3.12, sklearn 1.9.0, xgboost-cpu 3.4.1, no compatibility warnings, all three golden values within 0.000001 MAD, Casablanca 1217911, preserved Casablanca SHAP/comparables, successful repeated requests and two-worker parity. This validator runs internally; do not add a public prepared endpoint.
- Record first cold invocation end-to-end latency, internal first prediction timing, warm request timing, total startup time and Linux peak resident memory. Exercise repeated signed Casablanca requests and modest two-request concurrency through the hosted gateway; record latency, errors and memory against the configured function limits.
- Verify unsigned, invalid-signature and stale-signature ML calls fail. Verify public Marrakech payloads and control fields fail through Next and Python; FR/AR Marrakech estimator URLs return not-found. Check no failed request consumes a guest trial and no Marrakech CTA is enabled.
- Verify `/fr` and `/ar`, all three city/editorial pages and Casablanca estimator/account/export views at mobile and desktop sizes in light/dark themes. Run the prepared Marrakech component FR/AR render fixture tests against the deployed revision; do not change public flags to expose the form. Record hosted visual checks separately from prepared component tests.
- Against the isolated Preview database, use protected server-side test execution for prepared Marrakech completion: persist each golden with exact Marrakech identity/input/result, read the owned Passport, verify FR/AR export city, failure release, one-free consumption, duplicate prevention, claims, authenticated continuation and cross-user/RLS rejection. Keep the helper inaccessible to client roles and all public inference flags false.
- Remove the optional Preview startup-check environment value after recording results, before any later production consideration. This completes one Preview validation, not public activation.

28. **Ready for ONE Preview deployment: YES.** Code and local tests are complete; remaining hosted measurements belong to that Preview. Deployment and public enablement require separate user instructions and were not performed.
