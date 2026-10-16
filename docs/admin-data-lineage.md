# Admin data lineage — Casablanca and Marrakech

Audit date: 16 October 2026. This matrix describes the production application paths, not test fixtures. Companion evidence and scenarios: [admin-real-data-verification.md](admin-real-data-verification.md).

## Reading the matrix

* **D**: dynamic database read. `readAt` is the server response's completed read time, not an event timestamp or deployment health check.
* **H**: historical file/reference. A request may recompute or retrieve reference calculations; it does not ingest new listings.
* **C**: documented configuration, release metadata or presentation policy. It is not an observed operational measurement.
* **U**: unavailable/unverified; never replaced with a fictional number or healthy status.
* **F**: `period`, `cityId`, `modelId`, `includeTests`; non-test events by default. Database filtering binds `e.city_id` and `e.model_version_id`, not displayed city names. Search and page apply to the estimation table/count in addition to F.
* **G**: global, independent of selected city/model/period. **City-all-time**: non-test city event count independent of the period selector.

The live database timezone is UTC. `today` uses `e.created_at >= CURRENT_DATE`; other finite periods use the bound rolling day interval. Currency formatting rounds to whole MAD; areas retain the established formatting. A rounded displayed mean is not a different source statistic.

## Operational overview and city management

All rows below render in `components/admin/AdminDashboard.tsx`. Data comes from `/api/admin/overview` → `getOverview` in `lib/admin/analytics.ts` → the existing PostgreSQL server adapter in `lib/admin/db.ts`.

| Display / field | Actual source | Query / calculation | Scope | Type / freshness |
|---|---|---|---|---|
| Villes enregistrées / platform.registered_cities | public.cities | COUNT(*) | G | D; new server read |
| Versions de modèles / registered_models | public.model_versions | COUNT(*) | G | D |
| Villes avec modèle / cities_with_models | model_versions.city_id | COUNT(DISTINCT city_id) | G | D |
| Autorisations publiques / public_models | model_versions.public_inference_enabled | COUNT(*) WHERE true; counts model permissions, not inference requests or reachable deployments | G | D |
| Estimations enregistrées / recorded_estimations | public.estimation_events | COUNT(*) WHERE is_test=false | G | D; includes historical rows, not exclusively saved passports |
| Période sélectionnée / kpis.total | estimation_events | COUNT(*) with F | F | D |
| Latest event timestamp / kpis.latest_event_at | estimation_events.created_at | MAX(created_at) with F | F | D; event creation time, distinct from readAt; null when empty |
| Internal today/seven/thirty counts, PDF thirty | estimation_events.created_at | COUNT FILTER calendar day / 7 / 30 days, intersected with F | F | D; not separate frontend growth series |
| État opérationnel des villes: names/region/publication | cities | SELECT id,slug,name,region,public_enabled | Selected city; city list scoped to model when selected | D; publication permission does not prove inference health |
| City card model count | cities LEFT JOIN model_versions | COUNT(DISTINCT mv.id) | City-all-time registry | D |
| City card / detail registered event count | cities LEFT JOIN estimation_events | COUNT(DISTINCT e.id) FILTER is_test=false | City-all-time | D |
| City detail Modèles enregistrés / versions associées | returned model rows with matching city_id | Array length of the server-scoped registry rows | City and model selection | D |
| City detail Approbations documentées | model rows + lib/admin/model.ts | Count documented academicApproval.status=approved | City and model selection | C documentary evidence; not independently recomputed validation |
| City detail Autorisations publiques | model_versions.public_inference_enabled | Count true in matching city models | City and model selection | D; permission only |
| City registered / nonregistered model badge | returned model rows | Presence of model rows | City | D; no availability claim |
| City academic badge | lib/admin/model.ts documentary registry | Documented approval exists | City | C; explicitly labelled documentary |
| City public-inference badge | model_versions flag | Authorized/not authorized in database | City | D; no longer “active service” |
| Référentiel projet connecté | config/cities.config.ts | City slug membership in CITY_REGISTRY | City slug | C; code configuration, not live DB connectivity |
| City technical ID / slug | cities.id / slug | Selected database row values | City | D |
| Jeu d’entraînement en base: Non connecté | Existing architecture | No connected training-table reader in this product | City | U; does not imply zero training rows |
| Activité récente: city, price, date | estimation_events JOIN cities JOIN model_versions | Six latest rows ordered by created_at DESC; model and city ownership joined | F | D; recorded events, not online-user sessions |
| Activité des estimations chart | estimation_events | TO_CHAR(DATE(created_at)), COUNT(*), group/order by day | F | D |
| Activité par ville chart | estimation_events JOIN cities | COUNT(*) GROUP BY city id/name | F | D |
| Activité par modèle chart | estimation_events JOIN model_versions | COUNT(*) GROUP BY model id/version | F | D |
| Price histogram in API / PDF | estimation_events.estimated_price_mad | CASE buckets `<500k`, `500k–1M`, `1M–1.5M`, `1.5M–2M`, `2M–3M`, `3M+`, COUNT(*) | F | D counts; C bin edges |
| Scatter data in existing API | input_features.area, estimated_price_mad, city | Latest 500 rows, numeric surface and price | F | D; currently not an extra chart in Admin UI |
| City/model selector options | cities and model_versions | Global SELECTs; client narrows model options by owning city ID | G options | D; not hardcoded city activity |
| Lecture serveur | Response readAt | Server ISO timestamp after successful reads; seconds/timezone formatted in client | Current view/request | D read freshness; failed refresh never stamps a new successful read |

