# City market geography

The canonical market route is `/[locale]/cities/[citySlug]/market`. Availability comes from `CITY_REGISTRY.market`; analytics providers come from `lib/analytics/registry.ts`.

`config/city-market.ts` contains an explicit reviewed neighborhood-to-boundary crosswalk. Every entry includes evidence. No fuzzy matching, name-only administrative matching, inherited extension labels or listing-coordinate fabrication is used. Existing neighborhood statistics remain unchanged.

The corrected `public/maps/casablanca-boundaries.geojson` contains 16 real level-10 Polygon boundaries and seven Point helpers. Only Polygon/MultiPolygon features with string admin_level `10` are rendered. French names prefer `name:fr`; Arabic names prefer `name:ar`.

## Reviewed crosswalk (2026-09-26)

| Dataset label | Arrondissement | Evidence |
| --- | --- | --- |
| Anfa | Anfa | GeoNames 2557798: exact PPLX label, reference point inside the Anfa polygon |
| Oasis | Maârif | GeoNames 2543342: explicit Oasis alias of L'Oasis, reference point inside Maârif |
| Oulfa | Hay Hassani | [Official arrondissement annexes](https://hayhassani.casablancacity.ma/fr/article/991/annexes-de-larrondissement-hay-hassani), ANNEXE OULFA; GeoNames 2569308 corroborates containment |
| Roches Noires | Roches noires | GeoNames 2537994: exact PPLX label, reference point inside Roches noires |
| Californie | Aïn Chock | [Official roadworks programme](https://ainchock.casablancacity.ma/fr/actualite/2033/larrondissement-dain-chock-lancement-des-travaux-dentretien-de-la-voirie), explicitly lists this zone as belonging to the arrondissement |
| Sidi Maarouf | Aïn Chock | Same official programme, Sidi Maârouf; accent-only label variant |
| Ain Chock | Aïn Chock | Same official programme, zone d'Aïn Chock; accent-only label variant |

Local GeoNames evidence is in `data/geographic/morocco_neighborhoods.geojson`, provenance in `data/geographic/geography_manifest.json` (CC BY 4.0). Tests verify named/explicit-alias identity and unique point containment, including holes. These are neighborhood reference points, **not listing geocodes or neighborhood extent polygons**. Arrondissement attribution is an inference from the documented neighborhood location; it cannot locate every listing within that label. Administrative programme evidence is stronger where available.

The approximate GeoNames Aïn Chock point falls inside Al Fida in the corrected file and is rejected; the official administrative source is used instead. `Maarif - Twin-Center` is not silently treated as all Maârif. `Ain Diab, La Corniche` is not silently treated as all Ain Diab. Extensions, combined labels and the generic Casablanca label remain unmapped without further evidence.

## Aggregation and coverage

`getCasablancaMarketRows` exposes copies of the existing usable cohort without changing its filtering. `arrondissement-market.ts` pools original records (never averages neighborhood medians), computes count and medians of listing price, Price_m2 and surface, and applies the existing eight-listing minimum. Below-threshold medians are null, never colored or exposed as a reliable benchmark.

Of 100 neighborhoods / 1,172 usable listings, seven neighborhoods / 268 listings are mapped; 93 neighborhoods / 904 listings remain unmapped. Five of 16 arrondissements have mapped records. Four pass the threshold: Anfa (43), Hay Hassani (30), Aïn Chock (163), Maârif (27). Roches noires has five records and remains neutral. The other 11 have no mapped records. All 16 contours stay visible.

Colors represent **covered neighborhoods only**, not complete arrondissement markets. Price differences also reflect property-type mix and partial coverage; these are descriptive listing prices, not transactions, adjusted valuations or an exhaustive geographic benchmark. The neighborhood table remains independent of map selection.

## Color bins

Up to four nearest-rank quantile classes from eligible arrondissement medians only; identical cutoffs are deduplicated. Rounded MAD/m² classes in this dataset: 9,610; 9,611–14,272; 14,273–17,887; 17,888–18,000. Values are assigned to the first upper cutoff containing them. Low samples are a subtle neutral class. Classes are recalculated from data, not fixed price assumptions.

No runtime boundary downloads, tiles or extra map dependency are needed. Database schema, Admin, model and estimation behavior are not changed.
