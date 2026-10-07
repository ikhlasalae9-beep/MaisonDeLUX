# Marrakech public activation report — 2026-10-07

**READY FOR USER COMMIT + FINAL PREVIEW**

A. Files changed

Application/configuration: `api/index.py`; `backend/app.py`; `backend/inference/registry.py`; `backend/inference/preview_validation.py`; `config/cities.config.ts`; `lib/estimations/contracts.ts`; `lib/api/client.ts`; `app/api/estimations/route.ts`; `app/[locale]/cities/[citySlug]/estimate/page.tsx`; `components/estimation/CasablancaEstimator.tsx`; `components/layout/CompactHeader.tsx`; `components/layout/RouteShell.tsx`; `README.md`.

Tests: `tests/test_preview_startup.py`; `tests/test_city_service.py`; `tests/test_marrakech_availability.py`; `tests/test_marrakech_inference.py`; `tests/frontend/city-foundation.test.ts`; `tests/frontend/marrakech.test.ts`; `tests/frontend/marrakech-estimator.test.ts`; `tests/security/city-gateway.test.ts`; `tests/security/marrakech-integration.test.ts`; `tests/security/routes.test.ts`.

New files: `supabase/migrations/007_public_marrakech_activation.sql`; this report. Prior migrations and certified artifact files were not edited.

B. Exact capability changes

- Python Marrakech registry: `status: prepared → available`; `public_enabled: false → true`.
- Frontend Marrakech: `estimation.status: unavailable → available`; `estimation.publicEnabled: false → true`; `backendStatusKey: null → marrakech`; `modelRef: null → marrakech`.
- SQL migration 007: Marrakech `cities.public_enabled → true` and only the exact certified `marrakech-stacking-v1` / `marrakech-stacking-alae` row's `public_inference_enabled → true`.
- Metadata/health and server input/gateway validation continue deriving capability from these existing registries. The route list and sitemap include Marrakech through the established capability configuration. Marketplace context remains unavailable; its market capability was not enabled.

Immutable package metadata records the historical certification state and is not the operational capability source. It remains byte-identical.

C. Public routes prepared

The production build generates `/fr/cities/marrakech/estimate` and `/ar/cities/marrakech/estimate`. Local browser navigation verified both pages. Titles, descriptions and back links say Marrakech in FR/AR. The shared form requires all eight certified model inputs, exposes no Floor or Loc_Type, uses certified categories and numeric limits, and validates before transport. Arabic renders RTL. Desktop 1440px and mobile 390px were checked in light/dark mode: eight combinations, no horizontal overflow and usable input widths. No real estimation was submitted through the browser to an external database.

D. Marrakech golden parity

| Case | Certified raw MAD | Result |
| --- | ---: | --- |
| Guéliz apartment | 1468447.422627404 | PASS |
| Palmeraie villa | 4700250.321581060 | PASS |
| Targa apartment | 1472533.476353344 | PASS |

Public registry, service and signed HTTP tests preserve absolute tolerance 0.000001 MAD. Feature order, derived Loc_Type, raw area, embedded preprocessing and single np.expm1 are unchanged. Route de Casablanca dispatches and persists as Marrakech. No fallback model or fabricated enrichment is used.

E. Casablanca regression

**1,217,911 MAD**, with preserved SHAP method and real comparables. Existing Casablanca/Rabat city and market markup parity tests pass. Casablanca's form layout and copy are retained; only Marrakech receives city-specific headings and navigation.

F. Artifact integrity

All six model/preprocessing/metadata files and the Casablanca adapter match the recorded hashes in `MARRAKECH_FINAL_ARTIFACT_INTEGRITY.json`. Marrakech model SHA-256 remains `623de883b958bb3fca1bfd545fa0f1d41d084179a45f901940f8901170e8dcf4`. Neither model, either preprocessing package nor the inference mathematics was modified. Activation does not rewrite certification metadata.

G. Auth and entitlement

Marrakech uses the same signed gateway, protected completion, guest lease and claim architecture. Anonymous guests receive one successful estimate across cities; subsequent use requires login/signup. Authenticated users have no trial cap, with existing request rate controls retained. Validation rejection performs no reservation/inference; failed inference releases the lease without consumption. Duplicate completion, claims, authenticated continuation and RLS are tested. No client-selected model/version, allow_prepared, entitlement bypass or public validation endpoint was introduced.

H. Persistence and identity

Real CPU model outputs persist through the public completion function to local PostgreSQL/PGlite with exact Marrakech city_id, model_version_id, model identity, normalized input, original prediction and FR/AR locale. The new six-argument completion overload validates locale and delegates to the unchanged protected five-argument completion semantics, recording locale in the same transaction. Existing callers retain the five-argument function. Historical records are not rewritten. Guest ownership, claim identity, idempotency and cross-user RLS remain enforced. Account/history/result/export city handling from the integration sprint is retained and tested.

I. Security result

Full `npm run test:security`: **87 passed, zero failed**. Includes unsigned/invalid/stale signature rejection, city/model mismatch rejection, disabled capability checks, malformed inputs/control rejection, Route de Casablanca, guest business rules, public transactional persistence, claims and RLS. The final migration variant was additionally verified with the two real-model integration tests.

J. Verification result

- Active Python city/API/gateway/startup suite: **168 passed**, warnings treated as errors.
- Frontend: **42 passed**, including FR/AR public routes, form contract, city identity, header and sitemap.
- TypeScript: `npx tsc --noEmit --incremental false` passes.
- Lint: passes without warnings/errors; final production build also runs lint/type validation.
- Production build: passes, **37** static pages, including both intended Marrakech estimator locales.
- Local browser: FR/AR × 390/1440px × light/dark passes with no horizontal overflow.
- The already successful hosted Linux runtime result supplied by the user was accepted as authoritative; no further hosted compatibility investigation or deployment was performed.

Normal `api/index.py` startup no longer calls the validator, reads branch-specific validation switches or requires MDL_PREVIEW_RUNTIME_CHECK. Retained validation code is internal and explicitly invoked by tests. Tests prove normal startup never invokes it even on Preview branch test with the obsolete variable set.

K. Manual migration still required

Apply **007_public_marrakech_activation.sql** manually to the intended environment after **006_prepared_city_inference.sql** (and its predecessors). If 006 is already applied, apply only 007. Do not rerun 006 after 007: 006 intentionally resets Marrakech capability to disabled. Migration 007 enables only the certified city/model and adds transactional locale recording. No migration was applied to any remote or production database in this sprint; only isolated local test databases were changed.

L–M. Prohibited actions

No Git command, commit, push, merge or deployment was performed. No model retraining, replacement or reserialization occurred. Repository activation is prepared; deployed capability and database state are unchanged until the user applies the migration and deploys.

N. **READY FOR USER COMMIT + FINAL PREVIEW**