## Estimation table, counts and exports

The `Estimations` renderer uses `/api/admin/estimations` → `getEstimations`, plus the filtered overview KPIs. The public estimator does **not** call the dormant legacy `logEstimation` helper: its actual persistence path is documented below.

| Display / field | Actual source | Query / calculation | Scope | Type / freshness |
|---|---|---|---|---|
| Résultats filtrés and footer result count | estimation_events JOIN cities | COUNT(*) with F and bound ILIKE search | F + search | D |
| Prix moyen | estimation_events.estimated_price_mad | AVG(...), double precision | F; search does not change this period summary | D model-output values, not observed transaction prices |
| Prix médian | same | percentile_cont(0.5) WITHIN GROUP | F | D |
| Surface moyenne | input_features->>'area' | AVG(NULLIF(...,'')::double precision) | F | D |
| Saved-result summary in description / kpis.saved_results | estimation_passports linked by estimation_event_id | COUNT event rows with EXISTS matching saved result | F, not text-search scope | D; establishes saved-result coverage, not a complete attempt log |
| Date column | estimation_events.created_at | Selected row timestamp | F + search + page | D |
| Ville column/navigation | cities.name/id | JOIN c.id=e.city_id | Same | D; name is presentation, ID controls navigation/filtering |
| Version column | model_versions.version | JOIN mv.id=e.model_version_id AND mv.city_id=e.city_id | Same | D |
| Entrées enregistrées | estimation_events.input_features | Existing first-five-field display; stored JSON | Same | D; no contact/account identity selected |
| Prix estimé column | estimation_events.estimated_price_mad | Stored numeric value formatted as MAD | Same | D |
| Event badge: Test | estimation_events.is_test | true | Same | D classification |
| Event badge: Résultat sauvegardé | LEFT JOIN estimation_passports | p.estimation_event_id IS NOT NULL | Same | D; result exists, without inventing a health/accuracy score |
| Event badge: Historique sans résultat sauvegardé | same | No matching saved result; is_test=false | Same | D historical/legacy record; no claim that current pipeline completed it |
| Page number / enabled arrows | Client page and DB total | LIMIT 20 OFFSET (page-1)*20; next enabled only if page*20 < total | F + search | D total + C page-size policy; chronological order preserved |
| CSV | Current API page rows | Existing escaped serialization of date/city/version/price/test/features | Current page | D snapshot of visible page; no synthetic extra rows |
| PDF summary/profile | getOverview result | k.total, AVG/median price, mean surface, distinct event cities, thirty count; returned model count | F; model count is registry coverage | D |
| PDF territory volumes | activityByCity mapped to returned cities | Filtered event count per city (not all-time city registry counts) | F | D |
| PDF model/status/evaluation | Selected scoped model + DB metrics | Registered architecture/version/status/permission; existing r2/MAE/RMSE fields if present | City/model filters | D registry; C documented evaluation; no deployment-health claim |

