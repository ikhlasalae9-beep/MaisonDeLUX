# Rabat city experience and model handoff

Rabat is public at `/fr/cities/rabat` and `/ar/cities/rabat`. The Casablanca reference is now instantiated through CityEditorialArticle, CityServicesSection, CityMarketIntelligence and CityMarketMap. See CASABLANCA_CITY_REFERENCE.md and RABAT_REBUILD_REPORT.md. Existing registry, marketing shell, theme tokens, hero and geographic projection are reused. Casablanca editorial and inference are unchanged.

## Capability state

- City experience / bilingual content: implemented.
- Media: four supplied JPEGs and supplied H.264 MP4 registered; no replacement assets.
- Geography: five local level-10 boundaries rendered neutrally on the MARKET route; five helper Points excluded. No administrative map is rendered in the editorial city page.
- Model: waiting for training team.
- Inference / estimation: not enabled. No adapter or model registration added.
- Market analytics: waiting for approved data. The canonical FR/AR market route renders an unadvertised, noindex preparation state with geography. Its public capability/CTA and sitemap entry remain disabled; analytics are absent.

The map uses the existing GeoJSON selector and Mercator SVG projection. Rabat has no metric classes or neighborhood crosswalk. The Casablanca-only aggregate provider explicitly refuses other cities, so registering geography cannot expose Casablanca statistics.

## ML delivery

Deliver real files only:

- `models/rabat/v1/model.pkl`
- `models/rabat/v1/preprocessing.json`
- `models/rabat/v1/metadata.json`

No empty package or placeholder artifacts are created. Supply feature order/types, accepted categories, missing and unknown handling, preprocessing transformations, target inversion, dependency versions, artifact hashes, training/data provenance and hashes, split and evaluation metrics/limitations, and fresh-process parity examples. Additional artifacts are required only if the actual trained model needs them. See `ALAE_MODEL_TRAINING_HANDOFF.md`.

Next integration task:

1. Review the delivered package and runtime compatibility; verify hashes and offline prediction parity before enabling anything.
2. Implement a dedicated `backend/inference/rabat.py` adapter according to that package; reject other cities and unsupported inputs. Never route Rabat to a legacy or Casablanca model.
3. Register Rabat explicitly in `backend/inference/registry.py`. Replace the current Casablanca-specific context dispatch with city-specific context dispatch when adding a second real adapter.
4. Review API city routing, validation, metadata/status endpoints, error behavior, prediction provenance and persistence using the existing Phase C security/entitlement contract. No schema or RLS change is implied.
5. Add a Rabat estimator/form contract; the current estimate page intentionally accepts Casablanca only. Validate unavailable/error states and city isolation end-to-end.
6. Enable registry estimation fields only after adapter/API/frontend/persistence and security tests pass. Re-run Casablanca parity and hash checks.
7. Separately approve a real Rabat analytics dataset/provider. Review neighborhood-to-arrondissement evidence, aggregation and coverage before adding metric classes or enabling `market.publicEnabled` and `analyticsRef`.

## Supplied assets inspected

JPEG dimensions: image1 2963×3950; image2 and image3 6000×4000; image4 5174×3449. Hero: H.264 MP4, 3840×2160, approximately 59.94 fps, 408 frames (6.81 seconds), 24,943,531 bytes. No dedicated poster exists; rabat-image4.jpg is the real hero fallback. The three accepted narrative positions use image2, image1 and image3. Rabat images use Next responsive optimization. Editorial images load lazily in the shared narrative layout; there is no standalone gallery. Rabat video uses preload none, is muted/inline with no native controls, and receives no source under reduced motion. Casablanca retains the default hero behavior. The original 4K video remains large on connections where autoplay proceeds; asset optimization can be reviewed separately without replacing the supplied media in this task.

## Geometry / attribution

- Souissi — relation/2799203 — Polygon
- El Youssoufia — relation/2799204 — Polygon
- Agdal-Riyad — relation/2799211 — Polygon
- Yacoub El Mansour — relation/2799212 — Polygon
- Hassan — relation/4743369 — MultiPolygon

Names, Arabic/French names, HCP identifiers and OSM IDs remain untouched in the source. Neighborhood reference names on the city page do not establish administrative membership. Attribution is OpenStreetMap contributors / ODbL; the local source has check_date 2024-10-26. See `CITY_MARKET_MAPPING.md`.

## Approved market input still required

The historical shared model-ready corpus contains 400 Rabat records from Mubawab, 26 cleaned neighborhood labels, 359 apartments, 39 unknown types, one villa and one building. All lack publication dates and coordinates. These are audit findings, not published market statistics. The city handoff identifies this shared corpus as distinct from approved city-specific input. No reviewed Rabat market cohort or crosswalk was found.

Deliver an approved Rabat-only listing cohort with row/source identity, asking price in MAD, surface, property type, reviewed neighborhood labels, deduplication and eligibility rules, provenance/hash, sample/date limitations and evidence for any neighborhood-to-boundary crosswalk. Neighborhood medians can be computed independently once the cohort is approved; arrondissement prices require the reviewed mapping. Reuse the Casablanca eight-listing threshold, original-row aggregation and price-class methodology without changing its current behavior.

When approved data arrives, add a city analytics provider and city-scoped map aggregation; set the registry analyticsRef/publicEnabled only after validation. The shared renderer then enables its existing KPI/chart/table branch. Never populate missing analytics with zero-value fake data or Casablanca records.

### Why the existing reviewed shared rows cannot use the current market cohort contract

The shared corpus is reviewed for its historical model-ready workflow (reports/data_quality/model_ready_v1_quality_report.md). That is not sufficient for the CURRENT Casablanca usable-cohort rule: lib/analytics/casablanca.ts requires finite Rooms, Bedrooms, Bathrooms and Floor in addition to positive price/area/price-per-m² and type/neighborhood. The shared Rabat schema contains bedrooms/bathrooms but no Rooms or Floor equivalents. All 400 rows therefore lack two fields required by that rule. We did not derive room counts from bedrooms, fill floors, or weaken the cohort filter for Rabat. A reviewed compatible/enriched cohort is required to reuse the same methodology. Missing dates/coordinates are documented limitations, not a newly invented exclusion rule.
