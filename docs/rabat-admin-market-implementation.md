# Rabat Admin and Market — final implementation

## Implemented behavior

Rabat Admin keeps the existing dashboard cards, navigation, filters, protected API, PostgreSQL/Supabase queries, user/security data, estimation events and passports. Its model detail now shows the actual database artifact path alongside the verified project path, RandomForestRegressor architecture and 500 trees, version, eight fitted input fields, numeric validation bounds, age-band conversion, fitted neighborhoods and rare-neighborhood mapping. Fitted property categories and the application's accepted public categories are labelled separately. Both currently contain appartement, bureau, maison, studio and villa; bureau (1 observation) and studio (2) remain explicitly sparse. No model artifact, manifest, inference logic or public permission was changed.

Rabat performance cards accept only `metadata.json`'s independently documented test metrics (currently null). Database training diagnostics cannot fall through into the performance cards. Academic approval, database registration, database public authorization, historical package status and deployment verification remain distinct. A local artifact hash check does not assert deployed service availability.

Rabat Market is enabled in the existing city capabilities and sitemap at `/fr/cities/rabat/market` and `/ar/cities/rabat/market`. It reuses the actual Marrakech interactive composition and shared Hero, KPI cards, map explorer, highlights, chart cards and neighborhood table. Marrakech remains the default branch, preserving its behavior; Casablanca retains its renderer. Rabat's mixed property distribution replaces the apartment-only surface chart in the same chart slot. Search, descending sort, highlight-to-search, chart ordering, accessible values tables and keyboard-operable map selection are retained. There is no technical source badge or standalone methodology section.

## Dataset validation and limits

`scripts/build_rabat_market.py` reproduces the audited notebook preparation without loading a model, fitting anything or modifying either CSV. The reproduced selected columns, values and order must equal the supplied clean CSV before a snapshot is written. Retained raw listing IDs supply unique provenance; original neighborhood labels remain intact (no model `Autre` grouping in Market).

| Stage | Rows |
|---|---:|
| Original CSV | 1,165 |
| Bounds | 1,015 |
| Required fields complete | 880 |
| Selected-column deduplication | 857 |
| Per-type price/m² IQR filter | 700 |

The server validates positive finite values, unique IDs, valid types and the pinned snapshot SHA-256. The snapshot records both input file hashes. Rebuilding a changed cohort requires reviewing/updating the snapshot integrity pin and geographic evidence hashes intentionally.

Verified KPIs: 700 observations; median asking price MAD 3,800,000; median of individual listing price/area ratios MAD 15,923/m²; mean declared area 519.8 m²; 33 original location labels. Types: 386 apartments, 276 villas, 35 houses, 2 studios, 1 office. Sixteen location labels meet the inclusive minimum of eight observations for the neighborhood comparison table; 17 are suppressed there. Histograms, overall KPIs and property counts use all 700 observations.

These are the source-labelled Rabat modelling cohort, not a geographically exhaustive or representative city sample. The dataset includes unresolved peripheral labels (including Skhirat and Guich Oudaya) and generic `Rabat`; they are retained transparently as original labels but never allocated to map areas. Publication/collection dates and a reliable transaction or sale/rental status are absent. No dates, growth, transactions, live-data claims or independent model accuracy were invented. Mixed property composition and the preparation filters influence medians; the Hero states the cohort limitation.

## Geographic coverage

The existing `public/maps/rabat-boundaries.geojson` provides five OSM administrative Polygon/MultiPolygon features at level 10, with HCP identifiers. Five helper points are excluded. Geometry is unchanged.

Reviewed exact-name GeoNames points from the project's imported [GeoNames Morocco extract](https://download.geonames.org/export/dump/MA.zip) are packaged separately in `data/geographic/rabat-market-reference-points.json`, with original layer hash, identifiers, coordinates and CC BY 4.0 attribution. This small tracked extract avoids depending at runtime on the ignored full geographic layer. `rabat-market-crosswalk.json` pins the snapshot, boundary and point-extract hashes. Runtime validation checks exact name, Rabat parent, unique point identity and unique point-in-polygon containment, including holes. No nearest-city matching or fuzzy aliases are used.