## Model cards, details and status

The shared `Models`, `ModelDetail`, `Lifecycle` components consume model rows enriched by `getOverview`. `/api/admin/model` uses the same provider and now accepts the city ID; it also returns a read error instead of an empty model list when unavailable.

| Display / field | Real source and calculation | Scope | Classification / timestamp |
|---|---|---|---|
| Version, architecture, registered status | model_versions.version/architecture/status, JOIN city_id | Selected city/model | D registry; not an inferred training/deployment state |
| Owning city | cities.id/name/slug | FK model_versions.city_id | D |
| Public authorization | model_versions.public_inference_enabled | Matching model | D permission flag; neither file existence nor Market data enables it |
| Training date | model_versions.trained_at | Matching model | D date if present, otherwise U “Non documenté”; both live rows currently null |
| Service deployment | No verified deployment-health reader connected | Matching model | U “Non vérifié”, also explicit in the server model response |
| Academic approval label/count | lib/admin/model.ts | Version-keyed project documentation | C documentary claim, not database validation or current performance |
| Artifact path / input fields / property types | models/{city}/v1 metadata and preprocessing, exposed through documentary registry | Exact model version | C release documentation; prepared Marrakech fields differ from Casablanca application inputs |
| Casablanca R² train/test, RMSE/MAE | metadata.notebook_reported_metrics; DB metrics fallback for undocumented models | Exact version | C historical reported evaluation, not independently verified production accuracy |
| Marrakech R² log/MAD, MAE/MAPE | Marrakech metadata.notebook_reported_metrics and metrics_scope | Exact version | C historical 746/187 holdout before final refit; metrics not independently recomputed |
| Marrakech integrity | model-integrity.ts SHA-256 over actual model.pkl and preprocessing.json bytes versus release metadata | Exact version | D local file check on read; does not deserialize or call a deployed service |
| Documentation lifecycle marker | Artifact-backed documentary registry present | Version | C documentation exists, not completed production preparation |
| Artifact lifecycle marker | Integrity checker reports artifact=true | Version | D file identity only; U when no checker is connected |
| Training lifecycle marker | trained_at present | Version | D/U as above |
| Registration lifecycle marker | status='registered' | Version | D |
| Public authorization lifecycle marker | public_inference_enabled | Version | D |
| Deployment and accuracy monitoring lifecycle markers | No health/ground-truth source connected | Version | U; no flag-to-deployment shortcut |
| Version history date / version displayed | model_versions.created_at/version/id | Same city, filtered registry | D registry history; not a fabricated training date |

The release metadata's old packaging/public_enabled values are historical documentation. They never override actual database permission or prove current service readiness. Local CPU tests verify model compatibility/persistence, not remote deployment availability or model accuracy.

## Historical Market summary and quality

`DatasetSummary` and `DataQualityPanel` reuse the established providers through `/api/admin/data-intelligence?city=casablanca|marrakech`. The endpoint validates its city whitelist **after** admin authorization. Other cities receive no Casablanca placeholder. The dashboard derives this slug from the selected database city ID, or the selected model's owning city ID.

