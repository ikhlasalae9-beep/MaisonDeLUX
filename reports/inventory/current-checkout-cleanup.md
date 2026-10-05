# Current checkout consolidation — 2026-10-05

Directory: `C:\Users\ouaha\OneDrive\Desktop\MaisonDeLUX`.
No Codex worktree used. No Git command executed during this second pass.
No commit, push, branch change or deployment.

Removed directories: root notebooks/, output/, outputs/;
reports/advanced_optimization/ including its cache directory. First-pass empty
frontend/, ml/artifacts/ and tmp/ remain absent. One notebook root now exists.

## Moves / consolidation

| Previous path | Canonical path |
| --- | --- |
| `notebooks/data_maisondelux_scraper_v3.ipynb` | `ml/notebooks/workflows/data_maisondelux_scraper_v3.ipynb` |
| `notebooks/data_repair_model_ready.ipynb` | `ml/notebooks/workflows/data_repair_model_ready.ipynb` |
| `ml/notebooks/maisondelux_data_pipeline.ipynb` | `ml/notebooks/workflows/maisondelux_data_pipeline.ipynb` |
| `data/processed/casablanca.py` | `ml/scraping/legacy/casablanca.py` |
| `mubawab_listings_ard_qrt.csv` | `data/training/casablanca/raw/mubawab_listings_ard_qrt.csv` |
| `scrape_images.py` | `scripts/media/scrape_images.py` |
| `images.json` | `scripts/media/images.json` |
| `output/pdf/MaisonDeLUX_Rapport_QA.pdf` | `reports/qa/MaisonDeLUX_Rapport_QA.pdf` |
| `data/processed/maisondelux_model_ready_v1.csv` | `data/training/shared/model-ready/maisondelux_model_ready_v1.csv` |
| `data/processed/maisondelux_model_ready_v1.parquet` | `data/training/shared/model-ready/maisondelux_model_ready_v1.parquet` |
| `outputs/01a06449-2ac1-7fa2-a7ad-6d42f27ec146/previews` | `reports/data_quality/workbook-previews` |
| `outputs/01a06449-2ac1-7fa2-a7ad-6d42f27ec146/workbook_build/build_workbooks.mjs` | `scripts/data/build_workbooks.mjs` |

Moved notebook science was preserved; only the generic repair notebook's recorded
output paths were updated. Original Casablanca notebook/model paths and bytes
remain because approved metadata explicitly records them. Acquisition tools now
write to their canonical dataset/metadata locations. No scraping was run.
Repair/location tooling, tests, docs and workbook verifier now use the moved paths.

Deleted: 15 experiment joblib caches, four spreadsheet inspect.ndjson dumps,
two byte-identical duplicate XLSX exports, data/processed/.gitkeep and four
obsolete inventory snapshots. Local workbook-build node_modules was also removed.
Known deleted project artifacts total **1,729,148,657 bytes (~1.73 GB)**, excluding
local dependencies. Not all were tracked: outputs/ is ignored. No Git commands
were used to calculate a tracked-only total. At least 10.58 MB of data/notebook/
PDF/tooling content was consolidated, plus workbook previews.

## Canonical responsibilities

```text
app/ components/ config/ lib/ backend/ api/ supabase/  application
ml/
  notebooks/
    maisondelux_notebook1.ipynb  protected Casablanca provenance
    modele_MaisonDeLUX.pkl      protected original model provenance
    workflows/                 collection, repair, pipeline notebooks
  scraping/                    maintained scraper + legacy/casablanca.py
  src/                         reusable ML/data code
data/
  training/casablanca/raw/      earlier geographic collection
  training/shared/model-ready/ historical 30-city CSV + Parquet
  raw/ processed/ sample/      collection/recovery inputs and development sample
models/casablanca/v1/           approved production model package
models/*.json, *.joblib         active compatibility/location dependencies
server-data/                   runtime Market Intelligence reference data
public/maps/                   geography
public/media/cities/<city>/     runtime city media
scripts/media/ scripts/data/   acquisition metadata/tooling, workbook generator
docs/README.md                 index
reports/qa/                    QA PDF
reports/data_quality/          scientific reports and workbook previews
```

Future notebooks: ml/notebooks/marrakech.ipynb and rabat.ipynb.
City training data: data/training/<city>/{raw,cleaned,model-ready}/.
Approved package: models/<city>/v1/{model.pkl,preprocessing.json,metadata.json}.
Create directories only for real files; no Casablanca fallback for another city.
The shared corpus has 30 cities and must not be relabeled Casablanca-only.

## Legacy artifacts retained: exact dependencies

- locations_v1.json: backend/app.py; EstimatorShell, DynamicField, Step4Review.
- neighborhoods_v1.json: lib/estimation/locations.ts; location UX/reference tests.
- maisondelux_price_model_v1_metadata.json: backend/app.py startup and metrics.
- maisondelux_price_model_v1.joblib: backend/app.py compatibility loader; production parity tests.
- maisondelux_price_model_v1.json and maisondelux_preprocessing_v1.json:
  backend/app.py constructs the generic compatibility model at import time.

Removing these requires a separate backend change, prohibited here. No legacy
model was substituted for Casablanca. The original model duplicate is explicitly
named in protected metadata and checked by provenance tests. Active icon/media
copies were retained to preserve URLs and framework icon behavior.

## Protected Casablanca SHA256

- `metadata.json`: `c4742651aeb3f0717b33fc2cdf8374a988cd78341f9c988e955411a6136b3f69` (before = after)
- `model.pkl`: `b5ba50e9b6fd35203b556c840fe97170ee23441a6cce0ffa927f3c09944b8e1d` (before = after)
- `preprocessing.json`: `70f7e7ee1ee6318b6fc379c16527da7558184b0b97f792849e5a163f3fd1c7e9` (before = after)

All baselined runtime code, maps/media, models, server-data and original notebooks
are unchanged. No UI/UX, estimation, auth, account, admin, database/security/RLS
or approved prediction/preprocessing behavior changed. No model was trained.
Prediction before/after: **1,217,911 MAD** for Casablanca appartement, Maârif,
area=100, rooms=3, bedrooms=2, bathrooms=2, floor=4, Bon état, 10-20 ans.

## Verification

- Casablanca/API/gateway/production + repair tests: 34 passed.
- Frontend/Phase C/auth/security/admin/market: 70 passed; location UX: 6 passed.
- TypeScript passed. Moved Python scripts compile; workbook JS syntax passes.
- Full Python: 78 passed, same 17 existing retired-endpoint failures as first pass.
- Build failed because Google Fonts requests are blocked (EACCES); production
  build success remains unverified. No unavailable-dataset failures appeared.

Updated README, docs index, city handoff, pipeline/recovery notebook paths and
historical model/data paths. Historical validation is explicitly labeled retired.

Remaining limitations: original training CSV named in protected metadata is absent;
server-data is runtime reference data, not its replacement. The earlier raw
Casablanca collection is not the approved training corpus. Recovery archives and
scientific reports remain as reproducibility evidence. The legacy Selenium tool
was relocated as source and not executed. No remaining files were deleted on
uncertain provenance. First-pass inaccessible .pytest_cache remains.
