# Marrakech Market implementation

Current correction: [Strict Casablanca parity report](marrakech-casablanca-parity-report.md) supersedes the earlier presentation decisions below. Marrakech now reuses the actual reference heading, KPI overview, compact neighborhood cards, Recharts cards/grid and six-column table. Phase 1 data and cleaning rules are unchanged; the Phase 2 visual design is retained here only as history.

Audit and local implementation: 15 October 2026. Branch: `main`; initially clean. No branch change, commit, push, merge, deployment, remote database access, schema change, collection, retraining, or new dependency.

## Phase 2 visual and analytical upgrade — current implementation

This section records the subsequent upgrade on top of the uncommitted first implementation. The detailed cohort audit and formulas below remain applicable. Earlier visual descriptions and mobile-verification limitations describe the first implementation; current results are recorded here.

### Journey and design

The hero retains its navy identity and collection/asking-price caveats. The journey is now: hero → five KPI cards with Lucide icons → administrative map → two distributions → two neighborhood bar visualizations → six neighborhood highlights → searchable/sortable full comparison → compact methodology with expandable details → existing city/estimation navigation links.

KPI icons (Database, Building2, BarChart3, Ruler and MapPinned), sizes, spacing, card surfaces and numeric hierarchy follow the Casablanca vocabulary. Values remain provider outputs. Context labels distinguish retained observations, individual price/surface ratios, declared surface and publication coverage. A scoped Jakarta/Arabic font-variable fallback to system sans prevents the inherited invalid font token from forcing serif text on Marrakech; no global or Casablanca typography was edited. Small analytical annotations use the secondary-text token for better contrast in both themes. Cards use a modest hover shadow, visible keyboard focus and no new decorative animation.

### New analytics and interactions

`NeighborhoodInsights.tsx` supplies two HTML horizontal bar charts. Full labels and sample counts wrap naturally on phones, with no narrow SVG category axis. Each has an expandable, structured data table. Bar lengths are relative to the maximum displayed value, explicitly stated; they are not map coverage or statistical confidence.

- **Asking price/m² comparison:** eight published neighborhoods, sorted by the user's selected descending metric (median MAD/m², observation count or median surface). Bar length always represents median asking MAD/m²; every row shows n. The selector changes the ranking/subset only. No values are recomputed from neighborhood medians.
- **Dataset concentration:** six most represented published neighborhoods in actual count order: Guéliz 342, Route Casablanca 140, Agdal 76, Hivernage 74, Samlalia 62, Ennakhil (Palmeraie) 58. Shares use each count divided by **all 1,339 retained observations**, not the subtotal of six or the 1,250 observations in published neighborhoods. They describe the reference dataset, not transaction activity or real-world market share.
- **Six highlights:** four highest-count published neighborhoods, followed by the highest and lowest median asking MAD/m² among the remaining published neighborhoods. In this cohort the additional cards are Riad Al Atlas and Les Portes de Marrakech. The labels and explanation state the exclusion of the first four from the two price selections. Cards include median ratio, median total asking price, n and apartment-sale/historical scope. They do not rate desirability or investment quality.
- **Highlight action:** sets the existing table search to the actual location label, scrolls to the input and moves keyboard focus there. A clear/reset button restores all published results. City KPIs and charts are independent of table filters; the existing notice remains visible.

`lib/analytics/neighborhood-presentation.ts` centralizes accent-insensitive search, deterministic descending sorting and the six-card selection. It reapplies both benchmarkEligible and the numeric minimum at every entry point, so a future incorrectly flagged seven-observation neighborhood cannot appear. Helpers do not mutate provider results. Source records, snapshot bytes, provider formulas, exclusions and model code were not changed in Phase 2.

The existing distribution charts retain their underlying bins and counts. Compact k-axis labels reduce collision, full table/tooltip values remain localized, and axis text uses theme tokens. Neither new analysis uses publication dates, villas, riads, rentals, model predictions or transaction prices.

### Geographic interaction

`CityMarketMap` has an opt-in `administrativeDetails` mode used only by Marrakech. Existing Casablanca/Rabat defaults retain their exact rendered markup. Five verified administrative Polygons remain unchanged; helper Points remain excluded. First available area is selected after loading; mouse, keyboard and accompanying buttons can change the selection. Selected/hovered/focused boundaries get blue fill and a high-contrast outline; the legend describes selection and other administrative boundaries, not price classes.

