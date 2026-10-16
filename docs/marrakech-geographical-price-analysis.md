# Marrakech geographical price analysis

Review: 16 October 2026. **Implemented: a partial price-based choropleth for two of five arrondissements.** Coverage is evidence-backed neighborhood-label attribution, not independently geocoded listing verification. No coordinates or neighborhood boundaries were invented.

## Casablanca reference audit

Inspected `config/city-market.ts`, `lib/analytics/market-map.ts`, `lib/analytics/arrondissement-market.ts`, the actual CSV loader, polygons, GeoNames file, mapping tests and rendered price map. Its seven explicit labels allocate 268 of 1,172 observations; four arrondissements meet n≥8. Original observations are pooled, per-listing price/area ratios feed medians, then rounded median quantiles feed the legend. Unmapped/low-sample areas remain neutral.

Reopened the official [Aïn Chock roadworks programme](https://ainchock.casablancacity.ma/fr/actualite/2033/larrondissement-dain-chock-lancement-des-travaux-dentretien-de-la-voirie), which explicitly covers Californie, Sidi Maârouf and Aïn Chock, and the official [Hay Hassani annexes](https://hayhassani.casablancacity.ma/fr/article/991/annexes-de-larrondissement-hay-hassani), which includes Oulfa. Existing GeoNames identity/alias and unique containment tests pass for Anfa, Oasis and Roches Noires. The rejected conflicting Aïn Chock point is not reused.

**Qualification:** reference-point containment establishes a neighborhood location, not its whole extent or individual listing positions. Administrative-source relationships are stronger, but neither city can certify every advertisement location without coordinates. No Casablanca mappings, statistics or inference files were changed. Its same presentation is reused without inheriting its geographic labels.

## Cohort and geographic inputs

Re-read the existing reviewed model-ready CSV, snapshot builder, snapshot provenance, raw neighborhood/location fields, GeoNames and all five administrative polygons. Current counts match the earlier audit: 2,472 source records; 1,339 retained apartment-sale observations; 1,133 exclusions; 62 labels; 30 neighborhood benchmarks meeting n≥8. All original records lack latitude, longitude and publication dates. Original labels and raw locations of retained records were inspected; no listing collection occurred.

The shared GeoNames file has only two Marrakech neighborhood points: Guéliz (2548531) and Hivernage (11049541). Both fall uniquely inside Guéliz in the repository polygons. They corroborate municipal relationships; they are not fictional listing coordinates. OSM/ODbL boundary IDs and HCP tags are preserved, with polygon bytes pinned by SHA256. They are existing administrative outlines, not newly certified cadastral survey geometry.

Snapshot SHA256: `6f538fb49fa0db745db3872832e41312454fd629cc1c604697d4b97b7705d4b9` (unchanged). Boundary SHA256: `dab20b0bf79164b6a48fd4062508bf1db6a34c739845b8ddc89c39856d52ab9a` (unchanged).

## Geographic evidence and crosswalk

Machine-readable review: [`data/geographic/marrakech-market-crosswalk.json`](../data/geographic/marrakech-market-crosswalk.json). Every current label has an original cohort label, source original spellings, normalized name, count, status, method, arrondissement/OSM/HCP identifiers where assigned, evidence page/row anchors and ambiguity notes. Normalization removes accents/case/outer spaces for audit only; allocation uses the **exact reviewed cohort label**. No fuzzy matching, automatic article substitution, prefix expansion or road allocation occurs.

Primary municipal sources (downloaded and visually inspected; only geographic facts are retained in the crosswalk, not personal directory contacts):

- [gueliz](https://www.ville-marrakech.ma/images/blog/brochure/gueliz.pdf), Commune de Marrakech; accessed 2026-10-16; SHA256 `2e9d306041019e5cae3bd388dfa4a2ddc0c9206f51b87a29ee803f7a98d9a829`.
- [menara](https://www.ville-marrakech.ma/images/blog/brochure/menara.pdf), Commune de Marrakech; accessed 2026-10-16; SHA256 `f425b4ad8ca1f28f5b296956b70ab29ca7811a4e4504b8c6fafad460c4cbc897`.
- [programme-2025-2027](https://www.ville-marrakech.ma/images/blog/brochure/avis_%2B_programme_previsionnel_2025-2027.pdf), Commune de Marrakech; accessed 2026-10-16; SHA256 `6dc54c24784a9634c9b90eea89425074f1808b2ec664e40d421b655f942f60aa`.

The older directories explicitly pair neighborhood/address fields with the ARDS arrondissement column. Reviewed spelling equivalents are individually documented (for example Samlalia/Semlalia and Roman/Arabic Massira suffixes); they are never generalized to other labels. The 2025 municipal programme, PDF page 3, items 14/19 and 16, explicitly locates Daoudiate in Guéliz and Mhamid in Ménara. This current explicit source overrides the conflicting older Ménara-directory Daoudiate row. The conflict remains recorded rather than silently discarded.

Research also considered the municipal Médina directory, HCP references, current municipal arrondissement/population listing, urban-planning material and tourist descriptions of Palmeraie. A pharmacy or tourist label alone does not settle unresolved extents. Broad Palmeraie/Ennakhil, Agdal and Targa marketing sectors, all roads, Boulevard Med 6, and other unresolved labels remain excluded. The available documents do not establish a trustworthy whole-label footprint for these cases. Small uncorroborated labels are not allocated merely to increase coverage.

### Complete label review

| Original cohort label | Retained n | Status | Attribution | Evidence locator |
| --- | ---: | --- | --- | --- |
| Agdal | 76 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Ain Mezouar | 23 | verified-label-attribution | Arrondissement de Ménara | menara, PDF p.2, AIN MEZOUAR |
| Amelkis | 7 | unverified | — | Unassigned; see recorded ambiguity notes |
| Amerchich | 12 | verified-label-attribution | Arrondissement de Gueliz | gueliz, PDF p.11, HOPITAL MED VI |
| Arset Ben Chebli | 2 | unverified | — | Unassigned; see recorded ambiguity notes |
| Arset El Maach | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| Arset Sbaia | 5 | unverified | — | Unassigned; see recorded ambiguity notes |
| Assif | 6 | unverified | — | Unassigned; see recorded ambiguity notes |
| Azli | 2 | verified-label-attribution | Arrondissement de Ménara | menara, PDF p.1, ADOHA |
| Azzouzia | 8 | unverified | — | Unassigned; see recorded ambiguity notes |
| Bab Ighli | 3 | unverified | — | Unassigned; see recorded ambiguity notes |
| Belbekkar | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| Ben Saleh | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| Bouaakkaz | 6 | unverified | — | Unassigned; see recorded ambiguity notes |
| Boukar | 8 | unverified | — | Unassigned; see recorded ambiguity notes |
| Boulevard Med 6 | 39 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Boumesmar | 2 | unverified | — | Unassigned; see recorded ambiguity notes |
| Camp Al Ghoul | 45 | verified-label-attribution | Arrondissement de Gueliz | gueliz, PDF p.9, EZZAYTOUNE |
| Daoudiat | 25 | verified-label-attribution | Arrondissement de Gueliz | programme-2025-2027, PDF p.3, 14 and 19 |
| El Hara | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| El Moukef | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| Ennakhil (Palmeraie) | 58 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Guéliz | 342 | verified-label-attribution | Arrondissement de Gueliz | gueliz, PDF p.8, GUELIZ |
| Hay Al Bahja | 2 | unverified | — | Unassigned; see recorded ambiguity notes |
| Hay Al Hassani | 3 | verified-label-attribution | Arrondissement de Ménara | menara, PDF p.5, AL MANZAH |
| Hay Alfadl | 7 | unverified | — | Unassigned; see recorded ambiguity notes |
| Hay Annahda | 2 | unverified | — | Unassigned; see recorded ambiguity notes |
| Hay Firdaouss | 2 | unverified | — | Unassigned; see recorded ambiguity notes |
| Hay Mabrouka | 34 | verified-label-attribution | Arrondissement de Gueliz | gueliz, PDF p.10, HAY MABROUKA |
| Hay Saada | 11 | unverified | — | Unassigned; see recorded ambiguity notes |
| Hay Saada 1 | 2 | unverified | — | Unassigned; see recorded ambiguity notes |
| Hay Targa | 26 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Hay Yasmina | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| Hay Zitoun | 2 | unverified | — | Unassigned; see recorded ambiguity notes |
| Hivernage | 74 | verified-label-attribution | Arrondissement de Gueliz | gueliz, PDF p.14, L’HIVERNAGE |
| Issil | 11 | verified-label-attribution | Arrondissement de Gueliz | gueliz, PDF p.17, MOGADOR |
| Izdihar | 22 | verified-label-attribution | Arrondissement de Gueliz | gueliz, PDF p.3, AL IZDIHAR |
| Iziki | 2 | verified-label-attribution | Arrondissement de Ménara | menara, PDF p.6, AMADDAH |
| Jbilat | 2 | unverified | — | Unassigned; see recorded ambiguity notes |
| Les Portes de Marrakech | 17 | unverified | — | Unassigned; see recorded ambiguity notes |
| Majorelle | 24 | unverified | — | Unassigned; see recorded ambiguity notes |
| Masmoudi | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| Massira 1 | 13 | verified-label-attribution | Arrondissement de Ménara | menara, PDF p.2, AL ANDALOUSS |
| Massira 2 | 3 | verified-label-attribution | Arrondissement de Ménara | menara, PDF p.3, AL FATH |
| Massira 3 | 2 | verified-label-attribution | Arrondissement de Ménara | menara, PDF p.2, AL AZHAR |
| Mhamid | 41 | verified-label-attribution | Arrondissement de Ménara | programme-2025-2027, PDF p.3, 16 |
| Ouasis | 12 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Riad Al Atlas | 10 | unverified | — | Unassigned; see recorded ambiguity notes |
| Riad Zitoun | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| Route Amizmiz | 24 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Route Casablanca | 140 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Route d'Agadir - Essaouira | 16 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Route de Fez | 11 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Route de Ouarzazate | 9 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Route de Safi | 45 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Route de Tahanaout | 7 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Route de l'Ourika | 12 | ambiguous | — | Unassigned; see recorded ambiguity notes |
| Samlalia | 62 | verified-label-attribution | Arrondissement de Gueliz | gueliz, PDF p.11, HAY SEMLALIA |
| Sanaoubar | 5 | unverified | — | Unassigned; see recorded ambiguity notes |
| Sidi Abbad | 5 | unverified | — | Unassigned; see recorded ambiguity notes |
| Sidi Ghanem | 1 | unverified | — | Unassigned; see recorded ambiguity notes |
| Sidi Youssef | 1 | ambiguous | — | Unassigned; see recorded ambiguity notes |

## Coverage and published statistics

**716/1,339 observations (53.5%) attributed; 623 (46.5%) unassigned.** Seventeen labels are assigned, 45 excluded from arrondissement aggregation. The five outline geometries remain visible. Percentages are shares of the retained cohort, not market shares or claims of complete arrondissement coverage. Independently rounded arrondissement percentages need not sum to the rounded total.

| Arrondissement | Attributed n | Median asking MAD | Median individual MAD/m² | Median declared m² | Labels | Share retained | Published |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Arrondissement d'Annakhil | 0 | — | — | — | 0 | 0% | No — insufficient verified coverage |
| Arrondissement de Sidi Youssef Ben Ali | 0 | — | — | — | 0 | 0% | No — insufficient verified coverage |
| Arrondissement de Gueliz | 627 | 1550000 | 18690 | 85 | 9 | 46.8% | Yes |
| Arrondissement de Marrakech-Medina | 0 | — | — | — | 0 | 0% | No — insufficient verified coverage |
| Arrondissement de Ménara | 89 | 762000 | 9239 | 77 | 8 | 6.6% | Yes |

## Calculations and classification

The provider validates the original snapshot and rejects duplicate IDs, invalid/non-positive prices or surfaces, repeated crosswalk labels, missing evidence, wrong boundary/HCP identifiers, unresolved allocations, stale snapshot/boundary hashes and count reconciliation failures. Only the existing apartment-sale cohort enters aggregation. A listing is allocated at most once; ambiguous/unverified labels never enter a price group.

`ratio_i = asking_price_i / declared_surface_i`. Each arrondissement median is computed over its original eligible observations, **never by averaging neighborhood medians** or dividing median price by median surface. Individual neighborhoods may have fewer than eight rows if their arrondissement pool passes the unchanged threshold of eight. Below threshold, all published medians are null.

Same nearest-rank quantile method as Casablanca: eligible arrondissement median ratios are rounded to MAD, sorted, and cut at ranks ceil(q×N), q∈{.25,.5,.75,1}; repeated cutoffs are removed. With only two eligible arrondissements, there are two honest classes: **9,239 MAD/m²** and **9,240–18,690 MAD/m²**. These are class boundaries across the two observed medians, not listing-price min/max or predetermined budget bands. Stronger blue means higher observed median; unsupported areas are neutral/hatch. The UI uses the same shared rendering ramp and legend for both cities.

The panel shows count, median asking price, median individual ratio, median surface, contributing labels and share of retained city records. The legend states asking prices, partial neighborhood coverage, n≥8, attribution count/share and unassigned count. It also states that attribution is by neighborhood label without individual coordinates. No identity-based colors remain, including the map-provider failure fallback. Technical identifiers are kept in evidence files or a secondary fallback disclosure.

## Reproduce and verify

Run from the repository root:

```powershell
node --require ./tests/register-server-only.cjs --import tsx scripts/audit_marrakech_geography.cjs
npm run test:market
```

The audit rewrites only [`reports/marrakech-geographical-coverage.json`](../reports/marrakech-geographical-coverage.json); it neither changes the cohort nor performs network collection. Municipal source URLs and SHA256 values allow re-fetching the exact evidence version. A changed document requires review, not automatic remapping. Human review of relationships cannot be replaced by this reproducibility script.

Targeted frontend/Market/geographic suite: **59/59 pass**. Tests cover real exact-label coverage, excluded corridors/composites, duplicate prevention, ratio median correctness, 7/8 threshold, absent evidence/wrong IDs, null suppressed medians, data-derived classes, FR/AR legend/selected statistics, unchanged city KPIs, and unchanged page markup outside the map. Casablanca/Rabat regression guards remain in place. Final lint, TypeScript and production build pass. `npm run test:market` passes 20/20. The combined frontend/Market/geographic invocation passes 59/59, including the neutral map-failure fallback. These overlapping suites are not additive.

## Remaining limits

This is a partial, label-attributed descriptive price map. It does not prove individual listing positions or neighborhood extent polygons. Exact coordinates with provenance or current authoritative neighborhood footprints are needed to resolve the 623 excluded observations and improve boundary-edge assurance. No prices are inferred for Annakhil, Sidi Youssef Ben Ali or Marrakech-Médina. Neither historical appreciation nor transaction prices are inferred. No raw dataset, model, Supabase record or source badge/methodology UI was changed or restored. Nothing was committed, pushed, merged or deployed.


## Final visual and interaction verification

All 16 combinations were captured against the final production build: Casablanca/Marrakech, FR/AR, light/dark, desktop 1440×900/mobile 390×844. Each pair was opened consecutively against the actual Casablanca reference. The numeric legend, selected panel and neutral coverage state were compared and representative screenshots inspected. No horizontal page overflow, new console warnings or errors, source-file badge or restored methodology section was detected. Citywide KPIs, other charts, tables and page markup outside the map remain protected by the existing pre-change non-map hash baselines; those baselines were not rewritten for this correction.

Evidence root: `C:/Users/ouaha/OneDrive/Desktop/MaisonDeLUX/outputs/market-parity/`.

- `price-{casablanca|marrakech}-{desktop|mobile}-{fr|ar}-{light|dark}-{map|panel|legend}.png`: 48 viewport captures.
- Matching `.json` files and `price-map-verification.json`: viewport, theme, direction, fills, selected statistics and rendered text.
- `price-*-fr-*-full.png`: eight French full-page captures. Arabic verification uses viewport captures because the browser's full-page RTL capture previously clipped content.
- [Desktop light comparison](../outputs/market-parity/price-compare-desktop-fr-light.png) and [desktop dark comparison](../outputs/market-parity/price-compare-desktop-fr-dark.png): real captured map-section crops assembled with labels.
- [Arabic mobile panel](../outputs/market-parity/price-marrakech-mobile-ar-dark-panel.png) and [French mobile legend](../outputs/market-parity/price-marrakech-mobile-fr-light-legend.png).
- `price-menara-{fr|ar}-{light|dark}.png` and `price-interactions.json`: Ménara values, neutral Annakhil state, retained pinned selection during keyboard preview, Enter selection and list activation, then restored Guéliz values.

The shared pointer/focus preview handlers remain consistent; keyboard preview and selection were exercised directly. A browser click-target error during list verification was resolved using keyboard activation of the visible list button. No application behavior was changed to bypass the browser issue.

### Files changed for this correction

- `data/geographic/marrakech-market-crosswalk.json`: complete reviewed label/evidence layer.
- `lib/analytics/marrakech-geography.ts`: guarded allocation and original-observation aggregation.
- `lib/analytics/marrakech.ts`: exposes the same validated original cohort to geographic aggregation.
- `lib/analytics/market-map.ts`, `config/city-market.ts`: independent Marrakech provider registration; Casablanca mapping/statistics unchanged.
- `app/[locale]/cities/[citySlug]/market/page.tsx`, `components/market/MarrakechMarketIntelligence.tsx`: server-derived summary and independent map failure handling.
- `components/market/MarketMapExplorer.tsx`: actual prices, coverage shares, city-appropriate attribution and neutral fallback; technical fallback metadata moved into disclosure. Categorical colors removed.
- `next.config.mjs`: traces the crosswalk and boundary inputs for the Market route.
- `scripts/audit_marrakech_geography.cjs`, `reports/marrakech-geographical-coverage.json`: reproducible coverage report.
- `tests/marrakech-geography.test.ts`, `tests/frontend/market-map.test.ts`, `tests/frontend/marrakech.test.ts`, `package.json`: geographic safety, arithmetic, publication, rendering and test registration.
- `docs/marrakech-geographical-price-analysis.md`: this report.

**Final status: partial geographic coverage implemented as a genuine price choropleth.** Two areas publish descriptive label-attributed prices; three remain neutral. The absence of individual coordinates and unresolved neighborhood extents is a material limitation, not a completed geocoding claim.
