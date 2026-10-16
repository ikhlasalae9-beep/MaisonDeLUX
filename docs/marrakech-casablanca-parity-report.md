# Marrakech / Casablanca parity correction

Final status: **PARTIAL PARITY — remaining differences and screenshot limitation documented below.** Verified 15 October 2026. The shared-component correction is implemented locally. Existing uncommitted work is preserved; nothing was committed, pushed, merged or deployed.

## Before-change inventory and parity matrix

Production reference opened directly: https://maison-delux.com/fr/cities/casablanca/market. Local Casablanca and Marrakech opened directly as well. Production and local Casablanca have the same eight h2 headings and section sequence. Production uses Jakarta Sans; local Casablanca initially computed Times New Roman. This runtime font difference must be distinguished from source/component parity. Production/local also have some different neighborhood spellings; source data is not to be overwritten to match production.

| Section | Casablanca reference | Marrakech before correction | Classification / action |
| --- | --- | --- | --- |
| Navbar | Shared marketing shell | Same shell | Verify themes, locale and city estimator link |
| Hero | Single city back link; navy MarketHeading; source pill | Breadcrumbs, longer hero/period block, scoped system-font fallback | STRUCTURAL/VISUAL: reuse actual MarketHeading; retain observation period in source/method notes |
| KPI row | Five icon cards, exact padding/labels/numbers, no footnotes | Icons with contextual footnotes and scoped font | VISUAL: reuse exact card markup/component and responsive grid |
| Map position/container | Immediately after KPI section; two-column card | Same position but custom opt-in information treatment | VISUAL/FUNCTIONAL: retain shared CityMarketMap; align geometry/selection style; data exception only |
| Map panel/legend | Covered area price/count/surface; price classes | Administrative metadata, no price crosswalk | ANALYTICAL/BLOCKED: keep administrative metadata and unavailable metrics inside same framework; never fabricate prices |
| Neighborhood cards | Six most represented, small name/count cards, 3-column desktop grid | Six large cards mixing coverage and extremes, after analytics | STRUCTURAL/VISUAL: same six volume cards in same position; preserve click-to-filter behavior |
| Analytics overview | Structure du référentiel, four shared Recharts cards | Separate budget heading plus custom HTML horizontal bars | STRUCTURAL/VISUAL: shared chart renderer and same 2×2 grid |
| Price/m² distribution | Recharts, fixed containers, blue bars/tooltip | Recharts with different axes/label styling | VISUAL: actual reference ChartCard with opt-in accessibility/localization |
| Neighborhood volume | Horizontal Recharts chart, top 12 | Custom HTML bars, top six, percentage notes | VISUAL: reference horizontal Recharts; keep honest dataset coverage explanation/denominator |
| Property-type distribution | Mixed property types | Single apartment-sale cohort; surface chart separate | ANALYTICAL: substitute surface distribution using same ChartCard, never fake types |
| Neighborhood medians | Horizontal Recharts, eligible neighborhoods | Custom HTML bar chart and own selector | VISUAL/FUNCTIONAL: reference Recharts; preserve independent chart sorting as native styled control |
| Explorer controls | Section heading beside sort selector | Separate search/sort/reset area and different title | VISUAL: same heading/control layout and input tokens; preserve search/reset |
| Table | Six columns including type mix, reference header/row padding | Five-column variant with different header styling | VISUAL: same table design; only apartment type data; retain caption/scopes/RTL/scroll |
| Methodology | Brief notes plus reference source | Separate detailed expandable section | ANALYTICAL: keep disclosure below explorer, as necessary data provenance; use shared Section/Card tokens |
| Additional CTA | Back link, navbar/footer estimator links | Extra large standalone CTA card | STRUCTURAL: eliminate redundant extra card; retain its navigation destinations in existing shared navigation |
| Footer | Shared marketing footer | Same shell | Verify rather than redesign |

## Corrected section-by-section comparison