The context panel uses the existing boundary name, OpenStreetMap relation ID, recorded HCP reference and administrative level. These are attributes of the local geographic file, not new external verification. Population/area figures were not added. The panel explicitly refuses to assign neighborhood prices or listing counts to the administrative boundary without a reviewed crosswalk. A zero-feature geography response is treated as a load failure in this opt-in mode.

### Current validation

- `npm run test:market`: **17/17 passed**. Added independent checks cover the actual count ranking, maximum/minimum selections, unique highlights, search normalization, the eight-observation guard and non-mutation of city aggregates.
- Full existing frontend test selection: **43/43 passed**. Casablanca and Rabat FR/AR body hashes still match their stored baselines; navigation, estimator UI, accounts, discovery, auth-email and exports remain covered.
- TypeScript (`npx tsc --noEmit --incremental false`), `npm run lint`, production build and `git diff --check`: passed. All 39 static pages build; Market first-load JS is approximately 230 KB versus 226 KB before this upgrade. No new dependency or large chart library was added.
- Browser checks on the local production build: 390×844 phone, 768×1024 tablet and desktop; FR/AR; light/dark; full neighborhood names and counts; internal table scroll; chart reorder; highlight filter/focus; reset; empty search; unchanged city KPIs; keyboard map selection; methodology disclosure and accessible data alternatives. Exact final viewport evidence and screenshots are retained under `outputs/market-qa/`.
- The previous browser viewport limitation is resolved in this turn: measured innerWidth changed to 390 and 768 as requested. This is responsive browser validation, not physical-handset or touch-device certification.
- Final browser evidence: page widths / document scroll widths are **390/382**, **768/760** and **1440/1432** pixels; none overflows horizontally. At 768 px both Recharts plots measured 662 px wide. The full comparison table retains its own scroll region. Keyboard activation of the Guéliz highlight produced one result and focused its search field; Ménara's map button updated the administrative context. Desktop price sort places Hivernage first, with n=74 and 24,159 MAD/m². No application console errors/warnings were captured.
- Local ignored review screenshots: `outputs/market-qa/phase2-desktop-dark.png`, `phase2-desktop-light.png`, `phase2-mobile-ar-dark.png`, `phase2-mobile-ar-charts.png` and `phase2-tablet-ar-light.png`.
- The existing missing-data rendering test still passes; map loading was observed and map error handling reviewed. No browser network-failure injection was performed. No formal automated accessibility audit or Core Web Vitals measurement was run.

The first implementation's full security/Python failures caused by the existing Marrakech preprocessing checksum mismatch remain documented below; inference code was not changed or retested in Phase 2. They remain a release limitation for estimation, not a source for these descriptive Market analytics.

### Files changed in Phase 2

Updated: `components/market/MarrakechMarketIntelligence.tsx`, `components/market/CityMarketMap.tsx`, `tests/marrakech-market.test.ts`, `tests/frontend/marrakech.test.ts`, this report. New: `components/market/NeighborhoodInsights.tsx`, `lib/analytics/neighborhood-presentation.ts`.

The upgrade is ready for code/visual review after the checks above. Geographic pricing and temporal analysis remain intentionally unavailable. No commit, push, merge, branch change or deployment was performed. Earlier uncommitted work is preserved.

Current cumulative working tree on `main`: 10 modified tracked files and 8 new files, unstaged (including both phases). Phase 2 itself touches the seven files listed above. Generated review screenshots are ignored local artifacts.

## Scope and readiness

The FR/AR Market routes now render a descriptive apartment-sale reference experience. The city capability enables their existing service links, static parameters, canonical/hreflang metadata and sitemap entries. Estimation remains independent and unchanged. This implementation does **not** certify a current, representative Marrakech market or a production release. Hosted QA, real mobile/tablet verification and the existing model artifact integrity failure remain outstanding.

