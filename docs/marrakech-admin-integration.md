# Marrakech admin integration

> Follow-up: [real-data verification](admin-real-data-verification.md) and [complete metric lineage](admin-data-lineage.md) supersede the operational-status and checksum-blocker findings below. This earlier report preserves the evidence from its original integration pass.

Implementation and verification: 16 October 2026. Branch: `main`. The checkout already contained extensive uncommitted Market work; that work was preserved. No commit, deployment, migration, production database write, model activation, training, or authentication/RLS change was performed.

## Result and limits

Marrakech uses the existing `/admin` platform, navigation, city/model selectors, cards, charts, tables, search, pagination, status components, and CSV export. Quality analysis now selects the city's real dataset instead of always returning Casablanca. Operational summaries and PDF reports respect city/model context while global platform totals and security remain global.

The admin implementation is available for manual review. Full regression sign-off remains **BLOCKED** by an existing Marrakech preprocessing checksum mismatch: the real-model integration test fails before inference. The UI reports this mismatch and distinguishes database permission from verified service availability. Fixing model release files is outside this task's authorization.

## Existing product audit

The admin was partially multi-city, with Casablanca-only quality/drift analysis and artifact documentation. It has one client dashboard at `/admin`, not separate city dashboards or nested management routes. Normal development login was used; no authentication bypass or manually injected browser session was used.

| Existing section | Source and actual behavior | Integration |
|---|---|---|
| Overview | `components/admin/AdminDashboard.tsx`, `lib/admin/analytics.ts`, `/api/admin/overview`: five global registry/activity counts, a filtered period count, recent events, daily/city/model charts and city/model links | Same components; city-scoped lists and a separate historical dataset summary |
| Cities & Territories | Shared city cards and CityDetail tabs: overview, registered models, event-history link, technical registry identifiers | Same detail tabs; card navigation establishes city context; historical dataset summary reused |
| Models | Shared cards, evaluation metrics, technical specification, lifecycle and version history; `/api/admin/model` and overview registry query | Marrakech release documentation added; evaluation provenance and physical-file integrity shown separately from database activation |
| Estimations | `/api/admin/estimations`: parameterized city/model/date filters, text search, reverse chronological ordering, 20-row pagination, test-event toggle | Same query/table/export; city context retained during navigation; request cancellation prevents stale responses |
| Data & Quality | `/api/admin/data-intelligence`, `components/admin/DataIntelligencePanels.tsx`: counts, missing fields, validity rules, distributions, type/manifest coverage | Shared rendering extended with accurate Marrakech denominators, exclusions, dates and publication coverage |
| Input monitoring | Casablanca production inputs compared with its reference distributions; PSI/TVD suppressed below 30 observations | Casablanca preserved; Marrakech explicitly unavailable because no compatible monitoring reference is connected |
| Users & Security | `components/admin/UsersSecurity.tsx`, `/api/admin/users-security`: aggregate users, roles, guest trial/passport counts, recent registrations and security events | Remains global; city/model/date selectors disabled here; refresh remounts its existing reader |
| Reports | Existing protected `/api/admin/report` three-page PDF endpoint; CSV button exports the displayed estimation page | PDF now accepts city/model/test filters; territorial volumes use the same filtered event counts |
| Settings / dataset editing | No independent settings, dataset mutation, sorting controls, CRUD dialogs or production refresh workflow found | None invented; Actualiser only repeats reads |

Loading, missing data, database configuration and API-error states were inspected. Initial unavailable data no longer renders fabricated zero-filled operational cards. CSV continues to export the current page, rather than silently promising every search result. Existing chronological ordering is preserved; a new sorting UI was not added.

## Authentication and database audit

`app/admin/page.tsx` calls `requireAdmin` before rendering. Every admin API calls `adminGate` before reading protected data. The existing separate admin identity uses configured credentials and a signed, eight-hour HttpOnly cookie with SameSite=Lax and production Secure. Customer Supabase sessions and role metadata do not substitute for that session. No role/session implementation was changed.

The server's existing PostgreSQL adapter reads `POSTGRES_URL`; it is not sent to the browser. Live discovery used a transaction beginning with `BEGIN READ ONLY`, SELECT statements, and ROLLBACK. No customer records were edited.

Verified relationships:

