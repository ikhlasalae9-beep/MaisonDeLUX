# Casablanca reference inventory (captured before Rabat rebuild)

Inspected the current source and opened FR/AR city, market and estimate routes before implementation. Captured pre-refactor FR/AR city and market HTML hashes in reports/rabat-reference-hashes.json.

City page render order:
1. Shared marketing navbar and full-width city video hero: region, capability badge, city h1, subtitle, city service actions.
2. Editorial introduction/dek with side fact card.
3. Territory narrative with a 4:3 editorial image and caption; alternating two-column layout.
4. Built environment narrative with the same image treatment and subtle section background.
5. Market interpretation narrative with the same image treatment.
6. Dark neighborhood section: introductory text and named neighborhood cards.
7. MaisonDeLUX estimation-methodology section: six factor cards and methodology note.
8. Conclusion beside the institutional editorial-source card.
9. Dark final services CTA panel using city capability actions.
10. Existing marketing footer.

Main section count: nine (hero, intro, three narratives, neighborhoods, factors, conclusion/sources, services). No standalone gallery or administrative map in the city article.

Market page render order:
1. Back link and dark market heading/source panel.
2. Five KPI cards.
3. Administrative price map card: geographic shapes, selected/hovered arrondissement panel, zone selector, legend, coverage/methodology and source attribution.
4. Six most represented neighborhood cards.
5. Four charts: price/m² distribution, neighborhood volumes, property mix and neighborhood medians.
6. Ranked neighborhood table with sorting, eight-observation rule and coverage note.
7. Existing marketing footer.

Estimator: product CompactHeader, local-model heading, verified form categories, numeric inputs, optional state/age, calculation action and indicative-result panel. Casablanca only; untouched by the rebuild.

The historical shared repaired corpus has 400 Rabat rows. No city-specific approved Rabat market provider/cohort or reviewed neighborhood crosswalk exists. Those historical rows are not automatically approved for publication. Existing city handoff distinguishes this shared corpus from approved city-specific data.