The initial inventory above was recorded before correction. Each main section was reopened against Casablanca during implementation, with intermediate `step1` through `step5` screenshots. The final source uses Casablanca's actual components rather than parallel Marrakech styling.

| Section | Corrected implementation / differences resolved | Remaining difference and reason | Result |
| --- | --- | --- | --- |
| Navigation | Existing shared marketing navbar, locale/theme controls and city navigation | City estimator destination follows city capabilities | PASS |
| Hero | Actual `MarketHeading`; same container, navy surface, typography, source pill and single city back link; removed breadcrumb and scoped font override | City, apartment scope and source differ. Arabic Marrakech title fits one mobile line; Casablanca wraps to two | PASS |
| Five KPIs | Actual `MarketKpiOverview`, exact icons, grid, padding, number styles, borders and shadows; removed custom footnotes | Values differ. Mobile FR first row is 139.6px for Marrakech versus 152.6px for Casablanca because the reference uses natural wrapping of different prices | PASS |
| Map container | Existing `CityMarketMap`, same header/body, two-column desktop/stacked mobile card, selection outline and legend framework | Boundary shape/count differs. Taller administrative wording changes natural height | PASS |
| Map panel | Reference emphasis and 2×2 metadata layout, matching selection/focus affordances | Shows unavailable statistics plus OSM ID, source HCP code, administrative level and scope; no validated price crosswalk exists | PASS for interface; price aggregation BLOCKED by data |
| Map legend | Same legend region and neutral/amber selected treatment | Administrative legend replaces misleading price classes | PASS, justified analytical difference |
| Six highlights | Actual `MarketNeighborhoodHighlights`; compact name/count cards in same position and three-column grid; removed oversized bespoke insights | Six largest listing counts, deterministic selection. Existing click/Enter-to-filter preserved. Reference cards themselves show name/count; medians and other values remain in explorer | PASS |
| Analytics overview | Actual `MarketAnalyticsSection`, same heading, section background and 2×2 responsive grid | Apartment-only scope sentence and necessary source caveat | PASS |
| Price/m² chart | Actual reference `ChartCard`, Recharts axes, blue bars, grid, dimensions, tooltip and themes | Valid Marrakech bins/counts differ | PASS |
| Volume chart | Reference horizontal Recharts chart, top 12, replacing custom HTML bars | Counts and neighborhood names differ | PASS |
| Type chart substitution | Surface distribution in the same third `ChartCard` slot | Cohort contains only apartment sales; invented type diversity would be false | PASS, justified substitution |
| Median chart | Reference horizontal Recharts and eligible top 12; tooltip includes real n and units | Independent ordering preserved below grid, using native control tokens | PASS |
| Chart accessibility | Expandable real-value tables and keyboard chart tooltip retained | Disclosure and independent ordering are useful Marrakech features absent in reference | PASS |
| Explorer controls | Actual heading/control arrangement and native styling; search, sort, reset, live count and empty state retained | Search/reset require extra control space, especially mobile | PASS |
| Explorer table | Actual `MarketNeighborhoodTable`, same six columns, header/row tokens and internal scroll. Caption, scopes and row headers retained as opt-in semantics | Apartment share genuinely 100%; 30 eligible rows versus reference cohort. Text length creates natural row heights | PASS |
| Method/source | Detailed disclosure follows explorer using existing Section/Card primitives | Necessary extra section preserves cleaning, suppression, dates and provenance from the earlier implementation | PASS, documented content addition |
| Extra CTA | Removed redundant standalone CTA; existing navigation destinations preserved | No extra dashboard card | PASS |
| Footer | Existing shared footer preserved and compared in themes/locales | Existing city-aware navigation and translated text | PASS |

## Visual evidence and measured comparison

Evidence root: `C:/Users/ouaha/OneDrive/Desktop/MaisonDeLUX/outputs/market-parity/` (ignored local verification artifacts; retained on disk, not Git-tracked).