* `public.cities`: bigint id, slug/name/region, public_enabled, created_at.
* `public.model_versions`: bigint id and city_id, version, architecture, artifact_path, status, public_inference_enabled, metrics JSONB, trained_at, created_at, model_identity.
* `public.estimation_events`: bigint id, city_id, model_version_id, event_key, created_at, input_features JSONB, estimated_price_mad, is_test, user_id, locale.
* Events join both the city and registered model; detail/event queries retain model-to-city ownership conditions.
* Existing event SELECT policies observed: `events_owner_fence` and `events_read_own` for authenticated callers. No policies or grants changed. The existing privileged server adapter remains protected by the application admin gate; no city-specific admin role was introduced.

Observed live state during audit (not hardcoded into the product): Casablanca city id 1, Marrakech city id 3; both published. Each has one registered model with public_inference_enabled=true. Non-test events: Casablanca 20, Marrakech 2, global 22. Marrakech events were recorded on 7 and 12 October. These are persisted successful-estimation records, not a complete request-attempt log. There is no verified request/failure denominator from which to calculate conversion, failure rates or operational accuracy.

Global counts remain global under city selection. Event KPIs, charts, recent records and estimation tables use bound city/model/date parameters. Registry filter options remain global so switching cities remains possible. Returned city/model lists are scoped; therefore a Marrakech PDF cannot silently select Casablanca's first model. City registry event totals are all-time and labelled as registered estimations; period charts and PDF territorial volumes use filtered event totals.

## Dataset and analytical methodology

`lib/analytics/marrakech.ts` continues validating the existing snapshot and retained observations. A new aggregate audit accessor exposes provenance to the protected server provider without returning listing identifiers. `lib/admin/data-intelligence.ts` selects an explicitly supported city. An unsupported city produces HTTP 400 after authorization, rather than falling back to Casablanca. Raw observations and model bytes are never returned by this endpoint.

Current snapshot reconciliation, all calculated/read from the source:

| Marrakech historical dataset | Verified count / scope |
|---|---|
| Source records | 2,472 |
| Retained observations | 1,339 apartment-sale listings |
| Excluded records | 1,133 |
| Exclusive exclusion reasons | 410 duplicate risk; 407 unsupported scope; 301 batch anomaly; 15 uncertain outlier |
| Retention | 1,339 / 2,472 = approximately 54.2% |
| Represented neighborhoods | 62 |
| Meets existing publication minimum | 30 with at least 8 retained observations |
| Below that minimum | 32 |
| Collection dates | 14 August–1 September 2026 |

Important denominator distinctions:

* Exclusion reasons reconcile exactly to excluded rows and are ordered/exclusive; duplicate risk is **not** an exact-duplicate count. The source also reports 470 possible duplicates across the raw cohort; this overlaps other eligibility checks and must not replace the exclusive 410 exclusion count.
* Missing values and type-category counts describe all 2,472 source rows. Missing counts: publication date/latitude/longitude 2,472 each, URL 1,864, bedrooms 2, bathrooms 17. Rates divide by source rows.
* Numeric price, surface and individual price/m² distributions describe the 1,339 retained rows. Quantiles use linear interpolation at `(N - 1) × p`; mean and extrema use those same rows. This does not change public Market statistics.
* Neighborhood publication coverage is not model-category recognition. Marrakech displays publication-eligible and suppressed neighborhood counts instead of inventing manifest coverage.
* Collection dates are not publication dates, transaction dates, a last successful ingestion run, or live usage activity.
* The training cohort and Market apartment-sale cohort are different. No Marrakech drift baseline, production accuracy, model-health score or freshness SLA is fabricated from the Market snapshot.

Casablanca's existing quality calculations and drift minimum are unchanged. Its current dataset contains 1,172 usable reference records and 100 represented neighborhoods. At inspection, its 20 real production inputs remained below the 30-observation drift threshold.

Underlying data preserved, SHA-256:

* Marrakech snapshot: `6f538fb49fa0db745db3872832e41312454fd629cc1c604697d4b97b7705d4b9`.
* Casablanca CSV: `45331a0f1615c6fe3bdd77051e3c4b5e3e5411f43223e2c4eedc2d4443f5bcfe`.

## Marrakech model status and blocker

The database registers `marrakech-stacking-v1`, architecture StackingRegressor, with public inference permitted. This is independent of both the Market dataset and the release metadata's older `certified_for_application_integration_not_publicly_enabled` packaging status.

The admin registry now documents prepared input fields and the actual Appartement/Villa scope from the release manifest. It labels Loc_Type as derived. It does not insert Marrakech into the Casablanca-only legacy event writer or alter the actual entitlement/persistence/inference pipeline.

Notebook-reported evaluation is explicitly not independently recomputed: R² log 0.7276, R² MAD 0.5822, MAE MAD 1,408,655 and median MAPE 17.7%. The recorded scope is the 746/187 holdout before final full-cohort refit. These are not Market-cohort metrics or verified current production accuracy.