This report supersedes the Market-readiness conclusions of `MARRAKECH_CITY_HANDOFF.md` and `CITY_MARKET_MAPPING.md` for Marrakech only. Those earlier reports required Casablanca's room/floor model fields for market publication. The present request authorizes city-specific analytics from available data: neither room count nor floor is needed for descriptive price/surface aggregates. No missing model input is inferred. Geographic pricing remains withheld because a neighborhood crosswalk is still absent.

## Casablanca benchmark audit

Architecture: Next.js App Router 14 (installed 14.2.35), React 18, TypeScript, Tailwind/CSS theme tokens, Recharts 3, lucide-react and Framer Motion. Package ranges differ from installed versions. No new framework or library was introduced.

- Canonical route: `app/[locale]/cities/[citySlug]/market/page.tsx`; legacy `/[locale]/market/casablanca` permanently redirects. The locale layout supplies the shared navbar/footer, locale direction, ambient background and scroll progress.
- City publication/capabilities: `config/cities.config.ts`, path and action helpers in `lib/cities/registry.ts`. Market availability is separate from model availability.
- Server provider: `lib/analytics/casablanca.ts`, synchronous local CSV read and process cache; no public Market API, Supabase fetch, authentication or entitlement requirement. Admin quality/drift endpoints are separate and privileged.
- UI: `CityMarketIntelligence`, `CityFoundation` layout/card/state primitives, shared formatters, `CityMarketMap`, SVG geography projection and arrondissement aggregation.
- State: local React sorting; map fetch with abort cleanup, hover/focus and selected administrative area. Map selection does not filter city KPIs or the neighborhood table.
- Rendering: public static generation with `revalidate=false`; file tracing explicitly includes the runtime CSV. No asynchronous Market data loader; map has loading/error messages. Empty chart datasets have a text fallback. Casablanca's CSV read failure has no dedicated local data fallback.

### Analytics inventory

All Casablanca public analytics use `server-data/casablanca-market.csv`: 1,172 usable rows, 100 neighborhoods, no exact field-signature duplicates. The usable cohort requires type/neighborhood, positive Price/Area/Price_m2 and finite room/bedroom/bathroom/floor fields. It does not deduplicate or trim outliers during aggregation. Model-range invalid counts are quality diagnostics, not all eligibility filters. Missing state/age are explicitly labeled (49 and 290 respectively).

| Feature / purpose | Calculation and handling | Display / threshold |
| --- | --- | --- |
| Observation volume / coverage | Count of usable source rows; distinct location labels | Five KPI cards include counts; no claim of transactions |
| Typical asking price | Rounded median of Price, MAD | KPI and neighborhood table |
| Typical asking price/m² | Rounded median of supplied Price_m2, not recomputed | KPI, histogram and neighborhood comparison |
| Typical surface | Arithmetic mean Area for city; median for neighborhoods | City KPI / neighborhood table, m² |
| Property composition | Type counts and shares of cohort or neighborhood | Bar chart / table; mixed types can influence medians |
| Price/m² distribution | Fixed bins 0/5k/10k/15k/20k/25k/35k/max | Recharts bar chart; last bin includes upper endpoint |
| Surface distribution | Bins 0/75/100/150/250/500/1000/max | Calculated but not shown in public renderer |
| Neighborhood volume | Original-row counts, descending, top 12 | Chart and top six cards |
| Neighborhood benchmark | Original-row medians, no weighting across neighborhoods | At least 8 observations per neighborhood over the full reference; sort by price/m², count or median area |
| Administrative price context | Pool original listings through explicit evidence-backed mapping; never average medians | 16 outlines; 7 mapped labels / 268 observations; 4 eligible areas; 8-observation minimum |
| Administrative color classes | Up to 4 quantile classes of eligible area medians; ties preserved | Neutral below threshold; map tooltip/panel, legend, coverage and OSM/GeoNames/official source attribution |
| Admin quality | Missing fields, validity rules, manifest coverage, numeric quantiles, categorical shares | Separate protected panels; not automatically reusable for Marrakech |
| Admin drift | Numeric PSI and categorical total variation versus production inputs | Minimum 30 production events; thresholds .1/.25 PSI and .1/.2 variation |

No quarterly/time-series public calculation exists here. The eight-listing rule applies to neighborhoods/administrative groups over the reference cohort. Marrakech does not reinterpret collection dates as quarterly market history.