| Display / field | Authoritative source / calculation | Denominator / city | Type / freshness |
|---|---|---|---|
| Historical source / retained / represented counts in overview/detail | quality.totalRows / usableRows / neighborhoodCoverage.distinct from existing providers | Selected city cohort | H, never estimation activity |
| Retention rate | usableRows / totalRows * 100 | Same source cohort | H |
| Casablanca source / usable rows | server-data/casablanca-market.csv, parseCsv and existing usable-row checks in analytics/casablanca.ts | 1,172 source and usable reference rows | H; process-cached reference, not auto-ingestion |
| Casablanca exact duplicates | source.length - size of Set over ten raw reference-column signatures | Raw CSV | H; currently zero |
| Casablanca missing raw fields | Empty-string tests on Type,Localisation,Price,Area,Rooms,Bedrooms,Bathrooms,Floor,Other_tags,Price_m2 | Raw CSV | H |
| Casablanca missing Current_state / Age | No accepted category extracted from Other_tags | Usable reference rows | H; distinct derived-field denominator, not raw-column absence |
| Casablanca validity counters | Nonpositive Price/Area/Price_m2; finite and 1–10 room/bed/bath range; 0–10 floor range | Raw CSV; overlapping checks, not exclusive rejections | H |
| Casablanca numeric table N/min/P5/median/P95/max/mean | Existing linear-quantile distribution for area,rooms,bedrooms,bathrooms,floor | Usable reference rows, field finite values | H |
| Casablanca type chart | Existing normalized propertyType frequencies | Usable rows | H |
| Casablanca neighborhood coverage / model manifest coverage | Distinct usable neighborhood names, intersection/difference with approved preprocessing Localisation.accepted | Usable rows / model manifest | H + C manifest |
| Marrakech source / retained rows | Validated server-data/marrakech-market.json sourceRows / validated rows.length | 2,472 / 1,339 | H; read from snapshot, not literals in production UI |
| Marrakech excluded rows | SUM(snapshot.excluded values) | 1,133 source exclusions | H |
| Marrakech exclusion reasons | duplicateRisk=410, unsupportedScope=407, batchAnomaly=301, uncertainOutlier=15, read from provenance | Ordered/exclusive source exclusions | H; duplicate risk is not exact duplicate count |
| Marrakech missing field counts and percentages | snapshot.missing for publication_date,latitude,longitude,url,bedrooms,bathrooms; count/sourceRows*100 | All 2,472 source rows | H |
| Marrakech numeric table N/min/P5/median/P95/max/mean | Original validated row.price, row.area, individual price/area; interpolation at (N-1)*p | All 1,339 retained apartment-sale observations | H; no model target corrections applied |
| Marrakech type chart | snapshot.audit.property_type_repaired frequencies | All 2,472 source rows; retained scope is apartments only | H |
| Marrakech represented neighborhoods | Unique retained neighborhood names | 62 | H |
| Marrakech publication coverage | Existing market provider groups; >=8 versus <8 observations | 30 eligible / 32 suppressed | H; C threshold 8, not model neighborhood recognition |
| Marrakech collection dates | MIN/MAX retained collectedAt | 14 August–1 September 2026 | H collection dates, not publication/ingestion/job completion dates |
| Dataset/source filename | Provider's dataset identity | Selected city | C provenance label inside authorized Admin only |
| Latest request readAt | Server endpoint completion timestamp | Current quality view | D request freshness only; source remains historical |
| Ingestion history / automated update status | No connected authoritative ingestion log reader verified | Neither city | U; no automatic update claim |

## Input monitoring

`InputDriftPanel` → protected intelligence API → `getProductionInputFeatures` joins event city/model FKs, filters `c.slug='casablanca'`, exact model version and is_test=false, newest 5,000 feature records. It then calls the existing `getCasablancaDrift` against the frozen approved reference.