Three pages were compared: production Casablanca at `https://maison-delux.com/{fr|ar}/cities/casablanca/market`, local Casablanca and local Marrakech at `http://127.0.0.1:3000/{fr|ar}/cities/{city}/market`. Loopback 127.0.0.1 serves the same requested localhost application.

Eight matched conditions per page: desktop **1440×900**, mobile **390×844**, FR/AR, light/dark. Captured DOM metadata verifies viewport, zoom scale 1, theme, direction, fonts, dimensions and page overflow. All eight combinations have matching computed font families across production/local Casablanca/Marrakech, matching KPI and chart style objects, and no horizontal page overflow. Tables scroll inside their own region.

| Measure | Casablanca local / Marrakech / production |
| --- | --- |
| Desktop FR hero height | 427.725 / 427.725 / 427.725 px |
| Desktop AR hero height | 376.95 / 376.95 / 376.95 px |
| Desktop KPI height, all five | 136.6 px, all three pages |
| Desktop FR chart height, all four | 381.6 px, all three pages |
| Desktop AR chart height, all four | 379.2 px, all three pages |
| Mobile FR chart height, all four | 373.6 px, all three pages |
| Mobile AR chart height, all four | 371.2 px, all three pages |
| Mobile FR hero height | 403.738 px, all three pages |
| Mobile AR hero height | 362.8 / 314.2 / 362.8 px; city-name wrapping explained above |

Full captures: `final-{production|casablanca|marrakech}-{desktop|mobile}-{fr|ar}-{light|dark}.png` (24), with matching `.json` metadata. Geometry summary: [metrics-summary.json](../outputs/market-parity/metrics-summary.json).

French section crops and side-by-side evidence use `compare-{production|casablanca}-{desktop|mobile}-fr-{light|dark}-{part}.png`, where part is `hero`, `kpis`, `map`, `neighborhoods`, `analytics`, `explorer`, `footer`, or `chart-1` through `chart-4`. These are crops of actual browser screenshots, assembled with labels, never synthetic application renders.

**Capture limitation / INCOMPLETE requirement:** the browser full-page screenshot API horizontally clips upper Arabic content although the live viewport renders correctly and DOM reports no page overflow. Arabic full-page files and their derived crops must NOT be treated as complete visual proof. The same problem affects the production reference. Supplemental reliable viewport captures cover each section and each of the four charts for all three pages in desktop/mobile, light/dark: `viewport-{production|casablanca|marrakech}-{desktop|mobile}-ar-{light|dark}-{part}.png` (132), and corresponding `viewport-compare-{production|casablanca}-...` pairs. Parts are `hero`, `kpis`, `map`, `map-panel`, `neighborhoods`, `chart-1..4`, `explorer`, `footer`. These snapshots scroll the relevant heading into view; adjacent content may appear, so their vertical origin is not a pixel-diff assertion. No screenshot tooling workaround or application CSS change was used to hide the capture defect.

Inspected representative final evidence:

- [Desktop light five KPI cards](../outputs/market-parity/compare-production-desktop-fr-light-kpis.png)
- [Desktop dark map and information panel](../outputs/market-parity/compare-production-desktop-fr-dark-map.png)
- [Desktop light six neighborhood cards](../outputs/market-parity/compare-production-desktop-fr-light-neighborhoods.png)
- [Mobile dark four-chart analytics](../outputs/market-parity/compare-production-mobile-fr-dark-analytics.png)
- [Arabic mobile dark hero/KPIs](../outputs/market-parity/viewport-compare-production-mobile-ar-dark-hero.png)
- [Arabic mobile dark map panel](../outputs/market-parity/viewport-compare-production-mobile-ar-dark-map-panel.png)
- [Arabic desktop light analytics](../outputs/market-parity/viewport-compare-production-desktop-ar-light-chart-2.png)
- [Arabic mobile light exploration](../outputs/market-parity/viewport-compare-production-mobile-ar-light-explorer.png)