### Visual and interaction findings

The benchmark uses a dark navy heading, blue accents, five KPI cards, light/dark token-based surfaces, responsive grids, charts, an SVG map and a horizontally scrollable table. Marrakech retains that language and the same shell. It uses two complementary distributions and a searchable comparison table rather than repeating the volume chart, volume cards and property-mix chart for one retained property type.

Casablanca's chart tooltips/empty labels and sorting screen-reader label contain hardcoded French; its table has no caption or column scope. These were not changed. Marrakech supplies localized labels, table captions/scopes, live result counts, keyboard-native inputs/selects/details, a focusable scrolling table region and tabular chart alternatives. Chart animations are disabled to avoid unnecessary motion. Both charts rendered and map polygons loaded in browser testing, with no app error/warning logs.

An existing typography problem is visible in both cities: computed body font is Times New Roman despite the project's Jakarta/Arabic font configuration. The baseline was preserved; a global font repair is outside this change. No mobile performance score, Core Web Vitals or physical-device claim is made.

## Marrakech data-readiness audit

Selected source: the **existing reviewed shared CSV**, `data/training/shared/model-ready/maisondelux_model_ready_v1.csv`. No Supabase listing table is required. Local raw/processed/parquet/workbook/recovery copies overlap and were not combined. The model's separate notebook dataset was inspected as provenance but is not merged into Market. There was no dedicated Marrakech runtime Market cohort before this change.

Source SHA-256 of local bytes: `c8000deb59446b4a4bb99066e2998ba857f65888f6c2958a70d4100d01b1436f`. Regeneration computes the hash anew, including the checkout's line endings. The deterministic snapshot test verifies the exact local source hash and identical regeneration.

| Source audit | Result |
| --- | --- |
| All source rows / Marrakech rows | 13,537 / 2,472 |
| Validation / model-ready / transaction | All Marrakech records valid, marked model ready, sale |
| Original property_type | All 2,472 say appartement; **not authoritative after repair** |
| Repaired types | 2,065 apartments; 310 unknown; 50 studios; 31 duplexes; 4 villas; 3 buildings; 8 riads; 1 house |
| Duplicate evidence | 2,472 distinct listing IDs; 2,002 marked unique, 470 possible duplicates. Unique IDs do not prove distinct properties |
| Batch flags | 1,877 not flagged; 595 suspicious high-price/m²-tail batch |
| Outlier decisions | 2,422 not flagged, 39 uncertain, 11 valid extreme |
| Numeric consistency | All 2,472 marked consistent; positive fields still checked independently |
| Neighborhood validation | 2,248 valid, 224 invalid; cleaned field required |
| Missing publication dates / coordinates | All 2,472 for each of publication_date, latitude and longitude |
| Missing URL / bedrooms / bathrooms | 1,864 / 2 / 17; missing room/floor fields not filled |
| Source / collection envelope | mubawab.ma; 14 August–2 September 2026 (collection, not publication) |

Numeric distributions before the new conservative eligibility filter:

| Field | Min | Q25 | Median | Q75 | Max |
| --- | ---: | ---: | ---: | ---: | ---: |
| Asking price, MAD | 95,000 | 1,100,000 | 1,515,000 | 2,200,000 | 17,980,000 |
| Declared surface, m² | 31 | 65 | 84 | 108.25 | 1,263 |
| Stored price/m², MAD/m² | 1,333.33 | 13,948.9025 | 18,598.665 | 23,273.5125 | 116,000 |

### Eligibility and reproducible snapshot

Run `python scripts/build_marrakech_market.py`. It reads only the existing source and writes `server-data/marrakech-market.json`. This is a new analytic selection policy, not Casablanca's model contract and not an assertion that every excluded record is wrong.

Rules in precedence order: repaired type must be apartment and transaction sale; model-ready and valid; duplicate_keep true and repaired status unique; batch not flagged; outlier not_flagged or valid_extreme; valid nonempty cleaned neighborhood; positive finite price, declared surface and quotient with consistent numeric status; nonempty unique listing ID. Flags overlap, so independent counts above must not be added together.