| Display / field | Real calculation/source | Scope | Type / freshness |
|---|---|---|---|
| Entrées enregistrées hors tests | Length of returned non-test event feature objects | Exact Casablanca model, newest 5,000; independent of period/test selector | D recorded-feature sample, not request-attempt denominator |
| Minimum requis | MIN_DRIFT_OBSERVATIONS=30 in existing provider | Casablanca policy | C documented threshold, not invented observation count |
| Methods / thresholds | Existing PSI and total variation implementation; PSI .1/.25, TVD .1/.2 | Casablanca | C policy |
| Numeric feature signals (conditional) | PSI from reference quantile edges versus finite production area,rooms,bedrooms,bathrooms,floor | Same sample, only at threshold | D/H; suppressed below threshold |
| Categorical signals (conditional) | Total variation for normalized property_type,neighborhood,current_state,age | Same sample | D/H |
| Reference/production N, P5–P95 outside share | Actual input arrays and existing quantiles/counts | Per feature | D/H |
| Stable/watch/shift label | Computed PSI/TVD thresholds | Per feature | D-derived descriptive label; not declining accuracy or AI health |
| Marrakech monitoring state | No compatible reference for its actual mixed model training scope is connected | Marrakech | U; Market apartment snapshot is not substituted |
| Current production accuracy | No verified later transaction-price ground truth connected | Both | U; no fabricated accuracy metric |

## Global users and security

`components/admin/UsersSecurity.tsx` → `/api/admin/users-security` → existing server `query`. Queries are authorized and global; no city-filtered user counts or online-session estimates are invented.

| Display | Actual source / query | Scope | Type / freshness |
|---|---|---|---|
| Utilisateurs inscrits | SELECT COUNT(*)::int FROM auth.users | G | D |
| Découvertes utilisées | guest_trials COUNT FILTER trial_consumed_at IS NOT NULL | G | D consumed guest entitlements, not unique website visitors |
| Passeports réclamés | guest_trials COUNT FILTER claimed_at IS NOT NULL | G | D claims, not total saved passports |
| Répartition des rôles | user_roles GROUP BY role, COUNT(*) | G | D; role labels/counts only |
| Inscriptions récentes | auth.users SELECT created_at ORDER BY DESC LIMIT 10 | G | D timestamps only; not a growth percentage or all-time trend |
| Événements de sécurité récents | security_audit_logs SELECT event_type,created_at ORDER BY DESC LIMIT 25 | G | D recorded audit events, not live sessions |
| Security read freshness | Endpoint readAt | G request | D; Actualiser remounts reader, aborts superseded requests |
| Online users / active sessions / growth / conversion / failure rate | No verified applicable source or denominator connected | — | U; not displayed |

## Real public write path and refresh contract

`components/estimation/CasablancaEstimator.tsx` handles both supported cities and calls `predictCasablanca` in `lib/api/client.ts`. That client sends `{input,request_id,locale}` to `/api/estimations`. The protected server route validates the exact city contract, identity, entitlement and rate limits, invokes the signed city-specific gateway, verifies the prediction identity, then calls the existing six-argument `phase_c_complete_estimation` function. Its internal function resolves cities.slug and the owning model identity/version, inserts `estimation_events` **and** `estimation_passports`, and consumes a guest lease transactionally. The locale wrapper updates that event's locale. No schema change was needed.

The Admin reads those same event/passport tables using their IDs. A manually refreshed snapshot always sends `cache:'no-store'`; APIs explicitly return private/no-store. There is no polling or Supabase Realtime subscription, and no promised automatic interval. Opening/changing operational filters or pressing Actualiser initiates a new read; search waits 250 ms. Each client read has a 20-second deadline, after which its view is unavailable rather than indefinitely loading. Caller cancellation aborts superseded requests. Quality is read on relevant navigation/city changes/Actualiser. There is no background ingestion claim.

`currentAdminData` excludes failed or previous-filter snapshots. The loader rejects failed requests, missing database configuration and malformed success responses. Therefore neither a failed query nor an invalid response becomes a zero-valued dashboard. Only successfully queried empty sources display zero. Historical reference data and operational query errors are independent states.
