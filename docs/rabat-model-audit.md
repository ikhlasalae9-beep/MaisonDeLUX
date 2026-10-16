# Rabat model audit — 2026-10-16

## Decision

**Recommend `rf_price_model.joblib` as the candidate for a future, separately
authorized Rabat integration. Do not activate it yet.** Both supplied binaries
are fitted scikit-learn **Random Forest pipelines**, not CatBoost. The recommended
artifact has a substantially better evidenced relationship to the supplied data:
all 500 trees' training statistics reconcile with the 700-row cleaned dataset.
The other artifact records 472 training samples, whose exact cohort and split
cannot be established from the supplied files.

This recommendation concerns artifact selection and reproducibility, **not proven
superior generalization**. No saved holdout/CV results were supplied. The newer
model's scores on its own training data cannot establish production accuracy.
Independent evaluation, a reviewed preprocessing manifest and release metadata
remain prerequisites. No retraining, inference integration, activation, database
operation, model rewrite, commit, push or deployment was performed.

## 1. Scope, provenance and integrity

Inspected all five files in `ml/notebooks/rabat/`, the existing Casablanca and
Marrakech adapters, Python registry/service, Next.js validation/gateway/contracts,
deployment packaging and existing persistence SQL as text. No notebook cells were
executed wholesale: they include training and file writes.

The local `origin/develop` snapshot resolves to
`62a1db64024306021e86d836f8239f5e3ff3cfd6`, dated 2026-10-15, message
“Add random forest price model as a joblib file”. These observations concern that
local remote-tracking snapshot; no fetch or remote-state claim is implied.
Git reports signature status `N` for that commit. Matching repository bytes
establish import consistency, not a signed training/release attestation.

| Artifact | Bytes | SHA-256 of imported file | Comparison with `origin/develop` |
|---|---:|---|---|
| `modele_rabat.pkl` | 9,427,994 | `db84e4916ad009e69e0111a42f42e2389f113d547d8e785d529fbd5dce1c4def` | Exact binary match |
| `rf_price_model.joblib` | 13,870,138 | `e2d7355966d5424e09e9b2f3afb8f381dc4b1b2be183a2e4f31fdda17880ab60` | Exact binary match |

The three text files differ only by CRLF/LF line endings; normalizing CRLF to LF
produces exact matches to the Git blobs. They were not rewritten.

| Text file | Imported bytes | Imported SHA-256 | Git blob SHA-256 (LF) |
|---|---:|---|---|
| `mubawab_clean.csv` | 47,659 | `1d1daeceeb7bfe33e9bebd458d910f727fc58e2c2edcc86c37cb9c208af853b5` | `e7b2f342c7fd36e4bf2c4f4db3f13a834f768624f13322512d25e41a99680a15` |
| `mubawab_properties (2).csv` | 230,463 | `ec79b7b1634d0a9aefa1e96b68748fca7e7fe55f44a62445a2ac113db8f83d4d` | `afdb394bbfde5b58e75bf48db779bd392474f5bc20b9deb26f7ea1d1e3485ec8` |
| `mubawab_rabat_notebook_plotly.ipynb` | 72,342 | `77f92ddebbc4f4955845a00fabe5cf54502b0966104fe7d9e15dc267a0251df6` | `20189f6b6a57c4c46f1727599ceb5af12950e237f7830ee46466b70683eda8c6` |

### Deserialization precautions and their limits

Before loading, checked Git bytes, SHA-256, pickle headers and static opcode/string
evidence. Both files contain Joblib's NumPy-array format using pickle protocol 4;
the `.pkl` extension does not make the first file a plain `pickle.load` artifact.
`pickletools` alone stops at the first embedded array payload, so that partial
scan was **not** treated as a complete security verdict.

Loading then occurred only in a separate audit child process, using Python
`-I -B`, a dedicated ignored audit venv, scrubbed environment variables, an audit
working directory, a 90-second parent timeout, and one inference thread. The
child did not import the application/backend or load `.env` files. Dependencies
were reused read-only; production requirements and existing runtimes were not
modified. Two small existing dependencies (`dateutil`, `six`) were copied into
the audit venv because isolated Python excludes the user package directory.

