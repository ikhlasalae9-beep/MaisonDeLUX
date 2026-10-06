> Superseded by [Rabat rebuild report](RABAT_REBUILD_REPORT.md). This historical report describes the initial layout that was subsequently removed.

# Rabat implementation report — 2026-10-06

## Audit and architecture

Before implementation, inspected: `package.json`; `config/cities.config.ts`, `city-content.ts`, `city-media.ts`, `city-market.ts`; `lib/cities/registry.ts`; `lib/analytics/registry.ts`, `market-geometry.ts`, `market-map.ts`; `backend/inference/registry.py` and artifact references in `casablanca.py`; city detail/estimate/market routes; `CityFoundation`, `CityCapabilityActions`, `CityExplorer`, `ThemeVideoBackground`; frontend city foundation/market tests; Casablanca Python tests; model handoff, geographic and market mapping documentation. Inspected supplied JPEG formats/dimensions, MP4 codec/dimensions/frame rate, and all Rabat GeoJSON properties. Captured SHA-256 of the three Casablanca package files before editing. No AGENTS.md was found by the repository file search.

Subsequent audit/QA also inspected the Territoires index, CasablancaSpotlight, sitemap, locale layout, RouteShell and existing localization availability labels. The index had a Casablanca-only spotlight; it now reuses CityExplorer for additional public cities, retaining the spotlight.

## Implementation

1. Registry: Rabat is published/public, with Rabat content/media/SEO refs. Estimation and market flags remain false; backend model key, model ref and analytics ref remain null. Other cities retain their existing states.
2. FR/AR content: administrative capital and Atlantic identity; architecture and conservative residential context; five reference neighborhoods without an administrative crosswalk; equivalent availability copy and metadata.
3. Media: supplied MP4 and all four JPEGs, localized alt labels and video accessibility text; first actual JPEG fallback, poster null. No media was overwritten or downloaded. Rabat uses responsive optimized images and lazy gallery loading. Deferred video is muted, inline and control-free; reduced motion keeps its source absent. Default Casablanca media behavior is preserved.
4. City page: existing dynamic city route, hero, section/card/theme primitives, marketing shell and metadata. Rabat gets introduction, editorial cards, four-image gallery, neighborhood references, administrative map and a non-link estimation availability panel.
5. Geography: local read on the server, existing selector/Mercator SVG projection, neutral fill with no prices or classes. Source file remains unchanged. Four Polygons, one MultiPolygon and five ignored helper Points. Localized names, OSM and HCP identifiers remain preserved; attribution is visible.
6. Boundaries: Souissi relation/2799203; El Youssoufia relation/2799204; Agdal-Riyad relation/2799211; Yacoub El Mansour relation/2799212; Hassan relation/4743369 (MultiPolygon).
7. Market: disabled pending approved data. Rabat map config has no metrics or crosswalk. The existing Casablanca-only aggregate provider now explicitly refuses any other city, preventing accidental Casablanca-record reuse when registering Rabat geography. No Rabat analytics provider or statistics were added.
8. Estimation: disabled pending real model integration. No backend adapter, registration, model package, placeholder directory or prediction was created. Direct estimate/market routes remain closed. Existing global estimation links continue to target Casablanca.
9. Future handoff: real artifacts belong at `models/rabat/v1/model.pkl`, `models/rabat/v1/preprocessing.json`, `models/rabat/v1/metadata.json`. Required package evidence and exact adapter/registry/API/form/persistence/security/activation steps are in `RABAT_CITY_HANDOFF.md`. A second real adapter must also replace the registry's current Casablanca-specific context dispatch. No speculative inference abstraction was added now.

## Verification

