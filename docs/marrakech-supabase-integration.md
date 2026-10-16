# Marrakech Supabase registration

## Verified database comparison (2026-10-16, read-only)

The configured Supabase database already contains Casablanca (`cities.id=1`,
`model_versions.id=1`) and Marrakech (`cities.id=3`, `model_versions.id=2`).
Marrakech is registered as `marrakech-stacking-v1`, identity
`marrakech-stacking-alae`, architecture `StackingRegressor`, artifact
`models/marrakech/v1/model.pkl`. Its region is `Marrakech-Safi`.

Both cities already have public city/model flags enabled. This is existing state,
not authorization to enable them elsewhere. Marrakech's `metrics` is SQL NULL;
Casablanca has notebook-reported metrics. Both `trained_at` values are NULL.
No missing city/model relationship or additional schema change was found.

Verified constraints include `cities UNIQUE(slug)`,
`model_versions UNIQUE(city_id,version)`, `model_versions UNIQUE(id,city_id)`,
and the composite event foreign key `(model_version_id,city_id)` to
`model_versions(id,city_id)`. Existing foreign keys already protect ownership.

## Manual migration

`supabase/migrations/marrakech_admin_integration.sql` has **not been executed**.
It targets the inspected schema after migrations 001–006; it does not require or
execute the public activation in 007. Copy the complete file into Supabase SQL
Editor as the database owner and run it yourself.

It creates missing registrations with public flags **false**, resolves IDs by
slug/version, preserves existing flags and IDs, fills missing technical fields,
and adds metadata from `models/marrakech/v1/metadata.json`. Existing JSON keys
take precedence. Conflicting artifact identities/paths/architectures or a
non-object metrics value cause the transaction to fail without partial changes.
Reruns do not duplicate registrations or rewrite already populated rows.
Lock and statement timeouts bound blocking; on any error, issue `ROLLBACK;`
before retrying after resolving the cause.

The four metrics retain their original names and evaluation scope: notebook
holdout results before the serialized stack's final full-cohort refit, not an
independent evaluation of production accuracy. No RMSE or training date is
invented. No DDL, policy, role, RPC, user, event, passport or Casablanca update
is included. Existing status and activation flags are never updated.

## Admin already uses the actual database

`lib/admin/db.ts` connects server-side through `POSTGRES_URL`.
`lib/admin/analytics.ts:getOverview` selects `mv.metrics` from
`public.model_versions` joined to `public.cities`; `getEstimations` joins real
events with their owning city/model and saved passports. The authenticated
`/api/admin/model?cityId=…`, overview, estimation and report routes share this
implementation for both cities. There is no separate Marrakech frontend store
to replace or new writer to introduce.

The UI also labels repository-sourced notebook documentation independently.
Seeing those metrics in the UI alone does not prove the SQL was applied; inspect
the API's `models[].metrics` or run the query below. No UI or query change is
needed to consume the newly populated database JSON.

## Verification after manual application

```sql
SELECT c.id AS city_id, c.slug, c.name, c.region, c.public_enabled,
       m.id AS model_version_id, m.version, m.model_identity,
       m.architecture, m.artifact_path, m.status,
       m.public_inference_enabled, m.trained_at, m.metrics,
       (SELECT count(*) FROM public.estimation_events e
        WHERE e.city_id = c.id AND e.model_version_id = m.id
          AND e.is_test = false) AS recorded_estimations,
       (SELECT count(*) FROM public.estimation_events e
        JOIN public.estimation_passports p ON p.estimation_event_id = e.id
        WHERE e.city_id = c.id AND e.model_version_id = m.id
          AND e.is_test = false) AS saved_results
FROM public.cities c
JOIN public.model_versions m ON m.city_id = c.id
WHERE (c.slug = 'casablanca' AND m.version = 'casablanca-catboost-v1')
   OR (c.slug = 'marrakech' AND m.version = 'marrakech-stacking-v1')
ORDER BY c.slug;
```

Run this SELECT before and after application to compare IDs, flags, dates and
event counts. Expected change on the inspected database: only Marrakech's
`metrics` gains the documented metadata. Counts can independently increase if
real users submit estimates meanwhile.

In `/admin`, select Marrakech and the **all-time** period. Confirm its registered
model and existing estimation rows; inspect authenticated
`/api/admin/model?cityId=<city_id returned above>` for populated database metrics.
Compare all-time estimation and saved-result totals to the SELECT. Switch to
Casablanca and confirm its model/history still appear. Refresh to reread the DB;
no deployment or new production estimate is required.

## Validation performed

- Read-only live schema/constraint/registry inspection; no migration execution.
- Read-only live SQL aggregates matched authenticated Admin APIs: Casablanca 20
  and Marrakech 2 non-test estimations, matching charts and city isolation.
- `npm run test:admin`: 25/25 passed. Existing tests use isolated databases;
  they do not load or execute this new migration.
- `npx tsc --noEmit`, `npm run lint`, and `git diff --check`: passed.
- Read the SQL metadata as text and compared its four performance/provenance
  fields plus identity/version/architecture/path to the checked-in manifest.

The new SQL was reviewed but deliberately not executed, including in a test
database, respecting the manual-application request. Idempotence follows from
the verified unique constraints, scoped registration checks, row locks and
updates that skip unchanged values; it has not been established by running it.