Continuous correction evidence includes `step1-*-kpi-*`, `step2-*-map-*`, `step3-*-neighborhoods-*`, `step4-*-analytics-*`, `step5-*-explorer-*`, including before/after files. Initial page captures use `before-*`. Conditions of these intermediate captures vary; final matched sets above are authoritative. Full-page Arabic crops are superseded by viewport evidence.

Production/local differences were checked explicitly. Initial Times New Roman fallback was caused by stale generated Next font class/CSS output. Removing only the verified generated `.next` directory and rebuilding restored matching Jakarta Sans and IBM Plex Arabic; global styles and font source were not changed. Production/local neighborhood spellings vary, so production data was not copied over local validated analytics.

The final Arabic comparison exposed an inherited Recharts issue: RTL direction misplaced category labels in the production reference. Marrakech now opts into LTR chart coordinates inside the same renderer, while the surrounding headings and controls remain Arabic RTL. Recaptured desktop/mobile light/dark chart pairs confirm readable neighborhood labels. Casablanca defaults remain unchanged. Recharts retains the reference automatic tick skipping; complete names and values are available in accessible value tables.

## Technical changes

- `components/market/CityMarketIntelligence.tsx`: extracted/exported the real `MarketHeading`, `MarketKpiOverview`, `MarketNeighborhoodHighlights`, `MarketAnalyticsSection`, `ChartCard`, `MarketNeighborhoodTable`; Casablanca calls the same extracted markup. Defaults preserve existing Casablanca/Rabat output. Optional Marrakech interactions, localized units, LTR chart coordinates for Arabic, caption/table semantics and reduced chart motion do not change reference defaults.
- `components/market/MarrakechMarketIntelligence.tsx`: composes the shared reference sections and retains native search/sort/reset, click-to-filter, median-chart ordering, value tables and source disclosure. Removed independent charts, oversized cards, scoped fonts, breadcrumb and duplicate CTA.
- `components/market/CityMarketMap.tsx`: reference map styling for optional administrative panel, neutral fill and same active outline; original city defaults retained.
- `lib/analytics/neighborhood-presentation.ts`: eligible neighborhood filtering/sorting retained; obsolete bespoke highlight selection removed.
- Superseded `components/market/NeighborhoodInsights.tsx` removed; a review backup remains at `outputs/market-parity/phase2-NeighborhoodInsights.tsx.txt`.
- `tests/marrakech-market.test.ts`, `tests/frontend/marrakech.test.ts`: assert eligibility, shared section order/content and preserved disclosures/features.
- `docs/marrakech-market-implementation.md`: points to this correction while retaining historical implementation/validation details.
- New `docs/marrakech-casablanca-parity-report.md`: this report.

The route, config, analytics registry/provider, snapshot and builder files already present in the dirty working tree are cumulative earlier Marrakech work. This parity correction did not modify auth, Supabase records/schema, model inference or certified model artifacts, nor add dependencies. An intermediate build found a backup accidentally named `.tsx` under outputs; renaming it `.tsx.txt` resolved TypeScript discovery. No compiler exclusions were added.

## Data integrity

The snapshot was not regenerated or edited during this correction. SHA256 before/after:

`6F538FB49FA0DB745DB3872832E41312454FD629CC1C604697D4B97B7705D4B9`

Existing conservative selection from 2,472 source records remains **1,339 apartment-sale observations**, **1,133 exclusions**, **62 neighborhoods**, **30 with n≥8** and **32 suppressed from published benchmarks**. The display uses provider aggregates, not hardcoded KPIs: median asking price MAD **1,470,000**, median per-observation price/area ratio **17,347 MAD/m²**, mean area **93.2 m²**. These are asking prices, not completed transaction values or representative market estimates.

Highlight selection is descending validated listing count: Guéliz 342, Route Casablanca 140, Agdal 76, Hivernage 74, Samlalia 62, Ennakhil (Palmeraie) 58. The threshold and deterministic ordering remain enforced. Search filters published neighborhoods without changing city KPIs. Histograms reconcile to the cohort. Missing n is an em dash, not zero.