`lib/admin/model-integrity.ts` reads file bytes and compares SHA-256 only; it never deserializes a model or runs a prediction. Current artifact hash matches its release metadata. The preprocessing manifest does not:

* Expected: `6c6b38750b0a53a10d4af7896302ff047997bd7a326f758af46ef7af0e939cd1`.
* Actual: `d0ca467c552607592db62da4718356fcc9a9fa7a69f73e83a5bfb2e6b8e82c0f`.
* Normalizing CRLF to LF in memory reproduces the expected hash, but no physical file was normalized, rewritten or accepted by weakening the validator.

The final UI says inference is authorized **in the database**, flags integrity attention and leaves service integration/deployment unverified. No synthetic prediction was sent to the live application, avoiding event/entitlement writes. No model activation/deployment readiness is claimed.

Next file tracing explicitly includes the private snapshot for the protected intelligence route and integrity-check files for model/overview/report routes. Final build traces were inspected to confirm inclusion. These remain server files, not public assets.

## Security validation

Direct unauthenticated local HTTP checks:

| Request | Result |
|---|---|
| `/admin` | 307 to `/admin/login` |
| `/api/admin/overview?cityId=3` | 401 |
| `/api/admin/estimations?cityId=3` | 401 |
| `/api/admin/data-intelligence?city=marrakech` | 401 |
| `/api/admin/model`, `/report?cityId=3`, `/users-security`, `/db-health` | 401 |
| `/server-data/marrakech-market.json` | 404 |
| `/models/marrakech/v1/model.pkl` | 404 |

The quality response uses `Cache-Control: private, no-store`. Tests also check unauthorized city/path-like parameters, authenticated unsupported-city rejection, SQL-bound search input, mismatched city/model selections, and preservation of global-admin visibility. Existing customer/admin separation and real PostgreSQL RLS tests pass.

## Visual and functional comparison

The actual authenticated Casablanca and Marrakech sections were opened repeatedly throughout implementation. Before captures exist for the original shell, city detail, quality/monitoring and global security. Final captures use the local successful production build, with matching 1440×900 desktop and 390×844 mobile viewports, in light and dark modes.

Evidence is local and ignored by Git under `outputs/market-parity/`. The comparison gallery `admin-comparison.html` pairs final city screenshots. Use files prefixed `admin-final-` for delivered UI; earlier `admin-before-*`, `admin-after-*` and `admin-mobile-*` record discovery/intermediate states and may show issues corrected later.

The gallery contains **34 matched pairs**. Its local HTML preview could not be opened by the automated browser because that browser permits only HTTP(S) URLs. No alternative server was created to expose the private captures. Individual application views were inspected in the browser; the saved paired gallery is available for local manual review, with its preview limitation kept separate from those rendered-page comparisons.

| Parity area | Result | Evidence / intentional difference |
|---|---|---|
| Admin shell | PASS | One `/admin` renderer |
| Sidebar | PASS | Same seven sections and responsive menu |
| City switcher | PASS | Shared desktop/mobile selectors; model-only selection also resolves the correct quality city |
| Dashboard KPIs | PASS | Same cards; global totals explicitly distinguished from filtered events and historical dataset counts |
| Charts | PASS | Same Recharts components, city-specific event arrays and quality distributions |
| Tables | PASS | Same event/distribution tables and internal mobile scrolling |
| Filters | PASS | Date/model/city/search/test controls retain their respective scopes |
| Market data | PASS | Casablanca reference versus Marrakech historical apartment-sale cohort, correctly labelled |
| Estimation activity | PASS | Actual 20/2 non-test events, not listing counts |
| Model management | PASS for UI | Same model cards/details; Marrakech runtime readiness remains BLOCKED by integrity mismatch |
| Monitoring | PASS | Casablanca threshold state versus explicitly unavailable Marrakech baseline |
| Security | PASS | Same admin gate; global security remains global |
| Responsiveness | PASS | Matching 1440×900 and 390×844 captures in both themes |

The admin is French-only at the existing unlocalized `/admin` route. Arabic admin navigation/layout does not exist and was not invented. Public Casablanca/Marrakech Market FR/AR routes were separately smoke-checked (HTTP 200), and existing bilingual Market frontend tests pass. Arabic admin parity is unavailable, not claimed.

