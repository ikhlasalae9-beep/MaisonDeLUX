# Rabat Admin training diagnostics

The existing Admin now reads `model_versions.metrics.training_diagnostics` through its unchanged Supabase-backed overview/model queries. The Rabat-only section **Diagnostics sur données d'entraînement** reuses the existing performance KPI card classes and responsive grid. Values are never hardcoded in React or supplied from the model metadata as a fallback.

The stored object was verified through authenticated Admin GET endpoints before editing:

- `scope`: `training_set_resubstitution`
- `independent_test`: false
- `sample_count`: 700
- `source`: `docs/rabat-model-audit.md`
- `r2_mad`: 0.9521408362
- `mae_mad`: 673900.58
- `rmse_mad`: 1546508.58
- `median_ape_percent`: 5.59955208

The values match the existing audit's resubstitution results for the frozen Random Forest. The UI identifies all four cards as training diagnostics, shows the database sample count and source, and explains that these observations were used to fit the model. Independent test evaluation remains unavailable. Model metadata, fitted preprocessing, model artifact, public policy and other cities are unchanged.

The parser accepts only the exact Rabat version and an explicitly training-scoped database object, with false independent-test flag, positive integer sample count, source and four finite valid numeric values. Missing/incomplete/malformed records produce an unavailable state rather than zeros or documentary fallbacks. Negative R² is accepted as a valid diagnostic; impossible R² above 1 and negative errors are rejected.

Files changed for this request:

- `lib/admin/model-performance.ts`: typed database-only training diagnostics parser; existing independent metrics function unchanged.
- `components/admin/AdminDashboard.tsx`: dedicated labelled section using the existing KPI card design.
- `tests/admin/model-details-integration.test.ts`: actual isolated SQL → protected API → detail-render tests, changed database values, missing record and other-city regression checks.
- `tests/admin/training-diagnostics.test.ts`: scope/numeric validation, no manifest fallback and separation from independent evaluation.
- `docs/rabat-admin-training-diagnostics.md`: this report.

Validation: focused tests 4/4 passed; full Admin suite 31/31 passed with the existing compatible CPU runtime. TypeScript passed. Final production build and actual port-3000 browser verification are recorded below after completion.

No Supabase SQL was executed. The record already exists, so no SQL update is needed. No training, model changes, commit or deployment.

Final verification:

- Production build passed, including TypeScript and lint checks. An initial lint failure on the heading's literal apostrophe was corrected using JSX entity escaping; the displayed title and test assertions remain unchanged.
- Full Admin tests: 31/31 passed; focused parser/API/render tests: 4/4 passed after the final JSX correction.
- The actual Next production process on port 3000 was restarted with the successful build and left running.
- Existing live mapping checker passed for Casablanca, Marrakech and Rabat.
- Browser verification at `http://localhost:3000/admin`: normal existing Admin session, Rabat filter, model details, Actualiser. Server read time after refresh: 2026-10-16 17:10:52 UTC. All four displayed values match the real database record; sample count 700 and audit source are visible. Independent evaluation still shows Évaluation non documentée.
- Screenshot: `outputs/rabat-admin-market/rabat-training-diagnostics.png`.
- No model/manifest/dataset or Supabase files were changed. No SQL update is required or was executed against Supabase.