| Source label | GeoNames ID | OSM arrondissement | Listings |
|---|---|---|---:|
| Agdal | 2561545 | Agdal-Riyad, relation/2799211 | 107 |
| El Youssoufia | 8431710 | El Youssoufia, relation/2799204 | 5 |
| Hay Nahda | 10919013 | El Youssoufia, relation/2799204 | 13 |

The map pools individual listing ratios: Agdal-Riyad's covered cohort has median MAD 17,857/m² (107); El Youssoufia's covered cohort MAD 12,407/m² (18). Both exceed the minimum of eight. Total attribution is 125/700 (17.9%); 575 observations remain unassigned. Hassan, Souissi and Yacoub El Mansour are hatched neutral with no published price. Even a same-looking broad label such as Souissi is not automatically accepted. The exact-label rule deliberately leaves spelling variants and multi-area labels unresolved.

These are neighborhood-reference-point attributions, not individual listing coordinates or proof of complete arrondissement coverage. The visible map states this and reports mapped/unmapped counts. Quantile classes and the MAD/m² legend depend only on eligible observed medians, never the arrondissement name.

Official geography was also investigated through the [AURS geoportal description](https://aurs.org.ma/fr/lese-services/geoportail/) and [DGI Rabat reference](https://www.finances.gov.ma/Publication/dgi/2016/referentiel_rabat.pdf). Full retrieval timed out, so no additional neighborhood mapping or prices were inferred from them. GeoNames online pages were unavailable to the web tool; the hashed existing project import is the reproducible evidence used here. Extending coverage requires reviewing additional authoritative label/boundary evidence.

## Live Admin evidence and SQL

Authenticated local Admin GET endpoints were checked on 2026-10-16 at 14:23 UTC, against the configured real Supabase-backed queries. No direct production SQL or public prediction request was submitted. Rabat city ID 4, model ID 3: `rabat-random-forest-v1`, architecture `RandomForestRegressor`, artifact `models/rabat/v1/model.joblib`, identity `rabat-random-forest`, status `registered`, public inference authorized. Both artifact/preprocessing hashes matched the verified package.

Rabat filter returned two non-test estimation events and two saved results. Overview total, activity-chart total and estimation-table total were all two; returned event city IDs were exclusively Rabat. Casablanca and Marrakech were queried separately through the same endpoints. Evidence with documentary model metadata and safe aggregate totals is local in `outputs/rabat-admin-market/live-admin.json`; no credentials or input payloads were exported.

**No database repair SQL or manual migration is required for the verified live records. No migration was executed.** Optional read-only verification for the user's SQL Editor:

```sql
SELECT c.id AS city_id, c.slug, mv.id AS model_id, mv.version,
       mv.architecture, mv.artifact_path, mv.model_identity,
       mv.status, mv.public_inference_enabled,
       COUNT(e.id) FILTER (WHERE e.is_test = false) AS estimation_events,
       COUNT(p.estimation_event_id) FILTER (WHERE e.is_test = false) AS saved_results
FROM public.cities c
JOIN public.model_versions mv ON mv.city_id = c.id
LEFT JOIN public.estimation_events e
  ON e.city_id = c.id AND e.model_version_id = mv.id
LEFT JOIN public.estimation_passports p ON p.estimation_event_id = e.id
WHERE c.slug = 'rabat' AND mv.version = 'rabat-random-forest-v1'
GROUP BY c.id, c.slug, mv.id, mv.version, mv.architecture,
         mv.artifact_path, mv.model_identity, mv.status, mv.public_inference_enabled;
```

To inspect Admin, select Rabat and the all-time period, open Models → `rabat-random-forest-v1`, then use its existing city/estimation navigation. Registration and public flags come from Supabase; fitted specification comes from the immutable verified manifests. No metrics card should show a training R².

## Verification

Validation results and browser artifacts are recorded below after final checks. No commit, push, merge, deployment, production migration, model modification or dataset modification was performed.


Final results:

- `npm run test:market`: **23/23 passed** (including deterministic Rabat reproduction, medians, geographic attribution, invalid input/duplicates, thresholds and existing city checks).
- `npm run test:admin`: **27/27 passed**, using `MDL_TEST_PYTHON=outputs/admin-data/runtime/Scripts/python.exe` for existing real CPU-inference tests. The default global runtime initially failed Marrakech/Rabat inference tests because its dependencies differ; no model behavior was changed to accommodate it.
- `npm run test:security`: **115/115 passed**, including Admin, authentication, security, persistence, passports and Casablanca/Marrakech frontend regressions. Tests expecting Rabat Market to remain unpublished were intentionally updated. One test initially assumed Arabic digits instead of the existing ar-MA formatter; corrected to accept the actual locale output.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed, zero warnings/errors.
- `npm run build`: passed, all 43 static pages generated, including FR/AR Rabat Market. Initial attempts encountered a running Next dev server sharing `.next`, followed by a generated type-cache backup under the compiler include glob. Stopping the dev server and removing only that generated backup's types resolved both; source configuration was not weakened.
- `git diff --check`: passed. No changes under `models/`, `ml/notebooks/`, `backend/` or `supabase/`.
- Rendered Casablanca/Marrakech/Rabat desktop pages were compared; screenshots are in `outputs/rabat-admin-market/`. Rabat Market FR/AR light/dark at 1280×960 and 390×844: no page-level horizontal overflow; internal table scrolling retained. Search/highlight reset, ordering, map selection and accessible table values verified. The production build was used for the final responsive checks.
- Live Admin normal sign-in, Rabat/all-time filtering and model-detail navigation verified in browser; real metadata and absence of misleading performance cards confirmed. Desktop/mobile and light/dark Admin layouts checked without page-level overflow. Admin retains its existing French interface; no new Arabic Admin translation was introduced.
- Browser failure during server restart required a fresh temporary tab; this was a tooling/navigation state issue, not an application change. The shared public header theme buttons keep separate local state across desktop/mobile instances, so their accessible action label can temporarily lag after changing viewport; the actual document theme was checked in every case. This existing shared-header issue was left outside the requested Rabat scope.

No functional implementation or database activation blocker remains for this scope. Limits: 575/700 map-unassigned observations; no listing coordinates or observation dates; source-labelled/peripheral locations and modelling-cohort bias; no documented independent holdout performance; deployed service health is not inferred from database flags. These limits are visible or documented without substituting fabricated values.

## Modified files

- `.gitignore` — include only the two reviewed small Rabat geography JSON files.
- `app/[locale]/cities/[citySlug]/market/page.tsx` — Rabat data routing and fail-closed shared composition.
- `components/admin/AdminDashboard.tsx` — Rabat details and independent performance policy.
- `components/market/MarrakechMarketIntelligence.tsx` — parameterize the actual existing composition for Rabat; Marrakech defaults preserved.
- `components/market/CityMarketMap.tsx` — reuse the same explorer for Rabat.
- `components/market/MarketMapExplorer.tsx` — avoid incorrectly attributing Rabat to the Commune de Marrakech.
- `config/cities.config.ts`, `config/city-market.ts` — Rabat Market capability and supported map metrics.
- `lib/admin/analytics.ts`, `lib/admin/model.ts`, `lib/admin/model-performance.ts` — actual DB artifact/identity fields, verified documentary contract and training-metric protection.
- `lib/analytics/registry.ts`, `lib/analytics/market-map.ts`, `lib/analytics/rabat.ts`, `lib/analytics/rabat-geography.ts` — validated city data and conservative geography.
- `scripts/build_rabat_market.py`, `server-data/rabat-market.json` — deterministic preparation and reviewed snapshot.
- `data/geographic/rabat-market-crosswalk.json`, `data/geographic/rabat-market-reference-points.json` — pinned evidence and attribution.
- `package.json` — include Rabat provider/geography tests in the Market command.
- `tests/rabat-market.test.ts`, `tests/admin/rabat-metadata.test.ts` — real statistics and metadata safeguards.
- `tests/frontend/city-market.test.ts`, `tests/frontend/city-template.test.ts`, `tests/frontend/marrakech.test.ts`, `tests/frontend/rabat.test.ts` — update intentionally changed Rabat availability and preserve other-city assertions.
- `docs/rabat-admin-market-implementation.md` — this report, optional verification SQL and limitations.