Browser interactions verified: city selection, model selection/navigation, date selection, sidebar/menu, theme control, event table, text search, no-result state, current-page Marrakech CSV export (two Marrakech rows), global page 2 (two remaining rows), and disabled next-page controls for Casablanca's 20 and Marrakech's 2 rows. A Marrakech search for “Casablanca” legitimately matches its “Route de Casablanca” neighborhood; it is not a cross-city event leak. Model cards/details and city-detail tabs were compared using their shared components. Dataset loading and unavailable monitoring states were observed. API/database errors are sanitized; no production outage was induced to simulate a browser error.

Final interaction evidence also includes today's empty Marrakech event view, a Marrakech model-only filter with all cities selected that still displays Marrakech quality, and the activity-chart tooltip showing one recorded event on 7 October. `admin-review-marrakech.png` is the final desktop viewport capture; `admin-final-marrakech-chart-interaction.png` records the chart interaction.

The shared mobile missing-value panel was corrected to a single column to prevent crowded rates. Mobile filters now use a consistent two-row grid for both cities; desktop retains the original topbar design. Tables retain intentional internal horizontal scrolling.

## Tests and acceptance

| Check | Result |
|---|---|
| `npm run test:admin` | PASS: 16/16, including six new multi-city integration/security/export tests |
| `npm run test:market` | PASS: 20/20 |
| `npm run test:security` | FAIL: 96/97; the existing real Marrakech CPU-model test fails with `Marrakech preprocessing checksum mismatch` |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS, no warnings/errors |
| Final `npm run build` | PASS: compilation, lint, type validation, 39 static pages and build tracing |
| `git diff --check` | PASS |
| Public Market FR/AR smoke | PASS: both cities, four HTTP 200 responses |

The new tests use an isolated in-memory PGlite database and exercise actual SQL; production DB mutation is never used for test fixtures. They cover city/model isolation, unchanged global counts/options, test-event exclusion, date bindings, search, pagination, model ownership, exact quality reconciliation, physical integrity evidence, authentication and the existing three-page PDF response.

| Acceptance criterion | Status and evidence |
|---|---|
| Casablanca admin fully inspected | PASS — actual sections, source, queries, authenticated views and before captures |
| Marrakech integrated into existing architecture | PASS — same dashboard/components/APIs |
| City data correctly scoped | PASS — real SQL integration tests and actual 20/2 event views |
| Shared UI reused | PASS — no independent Marrakech dashboard |
| Validated dashboard KPIs | PASS — snapshot reconciliation; global/filtered/historical denominators distinguished |
| No fictional activity | PASS — only persisted events; no request/failure/conversion metrics invented |
| Model availability accurate | PASS for representation; actual service readiness BLOCKED by existing checksum mismatch |
| Authorization preserved | PASS — page redirect, protected APIs, customer separation and RLS tests |
| City switching | PASS — shared selectors, scoped registry views and stale-request protection |
| Applicable charts/tables | PASS — shared charts, event table, search, paging and exports |
| Visual comparison | PASS — actual matching city screenshots, local paired gallery |
| French/Arabic and themes where supported | PASS — French admin light/dark; Arabic admin unavailable; public Market FR/AR regression passes |
| Desktop/mobile | PASS — 1440×900 / 390×844 checks, shared mobile spacing/control fixes |
| Casablanca regressions excluded | PASS for admin/Market checks; existing overall model failure separately recorded |
| Production build and relevant checks | BLOCKED overall — build/types/lint/admin/Market pass; full security suite is not green |

## Modified files and manual review

Task-specific changes:

* `app/api/admin/data-intelligence/route.ts`
* `app/api/admin/report/route.ts`
* `components/admin/AdminDashboard.tsx`
* `components/admin/DataIntelligencePanels.tsx`
* `lib/admin/analytics.ts`
* `lib/admin/model.ts`
* `lib/admin/data-intelligence.ts` (new)
* `lib/admin/model-integrity.ts` (new)
* `lib/analytics/marrakech.ts` (aggregate audit accessor added to the pre-existing untracked Market implementation)
* `next.config.mjs` (private admin file-tracing additions; pre-existing Market configuration preserved)
* `tests/admin/multi-city.test.ts` (new)
* `docs/marrakech-admin-integration.md` (new)

Manual review: open `/admin` through normal login; switch Casablanca/Marrakech across Overview, Cities, Models, Estimations, Quality and Monitoring. Confirm 1,339 retained historical observations are separate from two recorded Marrakech estimates. Open the Marrakech model integrity disclosure. Check the same views at 390 px and in dark mode, then verify Users & Security remains global. Review the paired screenshots and the failing model-checksum evidence before any separately authorized release repair or deployment decision.
