# Rabat Admin model details — serving-process fix

## Root cause

The process actually listening on `127.0.0.1:3000` was a stale `next start --hostname 127.0.0.1 --port 3000` process (PID 21320). Its authenticated Admin GET response returned the real Rabat row (city 4, model 3, version `rabat-random-forest-v1`, architecture `RandomForestRegressor`, public authorization true), but its loaded documentary registry returned `artifact_registered: false`, empty `logical_inputs` and `supported_property_types`, null `documented_metadata` and null integrity. Its model SELECT did not return the artifact/identity columns either.

The checked-out code already contained Rabat's verified registration, manifest enrichment and model detail rendering. Earlier browser verification had used a separate local verification server, leaving the older port-3000 production process in memory. Refreshing that old server could not load the new server-side mapping. The fix was to stop only the verified local Next process, build the current checkout and restore the real server on port 3000. No database update could repair that obsolete loaded registry.

## Focused changes

- `app/api/admin/model/route.ts`: pass both `cityId` and `modelId` into the established `getOverview` mapping. The endpoint previously ignored `modelId`. A mismatched city/model now produces no model rows instead of unrelated details.
- `components/admin/AdminDashboard.tsx`: export the existing `ModelDetail` component for direct render regression tests. No markup, classes, layout or design changes.
- `tests/admin/model-details-integration.test.ts`: exercise real isolated PostgreSQL tables through the protected model API and existing React detail renderer, including repeated refresh reads. Verify Rabat artifact/identity, eight exact fields, fitted/public categories, 500-tree architecture, actual local hashes and truthful null training date/unverified deployment. Seed misleading training diagnostics deliberately and verify they never render as independent test metrics. Verify Casablanca/Marrakech retain their own documentary inputs, metrics and artifact details; verify authentication, private/no-store responses and city/model mismatch isolation.
- `scripts/verify-admin-model-details.cjs`: repeatable read-only smoke check against the actual local serving process. Uses normal Admin sign-in and a protected GET, not direct SQL or inference. Checks all three versions against the current project manifests. Restricted to loopback hosts; no credentials, cookies or user events are printed.
- `docs/rabat-admin-model-details-fix.md`: this report.

Run the live check from the repository root:

```powershell
node scripts/verify-admin-model-details.cjs
```

It defaults to `http://localhost:3000`, matching the existing local request-origin policy. The restarted site remains running at that origin. No CSRF, authentication or other security protection was relaxed.

## Verified data mapping

The existing model SELECT reads `model_versions` joined to its city, including `artifact_path` and `model_identity`; operational fields such as status, public authorization and dates remain database values. Enrichment by the exact model version reads `models/rabat/v1/metadata.json` and `preprocessing.json`. No alias or another city's model is substituted.

Verified Rabat artifact: `models/rabat/v1/model.joblib`; identity: `rabat-random-forest`; architecture: RandomForestRegressor, 500 trees. Exact fitted fields: Type, Localisation, Area, Rooms, Bedrooms, Bathrooms, Current_state, Age. Fitted types: appartement, bureau, maison, studio, villa. The existing approved application's public form currently accepts these same five categories; that policy is labelled separately from fitted coverage and database public authorization. Studio (2) and bureau (1) remain explicitly sparse. Numeric validation bounds, age mapping, fitted neighborhoods, rare-neighborhood grouping and immutable preprocessing remain visible without changing the model.

`Évaluation non documentée` remains intentional: `independent_test_metrics` is null in the verified metadata. Academic approval is documented separately. Training diagnostics cannot be promoted to independent test accuracy. `Non vérifié` for deployment also remains intentional: a registration/public flag or local artifact hash is not evidence of the deployed service's availability. `trained_at` is null; no date was invented.

## SQL

**No manual SQL UPDATE is required. No SQL was executed.** The live post-restart check confirms the database artifact path already equals the verified artifact, and the correct identity/version/architecture/public authorization are present. Missing documentary fields in the old response were caused by obsolete running application code, not absent Supabase metadata.

## Verification

- `npm run test:admin`: 29/29 passed, including the new protected API → React render tests and existing operational pipelines. Existing compatible CPU runtime selected via `MDL_TEST_PYTHON=outputs/admin-data/runtime/Scripts/python.exe`; no dependency or model changes.
- Focused `model-details-integration.test.ts`: 2/2 passed after the final fixture adjustment.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed, no warnings/errors.
- `npm run build`: passed; current production server restored on port 3000.
- Live check at 2026-10-16 16:30 UTC: Casablanca, Marrakech and Rabat all resolved their own model details, artifacts and exact input counts (10, 8, 8 respectively). Evidence: `outputs/rabat-admin-market/model-fix-live-check.json`.
- Normal browser Admin sign-in, Rabat filter, opening the existing model panel and the Actualiser action verified against the restarted port-3000 application. Screenshot: `outputs/rabat-admin-market/rabat-admin-model-fix.png`.
- No model, preprocessing manifest, dataset, backend inference, Supabase migration, UI design, commit, push or deployment changes.