Collection dates remain 14 August–1 September 2026, not publication or historical transaction dates. Existing verified five administrative polygons remain independent of neighborhood statistics. No fabricated arrondissement totals/prices, geocoding, crosswalk, appreciation, investment score or time series was introduced. Historical trends and arrondissement statistics remain unavailable pending valid source evidence.

## Verification and acceptance

| Requirement / check | Status | Evidence / limit |
| --- | --- | --- |
| Inspect production, local Casablanca, local Marrakech | PASS | Actual browser visits, full inventory and screenshots |
| Continuous section/source comparison | PASS | Before matrix; step1–step5 evidence; final shared implementation |
| Reuse actual established components | PASS | Six reference components, shared map and marketing shell |
| Structural order and component geometry | PASS | KPI → map → six highlights → four analytics charts → explorer; measured styles/dimensions above |
| All necessary analytical differences justified | PASS | Apartment-only surface substitution, neutral administrative map, methodology disclosure |
| Map click/keyboard selection | PASS | FR/AR selection changes panel; neutral/active states preserved, no fabricated metrics |
| Search, clear, empty state, sorting | PASS | Guéliz gives one row; clear gives 30; unmatched query gives localized empty state; independent chart sort tested |
| Keyboard/accessibility interactions | PASS | Enter highlight filter/focus, map selection, chart arrow-key tooltip with n, caption/scopes and real-value tables |
| Navigation, locale, refresh | PASS | City ↔ Market, FR/AR stays on Marrakech route, reload retains correct page |
| Desktop/mobile FR light/dark actual visual review | PASS | Matched full pages and section pairs captured and inspected |
| Arabic RTL light/dark viewport review | PASS | Matched section/chart viewport captures and inspected pairs |
| Complete un-clipped Arabic full-page screenshot evidence | BLOCKED | Browser capture clips upper RTL content; supplemental viewport evidence available; this strict requirement is INCOMPLETE |
| RTL chart category axes | PASS | Final opt-in LTR chart coordinate correction removes RTL misplacement; recaptured four chart states; reference tick skipping retained and full names in value tables |
| Dataset and methodology preserved | PASS | SHA256 unchanged; counts, eligibility, histogram and ratio-median tests |
| Arrondissement price/statistical parity | BLOCKED | No validated crosswalk; intentional accepted data exception; unavailable state implemented |
| `npm run test:market` | PASS | 17/17 |
| All frontend tests (`tests/frontend/*.test.ts`) | PASS | 43/43; final combined frontend/Market/arrondissement invocation also passed 53/53, including Casablanca/Rabat FR/AR exact body-hash regressions |
| `npx tsc --noEmit --incremental false` | PASS | Final source |
| `npm run lint` | PASS | No lint warnings/errors |
| `npm run build` | PASS | Final production build; 39 routes; Market first-load JS approximately 227 kB |
| Fresh production-build browser console | PASS | No new warnings/errors during final FR/AR captures |
| `git diff --check` | PASS | No whitespace errors; repository CRLF notices only |
| Model/Supabase/auth safety | PASS | No changes by this correction; no production writes |
| Full model/security/Python certification | BLOCKED / not re-run | Earlier report records an existing Marrakech preprocessing checksum issue (86/87 security; Python failures). Targeted Market/front-end results do not certify model inference |
| Commit/push/merge/deploy boundary | PASS | None performed; local preview only |

Automated rendering/source regressions are distinct from browser visual checks. The individual suites overlap; the final combined invocation reports 53 unique passing tests, rather than adding 17 and 43. Formal accessibility certification, physical-device testing and performance profiling were not performed.

## Final status

**PARTIAL PARITY — remaining differences documented.**

The independent Marrakech design has been replaced with the actual Casablanca presentation system, with matching measured typography, desktop KPI/chart geometry and shared responsive layouts. Data-backed exceptions and useful existing interactions are preserved. The strict brief is not marked fully complete because un-clipped Arabic full-page evidence is blocked by the screenshot API; the chart-axis issue identified during that review was corrected and reverified. No deployment has been performed.
