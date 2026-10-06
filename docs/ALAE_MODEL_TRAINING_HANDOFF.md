# Alae: city model delivery

| City | Notebook | Training data | Approved package |
| --- | --- | --- | --- |
| Casablanca | `ml/notebooks/maisondelux_notebook1.ipynb` | `data/training/casablanca/` | `models/casablanca/v1/` |
| Marrakech | `ml/notebooks/marrakech.ipynb` | `data/training/marrakech/` | `models/marrakech/v1/` |
| Rabat | `ml/notebooks/rabat.ipynb` | `data/training/rabat/` | `models/rabat/v1/` |

Create paths only when real files exist. Casablanca's historical notebook and
original `ml/notebooks/modele_MaisonDeLUX.pkl` are preserved because approved
metadata names them. Do not rename or overwrite them. The original training CSV
named by that notebook is not locally available; the runtime reference CSV in
`server-data/` is not a replacement training dataset. The new Casablanca raw
folder contains an earlier 340-row geographic collection, not the approved
training corpus. The 30-city historical repaired corpus lives under
`data/training/shared/model-ready/` and is not city-specific training input.

1. Collect only the target city's data into `raw/`; audit/clean into `cleaned/`,
   and save final training input into `model-ready/`. Audit duplicates, leakage,
   geography, missing values, outliers and provenance; record dataset hashes.
2. Train/evaluate against a baseline with a documented split. Report MAE/RMSE in
   MAD, R², sample counts, parameters and limitations; isolate test data from tuning.
3. Serialize the selected model. Reload in a fresh process and verify prediction
   parity on fixed examples, documenting any numerical tolerance.
4. Save the executed city notebook at the path above. Deliver `model.pkl`,
   `preprocessing.json`, `metadata.json` in the city package. Document feature
   order, transformations, categories, missing/unknown handling, target inversion,
   versions, hashes, metrics and parity examples. Add optional artifacts only
   when the actual model requires them.
5. Never modify Casablanca artifacts or use Casablanca as another city's
   fallback. The application team integrates and verifies each city separately.

Generic collection/repair notebooks live in `ml/notebooks/workflows/`.
Reusable ML code lives in `ml/src/`; scraping tools in `ml/scraping/`.
GeoJSON belongs in `public/maps/`, city media in `public/media/cities/<city>/`,
and runtime Market Intelligence datasets in `server-data/`.

Rabat UI, capability state and exact application integration steps: [Rabat city handoff](RABAT_CITY_HANDOFF.md).

Marrakech UI, honest capabilities, data audit and exact model integration steps: [Marrakech city handoff](MARRAKECH_CITY_HANDOFF.md).
