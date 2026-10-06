# Marrakech city instance — implementation and ML/data handoff

Marrakech is the third published UI instance of the existing Casablanca/Rabat city system. This is a local repository implementation; nothing has been committed, pushed or deployed.

## Current state

- City FR/AR pages: public and published through the existing city registry.
- Hero: existing ThemeVideoBackground, `/media/cities/marrakech/marrakech-hero-web.mp4`, same autoplay/source/playing/preload lifecycle as Casablanca and the fixed Rabat hero. No separate video component or deferred-city gate.
- Editorial: existing CityEditorialArticle and CityServicesSection. Three narrative rows use images 1, 2, 3; image4 is the real hero fallback. No standalone gallery or editorial-page map.
- Market route: shared CityMarketIntelligence/CityMarketMap preparation state, local GeoJSON. Not advertised or included in the sitemap; noindex/nofollow. Public market capability false, analyticsRef null.
- Market numbers/crosswalk: unavailable; metrics and neighborhoodMapping empty.
- Model, inference, estimator: waiting/not enabled. modelRef/backendStatusKey null; estimation publicEnabled false. No placeholder artifacts or empty package directories.
- Navigation: the existing capability flags now govern public header, mobile menu and footer estimation actions. An unavailable city has a non-link disabled surface. Casablanca retains its active city estimator. Rabat receives the same honest unavailable navigation state; its article, hero and market are unchanged.

## Future model delivery

Deliver only real approved files:

- `models/marrakech/v1/model.pkl`
- `models/marrakech/v1/preprocessing.json`
- `models/marrakech/v1/metadata.json`

Include feature order/types, preprocessing, category vocabulary, missing/unknown handling, target transformation/inversion, dependency versions, artifact/data hashes and provenance, split and evaluation evidence, limitations and fresh-process prediction-parity examples. Extra artifacts are required only if the actual model needs them. No Marrakech input vocabulary or predictions were fabricated for this UI task.

Application integration steps:

1. Validate the package, hash/runtime compatibility and offline parity.
2. Add a dedicated `backend/inference/marrakech.py` adapter and explicit registry prediction/context dispatch. The current context dispatcher supports Casablanca only and must become city-scoped when a real second adapter is added. Never call a Casablanca or legacy model for Marrakech.
3. Add city-specific metadata/status/form scope from the actual manifest. Extend the current Casablanca-only estimator dispatch and API input validation using the existing form/shell/security architecture; do not invent categories or change Casablanca preprocessing.
4. Verify gateway signing, guest entitlement, persistence city/model provenance, error behavior, supported scope and isolation through real integration tests. No schema/RLS change is implied.
5. Set Marrakech modelRef/backendStatusKey and estimation flags only after validation. The existing services and navigation components then activate its own route through configuration.
6. Re-run Casablanca and Rabat regressions, artifact hashes and desktop/mobile video checks.

## Market data audit

Real historical Marrakech observations exist, but no reviewed publishable cohort satisfying the CURRENT Casablanca usable-row contract was found:

- Shared reviewed model-ready CSV/parquet: 2,472 Marrakech records. Schema has bedrooms/bathrooms but no Rooms or Floor equivalents. The current market filter requires finite Rooms, Bedrooms, Bathrooms and Floor plus positive price/area/price-per-m² and a type/neighborhood. Do not derive rooms from bedrooms or fill floors.
- Current processed clean CSV: 2,504 Marrakech records, same missing room/floor contract fields.
- Raw CSV: 3,928 Marrakech records; rejected CSV: 1,424; sample: 135. These are not promoted city-market cohorts.
- V3 pilot: 41 Marrakech records; no room-count column, all 41 floor values missing.
- Recovery archive `dangling_v3_tree_87e06eeb/.../maisonlux_scrapy_v3.csv`: 20 raw Marrakech records with room/floor columns (three floors missing). This is unreleased recovered evidence, not an approved runtime market cohort. `docs/SCRAPING_V3.md` documents that the preserved local evidence is disabled and not to be mixed into a new collection; its presence/row validation flags are not market publication approval.
- No dedicated `server-data/marrakech-market.csv`, approved city-model artifacts or reviewed Marrakech neighborhood crosswalk exists.

These counts are internal audit findings, not product market statistics. Historical raw/processed/workbook/parquet copies must not be combined as independent listings.

Required market handoff: an approved, traceable Marrakech cohort with price in MAD, area, type, reviewed neighborhood, finite room/bedroom/bathroom/floor fields consistent with the existing cohort rule, stable row/source identifiers, deduplication/eligibility decisions, provenance/hash and date/coverage limitations. Arrondissement statistics additionally require reviewed neighborhood-to-boundary evidence or reliable geospatial evidence. Do not infer mapping from Guéliz/Ménara-like names or helper admin-centre Points.

After approval, add a Marrakech analytics provider and city-scoped aggregation using the unchanged Casablanca methodology: original-row pooling, eight-listing minimum, existing medians and quantile price classes. Enable market analyticsRef/publicEnabled after validation. The existing shared market data branch then renders KPIs, charts/table and real classes. Model and market activation remain independent.

## Geography and media

`public/maps/marrakech-boundaries.geojson` contains five level-10 Polygons and five Point helpers. Names, FR/AR names, OSM/HCP identifiers and geometry remain untouched. OSM/ODbL attribution is shown by the shared market map.

| Administrative area | OSM ID | Geometry |
| --- | --- | --- |
| Annakhil | relation/2799527 | Polygon |
| Sidi Youssef Ben Ali | relation/2799529 | Polygon |
| Gueliz | relation/2799533 | Polygon |
| Marrakech-Medina | relation/2799534 | Polygon |
| Ménara | relation/2799537 | Polygon |

Hero: 69,303,220 bytes, H.264 MP4, 3840×2160, 29.970 fps, 654 frames, 21.8218 seconds. Front moov atom; all 654 frames decoded successfully. No re-encoding. The supplied 4K file is sizeable; local viewport QA verifies playback, not mobile-network performance on a physical handset.

JPEGs: image1 6000×4000, image2 4480×6720, image3 6000×4000, image4 4896×3264. No dedicated poster exists; poster remains null and image4 is the fallback. Narrative images use the existing responsive/lazy Next image path. No asset was renamed, overwritten or downloaded.

See [MARRAKECH_IMPLEMENTATION_REPORT.md](MARRAKECH_IMPLEMENTATION_REPORT.md) for sources, runtime checks, tests, publication/SEO policy and exact file changes.