Sequential mutually exclusive exclusion totals: unsupported scope 407, duplicate risk 410, suspicious batch 301, uncertain outlier 15; total **1,133**. Invalid-location/numeric/ID checks remove no additional rows after these earlier exclusions. Retained valid extremes are kept without winsorizing or clipping. No percentile cutoff is invented, no fuzzy neighborhood merge is applied.

Final cohort: **1,339 observations / 62 recorded neighborhood labels**, collected **14 August–1 September 2026**. Thirty labels meet the eight-observation comparison threshold; 32 labels / 89 observations are below it. Their local prices are removed from the client aggregates, while all 1,339 remain in overall KPIs and histograms. The names include actual Guéliz, Hivernage, Agdal, Samlalia, route areas and Ennakhil (Palmeraie); these are dataset labels, not certified neighborhood extents.

### KPI formulas and output

- Count: retained rows, 1,339. Coverage: distinct retained cleaned labels, 62.
- Median asking price: median(price_mad), **1,470,000 MAD**.
- Median asking MAD/m²: median of each price_mad / surface_m2, rounded once for display, **17,347 MAD/m²**. Not ratio of medians and not a model output.
- Average declared surface: sum(surface_m2) / count, rounded to one decimal, **93.2 m²**. Median retained surface is 85 m²; retained min/max are 31/356 m².
- Neighborhood comparisons: same original-row medians within each label; include count, median price, median ratio and median area only at n >= 8.
- Histograms: lower-inclusive / upper-exclusive bins with an unbounded final bin; counts sum exactly to 1,339 in each chart. Surface edges: 0/50/75/100/150/250 m²; ratio edges: 0/10k/15k/20k/25k/35k MAD/m².

The source's surface_m2 cannot certify habitable versus built/total area. Restricting to apartments reduces category incompatibility but does not remove this uncertainty or sampling bias. The UI states this. No transaction conclusions, yield, investment recommendation, tourist rental inference, monthly change or market-wide valuation is supported.

## Architecture and integration

- `lib/analytics/marrakech.ts` is server-only, validates snapshot identity/version/count reconciliation and every numeric observation/ID/date, then returns aggregated public data. Empty cohort returns null; malformed/missing snapshot throws. The route catches provider errors and shows a localized unavailable state; no zero KPIs or fallback to Casablanca.
- `lib/analytics/registry.ts` adds a Marrakech Market provider only. Admin quality/drift capabilities remain Casablanca-owned; no fake Marrakech drift function is added.
- The existing dynamic city route dispatches the Marrakech renderer behind its own capability. No extra city route hierarchy or broad refactor is needed.
- `MarrakechMarketIntelligence` reuses CityFoundation, theme tokens, shared unit formatters, Recharts, map and locale shell. Public props contain aggregates and coverage, not source URLs or listing identifiers. Search strips accents/case and affects the table only; sorting is descending with a deterministic label tiebreak.
- The existing map accepts an optional context notice; its defaults and Casablanca/Rabat body markup stay unchanged. Marrakech's five existing OSM administrative Polygons remain neutral and selectable. Five helper Points are excluded. No boundary edits, invented mapping, tiles, geocodes or pricing classes.
- Next output tracing includes the new ~300 KB server snapshot. Both languages are statically generated without runtime Supabase or model calls. Build reports Market first-load JS around 226 KB; no field performance measurement was performed.
- Capability is enabled locally after data/functional checks. Existing city actions and sitemap then expose FR/AR Market automatically. No estimation flag, inference code, authentication, backend or schema was edited.

Future cities can register a Market-only provider, select an explicit eligibility policy and reuse UI primitives/geography without copying Casablanca's model prerequisites. Type-specific comparisons or historical analytics require evidence before adding capabilities. Further generic Market abstractions are unnecessary for this change.

## Executed verification

