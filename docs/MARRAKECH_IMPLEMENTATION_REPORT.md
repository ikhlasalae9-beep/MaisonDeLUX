# Marrakech third-city implementation report — 2026-10-06

## 1. Architecture reused/generalized

Audited current source and rendered FR/AR Casablanca/Rabat city, market and estimator routes before editing. The accepted template has nine main sections: hero, editorial introduction/fact card, three alternating narrative/image sections, urban-reference cards, six methodology cards, conclusion/source card, services panel; then the existing footer. Existing Casablanca estimator remains model-specific; Rabat estimate routes remain closed. Casablanca market has real KPIs/map/chart/table data; Rabat uses the existing geography-only preparation state.

Reused CityPage, ThemeVideoBackground, CityEditorialArticle, CityServicesSection, CityMarketIntelligence, CityMarketMap, geometry selector/projection, capability flags, CityExplorer, i18n, theme tokens and shells. Only the editorial resolver needed an explicit three-city configuration table instead of its previous Casablanca-versus-Rabat branch. No Marrakech-specific page, hero, article, services or map component was created.

Navigation received a generic capability correction: publicNavigationEstimation returns the current city's route only if estimation is enabled; otherwise no href. PublicEstimationAction renders the existing active Link or a muted non-link surface. This fixes the requested cross-city CTA issue for all unavailable public cities, rather than special-casing Marrakech. Casablanca's active link is unchanged. Rabat's header/mobile/footer estimation links are intentionally replaced by unavailable messaging; its city and market bodies/hero/content remain unchanged.

The registry's legacy national hasActiveModelCoverage flag is retained for compatibility and is not a city-model availability signal. The current city availability fields govern all new actions.

## 2. Files created

- config/marrakech-editorial.ts
- components/city/PublicEstimationAction.tsx
- tests/frontend/marrakech.test.ts
- tests/test_marrakech_availability.py
- reports/marrakech-reference-hashes.json (pre-edit FR/AR Casablanca/Rabat city and market body hashes)
- docs/MARRAKECH_CITY_HANDOFF.md
- docs/MARRAKECH_IMPLEMENTATION_REPORT.md

## 3. Files modified

- config/cities.config.ts
- config/city-content.ts
- config/city-editorial.ts
- config/city-media.ts
- config/city-market.ts
- lib/cities/registry.ts
- components/layout/Navbar.tsx
- components/layout/Footer.tsx
- components/layout/RouteShell.tsx
- tests/frontend/city-foundation.test.ts
- tests/frontend/city-template.test.ts
- tests/frontend/city-hero.test.ts
- docs/ALAE_MODEL_TRAINING_HANDOFF.md
- docs/CITY_MARKET_MAPPING.md

Next build/typecheck refreshed generated output/caches. Package manifest and lockfile remain unchanged; no dependencies were added. This list describes task edits, not a Git comparison. No Git commands were executed.

## 4. Marrakech configuration

Activated its existing registry record as published/public with Marrakech contentRef/seoRef/mediaRef. Estimation remains unavailable/publicEnabled false, backendStatusKey/modelRef null. Market publicEnabled false/analyticsRef null. Other city registry capabilities retain their previous state.

The published city is discoverable through the existing Territoires explorer. Existing sitemap policy adds FR/AR city URLs only. No Marrakech estimator or market URL is advertised by capabilities or sitemap.

## 5. Content

Equivalent FR/AR editorial inputs cover historic urban centrality, lived medina fabric, contemporary Guéliz/Hivernage context, differences between property typologies, asking-price versus transaction evidence, urban/heritage reference cards, preparation methodology and unavailable-service messaging. Agdal/Ménara garden references are explicitly distinguished from residential neighborhood extents and administrative boundaries. No neighborhood crosswalk, pricing hierarchy, demographic figure, return claim or fabricated model-input contract was added.

The article uses the same three narrative slots, five urban-reference cards, six methodology cards, source-card layout and services panel as the existing instances. It has no giant gallery or administrative map.

## 6. Editorial sources and verification

All URLs were opened using primary institutional sources on 2026-10-06; relevant claims were checked in the actual text:

- [UNESCO — Médina de Marrakech](https://whc.unesco.org/fr/list/331/): verified 1985 inscription, historic housing/urban functions, monuments and protected gardens. Supports the heritage fact card and historic fabric/reference descriptions; no price claim.
- [Office National Marocain du Tourisme — Modernité et tradition au Maroc](https://www.visitmorocco.com/fr/decouvrir-le-maroc/maroc-moderne): verified its Marrakech sections on medina versus Guéliz/Hivernage contemporary urban environments. Used only for urban context, not tourist itineraries, prices or returns. The published French page title is retained in the Arabic source card, with an Arabic explanatory note.
- [ANCFCC / Bank Al-Maghrib — IPAI T1 2021 technical note, page 4](https://www.ancfcc.gov.ma/media/32591/ipai-t1-2021.pdf#page=4): verified recorded-transaction and repeat-sales methodology. No historical figures are reused as current Marrakech market data.

The AUM site was found under construction; no unverified planning-publication title or URL was invented. The only numeric fact in the new article is the source-backed heritage year 1985.

## 7. Hero path

`/media/cities/marrakech/marrakech-hero-web.mp4`, backed by the exact supplied public file. Registered as video/mp4; poster null because none was provided. Image4 is the real fallback. Existing city hero defaults are used unchanged: source attachment, muted autoplay, inline playback, no controls, metadata preload, same object sizing/overlays/theme handling and genuine-playing opacity transition. The previous Rabat-only deferred-source regression was not reintroduced.

## 8. Browser request / media result

Browser asset inventory identified the Marrakech MP4 as a fetched video resource and the actual currentSrc matched it. No Casablanca/Rabat video was listed on the Marrakech page. Production endpoint probe returned HTTP 206, Content-Type video/mp4 and Content-Range bytes 0-1023/69303220.

Media inspection: non-empty H.264 MP4, 3840×2160, approximately 29.97 fps, 654 frames/21.8218 seconds, front moov atom, all 654 frames decoded successfully. No re-encoding or asset modification.

## 9. Actual playback advancement

Production desktop 1440×900: currentTime 0.0484 → 0.888293 seconds. Production mobile 390×844: 0.076585 → 0.849652 seconds. readyState 4, paused false, autoplay true, muted true, playsInline present, controls false. Video was revealed and the fallback became opacity-0 after genuine playback. Browser logs on checked production pages contained no errors/warnings.

## 10. Images

Supplied JPEGs were visually inspected and registered with localized alt text. Image1 (6000×4000), image2 (4480×6720), image3 (6000×4000) support the three existing narrative rows; image4 (4896×3264) provides the real hero fallback. All four resolved/loaded in browser QA, including mobile responsive image variants. No image was renamed, overwritten, downloaded or generated. No 2×2 gallery was added.

## 11–13. GeoJSON, detected administrative polygons and helpers

Local path: /maps/marrakech-boundaries.geojson. Parsed successfully. Exactly five valid administrative admin_level 10 Polygons; five Point helpers ignored. Existing selector/projector and shared interactive map render the geometry. File, names, FR/AR names, IDs and HCP properties are untouched; no manual polygons or inferred neighborhood assignments.

| Actual French property | OSM ID | Geometry |
| --- | --- | --- |
| Arrondissement d'Annakhil | relation/2799527 | Polygon |
| Arrondissement de Sidi Youssef Ben Ali | relation/2799529 | Polygon |
| Arrondissement de Gueliz | relation/2799533 | Polygon |
| Arrondissement de Marrakech-Medina | relation/2799534 | Polygon |
| Arrondissement de Ménara | relation/2799537 | Polygon |

OSM/ODbL attribution appears in the market map. The editorial page has zero administrative map paths.

## 14. Real dataset found: YES historically; NO approved compatible market cohort

Audited all CSV schemas containing Marrakech observations and workbook/parquet file inventory. The shared reviewed model-ready corpus contains 2,472 Marrakech records but lacks room-count and floor fields required by the current Casablanca usable-row filter. Processed clean data has 2,504 records with the same field gap. V3 pilot has 41 records, no room-count column and all floors missing. Raw/rejected/sample copies exist. A recovered archive has 20 raw rows with room/floor columns (three floors missing), but is not an approved current runtime cohort; source-recovery/pilot documentation records the unreleased evidence state.

We did not combine overlapping historical copies, derive rooms from bedrooms, fill floors, weaken the finite-field rule or silently approve raw recovery evidence. No reviewed Marrakech neighborhood-to-arrondissement crosswalk exists. Full audit and exact required cohort fields are in [MARRAKECH_CITY_HANDOFF.md](MARRAKECH_CITY_HANDOFF.md).

## 15. Market capability

Unadvertised FR/AR market preparation routes render through the SAME existing market components. They are noindex/nofollow. Five neutral administrative polygons, selected-zone controls and honest data-preparation/methodology copy work. Numeric KPIs, price classes, coverage counts, charts, rankings and tables are not fabricated. Metrics/mapping empty; provider absent; getCityMapSummary refuses any non-Casablanca data aggregation.

Public market capability remains disabled until an approved compatible cohort/provider and appropriate mapping evidence are delivered. The unchanged data branch supports future activation through provider/configuration. Current Casablanca cohort, eight-listing threshold, medians, original-row aggregation and quantile classes were not modified.

## 16–17. Model artifacts: NO; estimation unavailable

None of model.pkl/preprocessing.json/metadata.json exists in the Marrakech package. No fake files, empty placeholder package, adapter, registry entry or predictions were created. Frontend model-input validation rejects Marrakech; signed Python API returns unsupported_request with no estimated_price_mad; registry tests prove prediction/context cannot call Casablanca as fallback. Direct FR/AR Marrakech estimate URLs return 404.

Future approved package:

- models/marrakech/v1/model.pkl
- models/marrakech/v1/preprocessing.json
- models/marrakech/v1/metadata.json

Validate artifacts/parity, add dedicated city prediction/context dispatch, connect actual metadata/form/API scope under the existing security/persistence contract, test isolation, then enable flags/CTA. No new city article or market layout will be needed. See the handoff document for exact steps.

## 18–23. FR, AR, themes, desktop and mobile

FR and AR pages rendered with equivalent section hierarchy. Arabic document lang=ar and dir=rtl verified after hydration; Arabic body/source notes/map labels and disabled actions were checked. The official French ONMT publication title is intentionally preserved; shared pre-existing branding/control labels were not redesigned.

Desktop 1440×900 and mobile 390×844 were checked in light and dark for hero, imagery, section rhythm, typography, sources, services, navigation and market map/selector. No root horizontal overflow observed. Marrakech hero height 684 px on desktop, 658.3125 px on mobile; mobile height stayed stable across playback samples. Mobile menu has no active Marrakech or foreign estimator link. All four images loaded. Gueliz/Ménara zone selection worked and remained without price/count data. Arabic map used the actual Arabic feature names.

SEO follows current city policy: localized title/description and published-city sitemap entries. The existing city pages do not define explicit canonical/structured data, so none was invented for Marrakech. Market uses the existing city-specific canonical/locale alternates and noindex preparation policy. Territoires discovery link was followed successfully in the final build.

## 24–25. Casablanca and Rabat regressions

All eight pre/post FR/AR city and market body HTML hashes match exactly. Both existing city heroes were observed playing, with the same 684 px desktop proportions and nine main sections/three figures. Existing market views rendered 16 Casablanca and five Rabat shapes, with unchanged real/preparation data states. French and Arabic existing routes were smoke-tested without root overflow. Existing estimator locales were inspected; real Casablanca prediction/API behavior is verified by Python tests, not claimed as a live browser submission against a deployed gateway/database.

Only the requested generic public navigation correction changes Rabat's previous foreign-city estimator links; its article/media/market remain equivalent. Casablanca active navigation/actions retain their behavior. Approved Casablanca model package SHA-256 values before/after match (model.pkl, preprocessing.json, metadata.json). No ML artifacts, inference code, auth, entitlement, RLS, account/Admin protections, database schema or migrations were edited.

## 26. Validation

- npm run test:security: 79 passed, 0 failed (40 frontend tests plus security/Admin/RLS/market checks).
- Python Casablanca inference/API and Marrakech availability suites: 20 passed, 0 failed; real Casablanca CatBoost predictions and signed-gateway scope rejection covered.
- Final focused hero/Marrakech/regression tests after final wording/scope assertion: 4 passed, 0 failed.
- npx tsc --noEmit: passed.
- npm run lint: no warnings/errors.
- Final npm run build: passed; 35 generated pages including FR/AR Marrakech city pages. Only approved Casablanca estimate/market routes are statically advertised.

Sandboxed lint initially misdetected existing TypeScript packages and attempted an unnecessary install. It was stopped; manifest/lockfile remain byte-size/time unchanged. Lint with correct filesystem access passed. No package or lockfile edits, new dependencies or security bypasses.

## 27. Remaining blockers / limits

No remaining implementation blocker for the published city experience or geographic preparation state. Real market statistics wait for a compatible approved cohort/provider/crosswalk; real estimation waits for the ML team's approved artifacts and integration. No fake data substitutes.

The supplied 4K hero is 69.3 MB. Local mobile viewport playback was verified; this is not a physical-handset or mobile-network performance benchmark. The current approved video lifecycle was preserved rather than changing/re-encoding the user's media. Normal editorial/model/data review can proceed from the handoff.

No commit, push, deployment or Git commands. Final local preview is available on port 3017 for human review.