A restricted `joblib.numpy_pickle.NumpyUnpickler` allowed only the necessary
sklearn pipeline/encoder/forest/tree classes, Joblib array wrapper, NumPy array
constructors/dtype and `builtins.slice`. An audit hook also checked nested
object-array unpickling, denied network/process/ctypes operations and filesystem
writes, and restricted subsequent file reads to the Python/library directories.
Verified artifact bytes and datasets were read before installing these guards;
only the already-hashed in-memory artifact bytes were deserialized. Probes
confirmed denial of an environment-file read, file write, unexpected `os.system`
pickle global, and network/process audit events. Both model loads completed
without warnings or unexpected globals.

Docker's executable is present, but its daemon was unavailable. These were
restricted local process loads under the tool sandbox, **not a disposable VM or
container**. Python-level controls are defense in depth, not proof against every
native-library exploit; do not generalize this loader into permission to load
arbitrary future pickles. The upstream [scikit-learn persistence guidance](https://scikit-learn.org/stable/model_persistence.html)
warns about executable pickle content and unsupported cross-version loading.

## 2. Dataset findings and reproduced lineage

Raw CSV: **1,165 rows × 20 columns**, 1,165 unique listing IDs/URLs and no full-row
duplicates. `status` is uniformly `success`, a scraping result, not proof of sale.
Pandas' default CSV missing-value interpretation matters: literal `N/A` is missing.
Price is missing in 98 rows, type in 147, area in 9, rooms in 24, bedrooms in 7,
bathrooms in 8, property state in 498 and quartier in 5. Title, location and
description contain no usable values. Quartier extraction yields Rabat for
1,160 rows and missing city for 5.

Reproduced only the notebook's deterministic cleaning operations, without fitting
anything or exporting over either supplied dataset:

| Stage | Rows |
|---|---:|
| Raw | 1,165 |
| Price/area/count bounds | 1,015 |
| Required fields complete | 880 |
| Deduplicate selected/prepared columns | 857 |
| Price/m² IQR filtering by property type | 700 |

The result matches the supplied clean CSV **in row order and values**, ignoring
numeric dtype representation. The clean file has 700 rows × 10 columns, no
missing cells or full-row duplicates, and constant `city='Rabat'`. Eight rows are
duplicates of earlier feature vectors when `Price` is excluded, so identical
inputs can have different asking prices and can cross a random train/test split.

Cleaning rules, in order:

1. Select `type, area, rooms, bedrooms, bathrooms, property_state, quartier, price`.
2. Collapse whitespace in quartier; split on ` à ` into location/city. If no
   delimiter exists, use the same text for both. Rename the final columns.
3. Derive numeric Age from property_state using the mapping in section 4.
4. Retain price 100,000–60,000,000 MAD, area 15–3,000 m², and nonmissing room/
   bedroom/bathroom counts within 0–20. At this stage missing counts survive.
5. Drop missing Type/Area/Rooms/Bedrooms/Bathrooms/city/Price. Fill Current_state
   with `Inconnu`, Age with the **15-year** cohort median, and missing Localisation
   with city. Deduplicate these prepared rows.
6. Within each Type, retain price/m² between `Q1 - 0.5*IQR` and `Q3 + 0.5*IQR`.
   This removes 157 of 857 rows and narrows the price distribution.

Clean property types: appartement **386**, villa **276**, maison **35**, studio
**2**, bureau **1**. There are 33 raw cleaned location labels. Observed numeric
ranges are area 35–3,000 m², rooms 1–18, bedrooms 1–14, bathrooms 1–12, Age
0.5–85 years and Price 500,000–45,000,000 MAD. These describe this dataset;
they are not automatically approved API validation limits.

The inputs are listing asking prices, not verified transactions. There is no
supplied crawl timestamp, transaction outcome, independent valuation reference,
or explicit sale/rental field. Do not certify recency or exclusive sale coverage
from filenames or `status`. The target-dependent IQR filter can remove legitimate
luxury properties. Cleaning, age imputation and rare-category decisions occur
before the notebook split, which limits how independently that evaluation would
measure the complete data preparation procedure.

## 3. Actual serialized models

| Property | `modele_rabat.pkl` | `rf_price_model.joblib` |
|---|---|---|
| Top-level class | `sklearn.pipeline.Pipeline` | Same |
| Steps | `prep`, `rf` | Same |
| Algorithm | `RandomForestRegressor` | Same |
| Trees | 500 | 500 |
| Stored training sample count (`rf._n_samples`) | 472 | 700 |
| Total tree nodes | 128,716 | 190,412 |
| Raw model features | 8 | 8 |
| Encoded dimensions | 40 | 43 |
| Type categories | appartement, maison, villa | appartement, bureau, maison, studio, villa |
| Location categories | 23 | 24; additionally `Hay Al Kora` |
| Current_state categories | 9 | Same 9 |
| Stored sklearn version evidence | 1.9.0 | 1.9.0 |
| Holdout/CV metrics bundled in supplied material | None | None |

Both forests store `min_samples_leaf=2`, `min_samples_split=2`,
`random_state=42`, `bootstrap=True`, `max_features=1.0`, `criterion='squared_error'`,
no maximum depth and `oob_score=False`. Serialized `n_jobs=-1` was changed to 1
only on the in-memory audit objects to bound inference concurrency; nothing was
fitted, reserialized or written back.

### Evidence connecting the recommended artifact to the 700 rows

For every tree, reconstructed its bootstrap indices from its saved forest state.
Using the notebook's rare-location mapping and the loaded encoder, computed the
decision path of each of the 700 rows. Weighted node counts exactly match the
saved counts across **all 500 trees**. Weighted means of `log1p(Price)` match saved
node values with maximum absolute error **3.197442310920451e-14**.

This checks both feature routing and target statistics without calling `fit` or
generating replacement trees. It provides strong evidence that this exact ordered
cohort and log target produced the saved final model. It does not authenticate
the author, recover a training date, or establish out-of-sample performance.
The older model's 472 samples do not match the current notebook's 560-row training
partition or 700-row full cohort. Do not infer its original train/test membership
or invent a training-data count of 590 simply from an assumed 80/20 split.

## 4. Input, preprocessing and output contract

Both models expect a pandas DataFrame with these exact case-sensitive columns,
in the stored feature order:

| Feature | Meaning / representation | Future application mapping |
|---|---|---|
| `Type` | Lowercase French property label | `property_type` |
| `Localisation` | Exact training location label; rare mapping before model | `neighborhood` |
| `Area` | Raw numeric m², no area log transform | `area` |
| `Rooms` | Raw numeric count | `rooms` |
| `Bedrooms` | Raw numeric count | `bedrooms` |
| `Bathrooms` | Raw numeric count | `bathrooms` |
| `Current_state` | Age-band text, not Casablanca condition-quality text | Dedicated age-band contract |
| `Age` | Numeric representative years, not the age-band string | Derived numeric value |

There is **no floor feature**, no `Loc_Type`, and no city feature in the saved
matrix. Future requests should still carry and validate city Rabat outside the
model. A smoke test confirmed that extra city/floor DataFrame columns are ignored;
the future API should reject unsupported fields instead of implying they matter.

The saved `ColumnTransformer` one-hot encodes `Type, Localisation, Current_state`,
with `handle_unknown='ignore'`, sparse output enabled, no dropped level and no
minimum-frequency grouping. It passes through numeric columns in the order
`Area, Rooms, Bedrooms, Bathrooms, Age`. The RF consumes that transformed matrix.
Neither a scaler, numeric imputer nor inverse target transform is stored inside
the Pipeline. Preserve this fitted encoder; do not rebuild dummy columns or reuse
Casablanca's preprocessing.

The **external** age mapping is:

| Current_state | Numeric Age |
|---|---:|
| `Moins d'un an` | 0.5 |
| `1-5 ans` | 3 |
| `5-10 ans` | 7.5 |
| `10-20 ans` | 15 |
| `20-30 ans` | 25 |
| `30-50 ans` | 40 |
| `50-70 ans` | 60 |
| `70-100 ans` | 85 |
| `Plus de 100 ans` | 110 in cleaning code; absent from fitted categories |
| Missing / `Inconnu` | 15, the reproduced training-preparation median |

Do not expose `Plus de 100 ans` as certified support merely because it appears in
cleaning code. Derive a consistent Age from the chosen band; do not accept
contradictory independently entered band/year values.

Notebook cell 62 maps cleaned locations with fewer than 3 occurrences to `Autre`
**outside the pipeline**. Verified rare labels are `Al Kamra`, `Akkari`,
`Hay Al Amal`, `Médina`, `Hay Bouhlal`, `Al Kouass`, `Les Oudayas`, `Hay Al Farah`,
`Skhirat`, `Takadoum`. The newer model's fitted location vocabulary is:

```text
Agdal; Al Irfane; Autre; Aviation - Mabella; Diour Jamaa; El Youssoufia;
Guich Oudaya; Hassan - Centre Ville; Haut Agdal; Hay Ach-chbanat; Hay Al Fath;
Hay Al Kora; Hay Al Massira; Hay El Menzah; Hay Nahda; Kébibat; L'Ocean;
Les Orangers; Quartier Administratif; Quartier Des Ambassades; Rabat; Riyad;
Riyad Extension; Souissi
```

Unknown labels are silently encoded as an all-zero category block, **not mapped
to Autre**. Smoke tests accepted an unknown type and neighborhood and still
returned predictions. Future validation must enforce a reviewed vocabulary and
explicit known-rare mapping. Missing Age raises a missing-column error, and an
age-band string in numeric Age fails conversion. The saved model alone does not
validate positive area, sensible count relationships, city ownership or coverage.

`predict()` returns a one-dimensional array of **log1p price**, not MAD:

```python
log_price = float(pipeline.predict(prepared_dataframe)[0])
raw_price_mad = float(np.expm1(log_price))
```

Future inference should check finite positive values, then use the existing
whole-MAD response convention. Do not apply a second log transform, cap counts
using Casablanca's rules, or add Marrakech's interaction feature.

Notebook example: appartement / Agdal / 110 m² / 3 rooms / 2 bedrooms /
1 bathroom / `5-10 ans` / Age 7.5:

| Artifact | Raw model output | `expm1` output, MAD |
|---|---:|---:|
| `modele_rabat.pkl` | 14.458725064040959 | 1,902,585.9373382705 |
| `rf_price_model.joblib` | 14.449753597031636 | 1,885,593.2799045164 |

These are reproducible inference examples, not accuracy measurements.

## 5. Notebook inconsistency and evaluation evidence

Cell references here are **zero-based indices in the notebook JSON**.
All 27 code cells have unset execution counts; the notebook contains **zero saved
outputs**. Consequently no numeric R², MAE, CV fold score or example prediction
can be quoted as an observed notebook result.

- Cell 3 imports RandomForestRegressor, not CatBoost.
- Cell 70 defines `Pipeline([('prep', preprocess), ('rf', RandomForestRegressor(
  n_estimators=500, min_samples_leaf=2, random_state=42, n_jobs=-1))])`, then fits
  a seeded 80/20 split on `log1p(Price)` and describes MAD-space R²/MAE evaluation.
- Cell 76 refits **the same variable** `model` within five-fold CV
  (`KFold(5, shuffle=True, random_state=1)`). After that loop it contains the last
  fold's model, not a full-cohort refit.
- Cell 84 instead says `best_catboost = model['CatBoost']` and exports
  `modele_MaisonDeLUX.pkl`. The defined Pipeline has no `CatBoost` step, so this
  lookup fails if execution reaches it. That output filename is also neither of
  the two supplied binaries.
- Markdown claims a full-data refit and `rf_price_model.joblib` export, but there
  is no matching executable full-data fit/export cell in this notebook.
- Earlier cells use undefined `funnel` and `BLUE/GREEN/RED/GREY`; a fresh sequential
  run fails before the training section unless these definitions are supplied.

**Finding:** the notebook contains inconsistent editing/export code. The two
actual binary objects independently establish Random Forest; there is no supplied
CatBoost candidate to compare. The newer artifact's full-cohort fit was established
from saved tree evidence, not from the notebook's inaccurate export narrative.
The R² > 0.8 text is a goal, not a verified achieved result.

### Independently computed prediction diagnostics — not holdout metrics

Using the existing frozen artifacts, all 700 supplied clean rows, exact feature
order and the cell-62 rare-location mapping, calculated the following **without
training**. MAD metrics use unrounded `expm1` predictions:

| Metric on the same 700 supplied rows | `modele_rabat.pkl` | `rf_price_model.joblib` |
|---|---:|---:|
| R², MAD space | 0.9039301189 | 0.9521408362 |
| MAE, MAD | 935,289.24 | 673,900.58 |
| RMSE, MAD | 2,191,106.09 | 1,546,508.58 |
| Median absolute percentage error | 7.13270731% | 5.59955208% |

For the newer artifact these are **training-set resubstitution** scores. For the
older one, overlap with its unidentified 472-row training cohort is unknown.
They are not a fair independent accuracy ranking. Selecting 20% of this same
700-row dataset using `random_state=42` after loading the full-cohort model does
not create a holdout; those rows were already used to fit it. No fresh CV was run
because that would require retraining. No verified out-of-sample metric is
available for either candidate.

Repeated predictions over all 700 rows were identical in the single-threaded
audit runtime for both artifacts (maximum absolute log-output difference 0).
This checks repeatability, not generalization or cross-platform equivalence.

## 6. Dependencies and backend compatibility

| Dependency | Evidence / compatibility |
|---|---|
| Python | Notebook metadata says 3.12.10; audit used CPython 3.12.10, Windows x64 |
| scikit-learn | Serialized version 1.9.0; restricted audit used 1.9.0 with no warnings; project requirements already pin 1.9.0 |
| NumPy | Audit used 2.4.4; present in serialized array machinery; training version not supplied |
| pandas | Audit used 2.2.3 for CSV/DataFrame handling; training version not supplied |
| SciPy | Audit used 1.17.1 for sklearn/sparse support; training version not supplied |
| Joblib | Audit used 1.5.3; required for this persistence format; writer version not supplied |
| CatBoost / XGBoost | Not referenced by either Rabat artifact; not needed for their predictions |
| Plotly | Notebook visualization dependency only; not required for inference |

The tested numeric/library versions match the current project requirements.
The global workstation Python has sklearn **1.8.0**, so it was not used to load
the artifacts. Do not treat that global installation as the certified runtime or
suppress version warnings. Full historical dependency versions and training date
remain unknown; the tested compatibility environment is not a reconstructed
training lockfile.

| Existing architecture | Relevance to future Rabat integration |
|---|---|
| `backend/inference/casablanca.py` | Checks artifact hash/class and feature contract; manually prepares a CatBoost matrix; provides city-specific context. Its numeric transforms/category semantics must not be reused for Rabat. |
| `backend/inference/marrakech.py` | Closest pattern: immutable artifact/manifest metadata, verified bytes, lazy load and dependency checks, complete-input validation, fitted pipeline transforms and explicit log-price inversion. Rabat needs its own schema and external age/rare-label rules. |
| `backend/inference/registry.py`, `service.py` | Explicit city registry, adapters, metadata/health and identity checks; currently only Casablanca and Marrakech. Adding a file alone does not register Rabat. |
| `backend/app.py`, `api/index.py` | Existing Flask city endpoints behind the signed inference gateway; use this path later rather than reviving the disabled national estimator. No public Rabat route was added. |
| `lib/estimations/contracts.ts`, `lib/security/model-input.ts`, `lib/api/types.ts` | Current allowlists/types/validators accept only Casablanca and Marrakech. Rabat's numeric Age and age-band Current_state need a separate approved contract. |
| `lib/estimations/gateway.ts`, `app/api/estimations/route.ts` | Reuse signed transport, authorization, idempotency and response identity checks after authorization; do not call a pickle directly from a browser or bypass persistence. |
| `supabase/migrations/006_prepared_city_inference.sql` | Existing completion function explicitly recognizes only the two integrated city/version/identity tuples. Future Rabat persistence requires separately reviewed registration and RPC support; it is outside this audit. |
| `config/cities.config.ts` | Rabat's city page exists, but estimation is unavailable, publicEnabled false and modelRef null. Preserve these gates until separately authorized. |
| `vercel.json` | Python packaging excludes `ml/notebooks/**` and includes `models/**`. The imported notebook-folder artifact is not a deployable inference package merely because it exists locally. |

## 7. Required files, risks and adaptations before integration

No production-ready Rabat release package exists in `models/rabat/`. Required
future deliverables and decisions are:

1. A reviewed immutable package containing the selected existing artifact,
   metadata and preprocessing manifest, each with physical-byte SHA-256. Record
   artifact identity/version, source commit, expected classes/features, exact
   category order, test runtime and metric provenance. Do not invent a trained_at,
   model ID, version string, CV score or production-ready status.
2. A corrected executable training/export provenance record supplied by the model
   owner: explain the CatBoost fragment, identify the actual full-cohort export
   run, and document the older 472-row cohort if that artifact remains a candidate.
   Corrections/retraining were not performed during this audit.
3. An independently held-out labelled dataset or recoverable genuinely held-out
   evaluation record for the selected frozen artifact. Evaluate by property type,
   price band and neighborhood; do not promote the resubstitution table as test
   accuracy. Studios (2 rows) and bureau (1) cannot justify reliable public
   coverage just because the encoder has those labels.
4. A reviewed feature contract: age-band-to-years mapping including Inconnu,
   explicit rare-label mapping, strict category/city checks, finite numeric/count
   checks and documented accepted ranges. Do not synthesize missing features
   from Casablanca/Marrakech defaults. The current artifact accepts unknown
   categories silently, so validation must precede prediction.
5. A Rabat-specific adapter following Marrakech's verification/lazy-load pattern,
   preserving its fitted preprocessing and applying `expm1` exactly once. Add
   golden prediction fixtures, failure cases, dependency checks, optional-context
   unavailable semantics and bounded inference concurrency. No supported
   explanation/comparables provider or uncertainty calibration is supplied.
6. Later, after explicit integration approval: registry/service/contracts/types/
   metadata/validation support; reviewed model packaging; protected end-to-end
   tests; and separately authorized database city/model/RPC registration. Keep
   public inference disabled while these are reviewed. Never enable Rabat by
   aliasing a Casablanca or Marrakech model, or by assuming a legacy national
   model's Rabat coverage satisfies this contract.

## 8. Reproduction and retained local evidence

Audit-only scripts and machine-readable results are retained under ignored
`outputs/rabat-audit/`; they are local evidence, not production imports or tracked
release files:

- `inspect-static.py`, `static-evidence.txt`: notebook cells, dataset columns,
  binary/text hashes, Git blob comparison and partial opcode inspection.
- `restricted-inspect.py`, `run-restricted.py`, `model-evidence.json`: guarded
  isolated loads, fitted model structure, vocabularies, contract probes, inference
  examples, repeatability, training-statistic reconciliation and diagnostics.
- `reproduce-cleaning.py`, `dataset-evidence.json`: deterministic raw-to-clean
  comparison, missingness, retained rows and observed ranges.

From the repository root, using the prepared local audit runtime:

```powershell
python -X utf8 outputs/rabat-audit/inspect-static.py
python -X utf8 outputs/rabat-audit/run-restricted.py
outputs/rabat-audit/runtime/Scripts/python.exe -X utf8 outputs/rabat-audit/reproduce-cleaning.py
```

The restricted loader requires the exact hashes above and sklearn 1.9.0. Its
audit venv references the existing ignored sklearn-1.9 compatibility runtime
read-only; it is a local experiment, not a portable deployment environment.
For another machine, provision the versions in section 6 in a fresh restricted
environment before repeating. Do not weaken the loader allowlist to make an
unreviewed replacement artifact load.

The numeric diagnostics can independently be reproduced, after equivalent safe
deserialization of the verified artifact, with this calculation (no fitting):

```python
features = ['Type', 'Localisation', 'Area', 'Rooms', 'Bedrooms',
            'Bathrooms', 'Current_state', 'Age']
X = clean[features].copy()
counts = X['Localisation'].value_counts()
rare = counts[counts < 3].index
X['Localisation'] = X['Localisation'].where(
    ~X['Localisation'].isin(rare), 'Autre')
y = clean['Price'].to_numpy()
pred = np.expm1(verified_pipeline.predict(X))
r2 = r2_score(y, pred)
mae = mean_absolute_error(y, pred)
rmse = np.sqrt(mean_squared_error(y, pred))
median_ape_percent = np.median(np.abs(pred - y) / y) * 100
```

Validation completed: five-file provenance/integrity comparison; guarded loads
of both models with no warnings; raw-to-clean equality; 500-tree training-statistic
reconciliation for the candidate; feature/error probes; deterministic repeated
predictions; and final source-file hash recheck. No production endpoint was called
and no database connection was opened for this audit.