| Check | Result |
| --- | --- |
| Snapshot regeneration, hash, KPIs, bin totals, eligibility, ratio median, 7/8 threshold, invalid numeric/date/ID inputs | Passed in `tests/marrakech-market.test.ts` |
| `npm run test:market` | **16/16 passed** in final run, including localized unavailable/invalid-route coverage |
| Existing Casablanca/Rabat body hash regressions, FR/AR | Passed, exact match to stored pre-change hashes |
| `npx tsc --noEmit --incremental false` | Passed after correcting ES5 Map iteration compatibility |
| Direct ESLint and `npm run lint` | Passed, no warnings/errors |
| `npm run build` | Passed twice; final application build generated all 39 static pages including both Marrakech Market routes |
| `npm run test:security` | 86/87 passed. Real CPU model persistence integration fails before prediction on the existing Marrakech preprocessing checksum mismatch |
| Python README regression selection, `-q -W error -p no:cacheprovider` | 43 passed, 116 failed, 1 fixture error. Marrakech failures include the preprocessing checksum mismatch; the fixture error is a Windows temporary-directory permission failure |
| Isolated `tests/test_casablanca_inference.py` | 10/10 passed |
| Isolated Marrakech golden parity | Fails immediately with Marrakech preprocessing checksum mismatch; model files left unchanged |
| Artifact-mismatch rejection fixture with workspace `--basetemp=outputs/market-qa/pytest-artifact-20261015` | 1/1 passed; resolves the original sandbox temporary-directory setup error without modifying application code |
| Browser: direct FR/AR routes, refresh, city service link, breadcrumb/back | Passed on local production server |
| Local HTTP status checks | FR/AR Marrakech Market, Marrakech city, Casablanca Market, Rabat preparation and map JSON return 200; unknown city returns 404; legacy Casablanca route returns 308 |
| Browser: accent-insensitive `gueliz` query, unmatched query, cleared query, ratio sort | Passed: 1 / 0 / 30 rows; Hivernage first under price/m² descending |
| Browser: charts, map load and keyboard selection | Two chart SVGs, five administrative shapes; Enter selects Guéliz and updates localized panel |
| Browser: light/dark, desktop, console | Both themes and languages viewed; no app error/warning console logs |
| Mobile/tablet visual QA | **Unverified**: viewport capability set to 390×844 had no effect; measured innerWidth remained 1280, including a fresh tab. No mobile screenshot is claimed |
| Map fetch failure / actual missing-file route in browser | Code paths reviewed; empty provider/component tested. Browser network failure injection was not available |

The first sandboxed Next lint misidentified dependencies as missing because realpath returned EPERM; its automatic installation was interrupted and no dependency/lockfile change was retained. Sandboxed build hit an EPERM mkdir error. Repeating standard lint/build with local permissions succeeded. No sandbox workaround was added to project code.

Model checksum evidence: metadata expects `6c6b38750b0a53a10d4af7896302ff047997bd7a326f758af46ef7af0e939cd1`; current CRLF bytes hash to `d0ca467c552607592db62da4718356fcc9a9fa7a69f73e83a5bfb2e6b8e82c0f`. LF-normalizing the bytes produces the expected checksum. This is an existing checkout/artifact-integrity issue; changing the certified package or its validator was deliberately excluded from Market work.

Local browser preview: `http://127.0.0.1:3000/fr/cities/marrakech/market`. Desktop light screenshot: `outputs/market-qa/marrakech-market-light.png` (ignored local QA artifact).

## Files and outstanding work

Created: `scripts/build_marrakech_market.py`, `server-data/marrakech-market.json`, `lib/analytics/marrakech.ts`, `components/market/MarrakechMarketIntelligence.tsx`, `tests/marrakech-market.test.ts`, this report.

Modified: city Market route, `components/market/CityMarketMap.tsx` (optional context only), `config/cities.config.ts`, `lib/analytics/registry.ts`, `next.config.mjs`, `package.json` (test script only), `tests/frontend/city-market.test.ts`, `tests/frontend/marrakech.test.ts`, `docs/MARRAKECH_CITY_HANDOFF.md` and `docs/CITY_MARKET_MAPPING.md`. No existing data or model file changed. Final working tree: 10 modified tracked files and 6 new untracked deliverables on `main`; nothing staged or committed.

Remaining: verify actual tablet/mobile layout and chart interaction on a functioning viewport/device; resolve the model integrity issue in its own authorized scope; rerun failing inference/persistence tests; review inherited typography; validate hosted delivery and data publication policy before release. New data, new collection, geographic crosswalk work and quarterly analytics each require their own evidence/authorization. No deployment was performed or approved.