- `npm run test:security`: 72 passed, 0 failed (frontend, security, Admin, real PostgreSQL RLS and market regressions).
- Frontend-only suite after the video adjustment: 33 passed, 0 failed.
- Final focused Rabat tests after navigation extension: 2 passed, 0 failed, including FR/AR static render, registry capability isolation, local media, sitemap/index discovery, disabled providers and five valid projected boundaries.
- `python -m pytest tests/test_casablanca_inference.py tests/test_casablanca_api.py -q`: 18 passed, 0 failed; includes Rabat rejection and real Casablanca inference.
- `npx tsc --noEmit`: passed; final production build also passed TypeScript/lint validation.
- Final `npm run build`: passed; generated FR/AR Rabat city pages and only Casablanca estimate/market pages.
- Initial sandboxed build failed EPERM creating Next output; retry with reviewed filesystem access passed. Browser preview needed reviewed local socket access. Neither issue remains a build blocker.
- Before/after model package hashes are identical:
  - metadata.json: c4742651aeb3f0717b33fc2cdf8374a988cd78341f9c988e955411a6136b3f69
  - model.pkl: b5ba50e9b6fd35203b556c840fe97170ee23441a6cce0ffa927f3c09944b8e1d
  - preprocessing.json: 70f7e7ee1ee6318b6fc379c16527da7558184b0b97f792849e5a163f3fd1c7e9

## Browser QA and limits

Production previews checked FR and AR, desktop 1440×900 and mobile 390×844, light and dark. Arabic root direction is RTL. Checked hero fallback, text/cards, gallery, non-link availability, five map paths, footer, mobile menu and absence of horizontal overflow. All four gallery assets loaded with positive natural dimensions; no Rabat console warning/error was observed. Final Territoires Rabat discovery link was followed successfully. Both disabled Rabat service routes show 404 and no estimator/analytics. Casablanca city and estimator form were smoke-tested; no console errors observed on the estimator.

The browser session reports prefers-reduced-motion: reduce. Verified Rabat's video has no source and the real fallback displays. Normal-motion autoplay was not exercised and remains a manual QA item; do not interpret the fallback checks as proof of video playback. The original supplied MP4 is about 25 MB / 4K and remains a mobile bandwidth consideration when autoplay is allowed.

The preview has no live inference backend attached: the existing Casablanca spotlight honestly reports temporary unavailability. Browser form submission/persistence was not exercised. Real predictions and API behavior were verified through the 18 Python tests; this is not a live deployed inference check.

## Files changed by this task

- config/cities.config.ts
- config/city-content.ts
- config/city-media.ts
- config/city-market.ts
- app/[locale]/cities/page.tsx
- app/[locale]/cities/[citySlug]/page.tsx
- components/city/CityGeography.tsx (new)
- components/media/ThemeVideoBackground.tsx
- lib/analytics/market-map.ts
- tests/frontend/city-foundation.test.ts
- tests/frontend/rabat.test.ts (new)
- docs/ALAE_MODEL_TRAINING_HANDOFF.md
- docs/CITY_MARKET_MAPPING.md
- docs/GEOGRAPHIC_DATA.md
- docs/RABAT_CITY_HANDOFF.md (new)
- docs/RABAT_IMPLEMENTATION_REPORT.md (new)

Build/typecheck also refreshed generated .next output and TypeScript cache. No Git commands were run, so this list describes task edits, not a comparison against an unknown repository baseline. No push, merge, deployment, training, schema/RLS edits or changes to ML artifacts.

## Readiness

| Capability | Casablanca | Rabat |
| --- | --- | --- |
| City page | READY (smoke-tested) | READY (FR/AR browser-tested) |
| Media | READY (existing) | Images/fallback READY; normal-motion autoplay UNVERIFIED |
| Geography | READY (regression tests) | READY (5 shapes, no crosswalk) |
| Market analytics | READY (regression tests) | WAITING for approved data |
| Model | READY (hashes/parity tests) | WAITING for training team |
| Inference | READY (Python/API tests; live preview backend absent) | WAITING / not enabled |
| Estimation | READY (form + inference tests; browser submission unverified) | WAITING / not enabled |
