# Rabat rebuild report — 2026-10-06

## Correction

The initial implementation gave Rabat its own card/gallery/map arrangement instead of instantiating the accepted Casablanca article. Removed the standalone four-image grid, standalone architecture/context cards, neighborhood pills, editorial-page administrative map and standalone availability panel. Preserved the supplied GeoJSON, media, capability isolation and useful geographic utility. CityGeography is no longer imported or rendered by the city page.

The pre-edit source/browser inventory is in [CASABLANCA_CITY_REFERENCE.md](CASABLANCA_CITY_REFERENCE.md). FR/AR Casablanca city, market and estimator routes were opened before editing. Pre-refactor city and market HTML hashes were captured in reports/rabat-reference-hashes.json.

## Section-by-section mapping

| Casablanca reference | Rabat instance |
| --- | --- |
| City video hero, region/title/subtitle/actions | Same route/ThemeVideoBackground/classes/sizing; Rabat media and unavailable-estimation status |
| Editorial dek plus fact card | Rabat territory introduction; UNESCO 2012 inscription fact, explicitly not a property indicator |
| 01 Territory image + narrative | Atlantic/Bouregreg/capital context, image2 |
| 02 Built environment image + narrative | Historic/modern city fabric, image1 |
| 03 Market interpretation image + narrative | Transactions versus asking prices and pending local statistics, image3 |
| Dark neighborhood cards | Five sourced groups: Médina/Oudayas, Hassan, Agdal, Hay Riad/Souissi, L’Océan/Akkari |
| MaisonDeLUX factor cards and method note | Same six-card structure; preparation principles, explicitly not a validated Rabat model input contract |
| Conclusion beside institutional source card | Local analysis conclusion and three Rabat-relevant institutional/methodology sources |
| Final dark services panel | Same component/classes, with non-link estimation and market preparation states |
| Marketing navbar/footer | Same shell; global estimation links explicitly identify Casablanca on unavailable-city pages |

Both city pages have nine main sections and three editorial figures. CityEditorialArticle is the extracted accepted Casablanca renderer; CityServicesSection is the extracted accepted services panel. Casablanca copy, source list, typography/classes and content order remain unchanged. The compatibility CasablancaEditorialArticle entry point delegates to the shared renderer.

## Hero and images

Rabat uses the existing ThemeVideoBackground and `public/media/cities/rabat/rabat-hero-web.mp4`. Casablanca hero code/behavior was not modified in this rebuild. Existing Rabat reduced-motion/deferred-source settings are retained. Muted autoplay, inline playback, no native controls, failure fallback and responsive object sizing remain in the shared component. At 1440×900, both city heroes measure 684 px. At mobile 390×844 the same hero sizing rule applies (Casablanca measured 658.3125 px).

No dedicated Rabat poster exists: `media.hero.poster` remains null. No nonexistent path was invented. `rabat-image4.jpg` is the real hero fallback; image2, image1 and image3 occupy the three existing article image positions. All four supplied images are therefore used without a new gallery. Localized alt labels identify Hassan Tower, riverfront development, the Bouregreg landscape and the Mohammed V mausoleum. No images/videos were downloaded, replaced or rewritten.

Normal-motion Rabat autoplay is UNVERIFIED: the in-app browser reports prefers-reduced-motion: reduce, so its video source is intentionally absent and the real fallback is shown. An attempt to use Chrome failed because that browser is unavailable. Casablanca video playback was observed in its preserved existing behavior. The supplied Rabat MP4 remains H.264, 4K, approximately 60 fps / 25 MB; a normal-motion/mobile-bandwidth check remains for human review.

## FR/AR content and sources

FR and AR share the same complete editorial schema, section order, imagery, source card and service states. Arabic uses RTL and equivalent factual/availability content.

Sources shown in the final UI:

1. [UNESCO — Rabat, Modern Capital and Historic City: a Shared Heritage](https://whc.unesco.org/en/list/1401/): 2012 inscription and the relationship of historic and modern urban fabric. The year is a heritage reference, not demographic/market data.
2. [CNES Geoimage — Rabat-Salé : la métropole-capitale du Maroc](https://cnes.fr/geoimage/rabat-sale-metropole-capitale-maroc): Atlantic/Bouregreg position, administrative role, and historical neighborhood/urban development. No historical population or price figures are republished as current facts.
3. [ANCFCC / Bank Al-Maghrib — IPAI technical note, T1 2021, page 4](https://www.ancfcc.gov.ma/media/32591/ipai-t1-2021.pdf#page=4): recorded transactions and repeat-sales index methodology. Clearly marked as a methodology reference; no historical market numbers are reused.

An AURS source was researched but excluded after its URL timed out in both retrieval and browser checks. A newer ANCFCC PDF was excluded after a 403 response; the accessible archived technical note directly supports the methodology claim. The final list has three sources, matching the reference card's structure without copying Casablanca city sources.

## Market route and real-data audit

`/fr/cities/rabat/market` and `/ar/cities/rabat/market` now render a noindex preparation page through CityMarketIntelligence and the SAME CityMarketMap used by Casablanca. The route is not advertised: registry market.publicEnabled remains false, analyticsRef null, no city CTA or sitemap market entry. The shared market heading/map layout/zone selector/selected-zone panel/legend space/structure and neighborhood-methodology sections are present. Numeric KPIs, top-neighborhood cards, charts, rankings and tables remain suppressed until real approved data exists. No zero-filled/mock dataset or Casablanca numbers are passed to Rabat.

The historical shared repaired CSV contains 400 Rabat records from Mubawab, 26 cleaned neighborhood labels; repaired types are 359 apartments, 39 unknown, one villa and one building. All 400 lack publication dates and coordinates. These are internal audit counts, NOT product market statistics. No Rabat-only approved runtime dataset/provider or reviewed neighborhood-to-arrondissement mapping was found. Existing city delivery documentation distinguishes this shared historical corpus from approved city-specific input.

Rabat market UI/geography ready; market statistics blocked by missing approved Rabat market dataset.

Required next data handoff: an approved Rabat listing cohort with stable row/source identity, asking price in MAD, surface, type, normalized/reviewed neighborhood label, deduplication/eligibility rules, provenance/hash and known date/coverage limitations. Arrondissement statistics additionally require a reviewed label-to-boundary crosswalk with evidence. Coordinates are not fabricated or required merely to draw administrative shapes. Apply the existing eight-listing minimum, original-record aggregation and quantile class methodology after approval; current Casablanca thresholds/cohort/calculations are untouched.

CityMarketIntelligence now accepts city configuration plus real data or null. Its existing data branch activates KPIs/charts/table when a real provider is connected. CityMarketMap accepts either the real summary or geography config; the latter shows neutral shapes and preparation copy without statistical classes. The old CasablancaMarketIntelligence export is a compatibility alias.

## GeoJSON

The existing local file is unchanged. Five valid level-10 shapes: Agdal-Riyad relation/2799211 (Polygon), El Youssoufia relation/2799204 (Polygon), Hassan relation/4743369 (MultiPolygon), Souissi relation/2799203 (Polygon), Yacoub El Mansour relation/2799212 (Polygon). Five helper Point features are filtered out. French/Arabic names, HCP and OSM IDs are preserved. Same projection, holes/islands handling and interactive map component as Casablanca; local file loading, no remote geographic API or new map dependency. OSM/ODbL attribution remains visible; Rabat does not claim a GeoNames or CasablancaCity crosswalk.

## Estimation/model handoff

Rabat estimation stays disabled and cannot dispatch to Casablanca. Its city-specific service states are not links. Existing global navigation links name Casablanca explicitly; Casablanca itself retains its original CTA text/behavior. Direct Rabat estimate route remains closed/404. No adapter, model registry entry, prediction, fake artifact or empty model directory was added.

Future real artifact paths:

- `models/rabat/v1/model.pkl`
- `models/rabat/v1/preprocessing.json`
- `models/rabat/v1/metadata.json`

Validate hashes/runtime/feature/preprocessing/target/parity/metrics contract, add a dedicated adapter and city-specific prediction/context dispatch, connect the existing API/form/persistence contract, test isolation/security, then enable estimation and its CTA. The article/services/market website template no longer needs a new Rabat layout. See [RABAT_CITY_HANDOFF.md](RABAT_CITY_HANDOFF.md) for exact steps and required ML evidence. No hypothetical Rabat accepted feature schema was invented.

## Regression, tests and build

- Pre/post FR/AR Casablanca city and market renderToStaticMarkup hashes match exactly. Focused tests enforce these captured pre-refactor hashes, including accepted copy and classes.
- `npm run test:security`: 75 passed, 0 failed, including frontend, market, Admin, security and PostgreSQL RLS regressions.
- `python -m pytest tests/test_casablanca_inference.py tests/test_casablanca_api.py -q`: 18 passed, 0 failed. Tests run real CatBoost predictions through the existing authenticated gateway API policy and reject Rabat; no fake prediction substitute.
- `npx tsc --noEmit`: passed.
- Final `npm run build`: passed, including lint/type validation, no newly introduced hook warnings.
- Casablanca model.pkl, preprocessing.json and metadata.json SHA-256 values are unchanged from the approved package and previous audit. Inference, approved market calculation/data/geometry/crosswalk and estimator files were not edited.
- No Phase C auth, guest entitlement, Supabase Auth, schema, RLS, Admin, account security, Landing design, training or ML artifacts were changed.

## Browser comparison

Opened both city tabs and compared their rendered views. Used the same comparison tab where necessary to normalize viewport because the browser override applied to the current surface only. Compared at desktop 1440×900 and mobile 390×844. FR/AR, light/dark, typography, image treatment, content width, editorial order, source-card classes, services panel, footer and navigation were checked. Rabat has no city-page map or 2×2 gallery. No horizontal overflow was observed. All three editorial images and the fourth-image hero fallback loaded.

Market comparison verified Casablanca's 16 shapes/real classes and Rabat's five neutral shapes at the same layout. Rabat selected Hassan correctly without a price/count; FR/AR map labels, mobile stacking and light/dark rendering were checked. Rabat console error/warning logs were empty on checked city/market pages. Only active-city assets appeared in the city DOM.

Both Casablanca estimator locales were opened. Real prediction/API validation was verified by Python runtime tests; a browser submission against a live deployed gateway/database was not performed. This distinction is retained rather than claiming end-to-end persistence verification.

Remaining human review: normal-motion Rabat autoplay and mobile bandwidth; approve the historical Rabat cohort or deliver a new approved cohort and evidenced crosswalk; review the factual bilingual editorial. No approval is needed to keep the safe current capability states.

## Files changed in this rebuild

- `components/city/CityEditorialArticle.tsx` (new shared renderer)
- `components/city/CasablancaEditorialArticle.tsx` (compatibility wrapper)
- `components/city/CityServicesSection.tsx` (new extracted shared services panel)
- `config/city-editorial.ts` (new editorial resolver/type)
- `config/rabat-editorial.ts` (new bilingual source-grounded article)
- `config/city-media.ts` (localized alt labels and real fourth-image fallback)
- `app/[locale]/cities/[citySlug]/page.tsx` (same template for both cities)
- `components/market/CityMarketIntelligence.tsx` (new shared renderer/data availability branch)
- `components/market/CasablancaMarketIntelligence.tsx` (compatibility alias)
- `components/market/CityMarketMap.tsx` (configuration and geography-only availability state)
- `app/[locale]/cities/[citySlug]/market/page.tsx` (unadvertised/noindex preparation route)
- `lib/cities/registry.ts` (context-aware global CTA label)
- `components/layout/Navbar.tsx`, `Footer.tsx`, `RouteShell.tsx` (CTA city labeling only)
- `tests/frontend/rabat.test.ts`
- `tests/frontend/city-template.test.ts` (new regression/capability tests)
- `reports/rabat-reference-hashes.json` (pre-edit reference evidence)
- `docs/CASABLANCA_CITY_REFERENCE.md` (pre-edit section inventory)
- `docs/RABAT_CITY_HANDOFF.md`, `CITY_MARKET_MAPPING.md`, `RABAT_IMPLEMENTATION_REPORT.md`
- `docs/RABAT_REBUILD_REPORT.md`

Generated Next output/TypeScript caches were refreshed by validation. This is a list of edits made by this task, not a Git comparison: no Git commands were executed. No push, merge or deployment occurred.

### Why the existing reviewed shared rows cannot use the current market cohort contract

The shared corpus is reviewed for its historical model-ready workflow (reports/data_quality/model_ready_v1_quality_report.md). That is not sufficient for the CURRENT Casablanca usable-cohort rule: lib/analytics/casablanca.ts requires finite Rooms, Bedrooms, Bathrooms and Floor in addition to positive price/area/price-per-m² and type/neighborhood. The shared Rabat schema contains bedrooms/bathrooms but no Rooms or Floor equivalents. All 400 rows therefore lack two fields required by that rule. We did not derive room counts from bedrooms, fill floors, or weaken the cohort filter for Rabat. A reviewed compatible/enriched cohort is required to reuse the same methodology. Missing dates/coordinates are documented limitations, not a newly invented exclusion rule.

## Readiness

| Feature | Casablanca | Rabat |
| --- | --- | --- |
| City template | READY | READY |
| Hero video | READY (playback observed) | CONFIGURED; normal-motion autoplay unverified |
| Editorial content | READY | READY |
| Editorial images | READY | READY |
| Editorial sources | READY | READY (3 verified sources) |
| GeoJSON | READY | READY |
| Market route | READY | READY (unadvertised/noindex preparation state) |
| Market map | READY | READY (neutral geography only) |
| Market statistics | READY | BLOCKED: approved cohort/mapping required |
| Model | READY | WAITING |
| Inference | READY (real Python/API tests) | WAITING |
| Estimation | READY (form + real runtime tests) | WAITING |
| FR | READY | READY |
| AR | READY | READY |
| Mobile | READY (reference comparison) | READY |
| Light/Dark | READY (reference comparison) | READY |

