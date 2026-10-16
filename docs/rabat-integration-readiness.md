# Rabat integration readiness — Phase 1

> Historical Phase 1 snapshot. The subsequent [Phase 2 application report](rabat-application-integration.md)
> documents prepared shared-registry/service/contracts integration, the still-disabled
> public gates, manual-only SQL migration, and resolution of the XGBoost reporting
> harness failure. The versioned model package and its hashes remain unchanged.

Date: 2026-10-16. Scope: verified package and internal Python inference only.

**Prepared for internal testing; not publicly enabled or operationally deployed.**
The frozen Random Forest pipeline is packaged and runs through its own validated
adapter. No city page, public registry, HTTP route, Next.js contract, gateway,
Supabase registration, existing model or deployment configuration was changed.
See [the preceding model audit](rabat-model-audit.md) for data lineage and the
Random Forest/CatBoost notebook inconsistency.

## Files and immutable package

| File | Purpose |
|---|---|
| `models/rabat/v1/model.joblib` | Byte-for-byte copy of the verified `ml/notebooks/rabat/rf_price_model.joblib`; 13,870,138 bytes |
| `models/rabat/v1/metadata.json` | Source evidence, internal identity, tested runtime, explicitly scoped training diagnostics, 26 golden fixtures and release blockers |
| `models/rabat/v1/preprocessing.json` | Exact eight-column/fitted encoder contract, age mapping, ten rare-label mappings and validation policy |
| `models/rabat/v1/.gitattributes` | Binary handling and physical LF preservation for hash-covered JSON |
| `backend/inference/rabat.py` | Lazy verified loading, strict validation, frozen pipeline prediction and single target inversion |
| `backend/inference/prepared.py` | Explicit Python-only package discovery, separate from the public model registry |
| `tests/test_rabat_inference.py` | Golden, integrity, validation, runtime, concurrency and public-isolation tests |

Pinned physical-byte SHA-256 values:

```text
model.joblib:
e2d7355966d5424e09e9b2f3afb8f381dc4b1b2be183a2e4f31fdda17880ab60
preprocessing.json:
37d2ea1a6ec1fb2e531818a648ca885b32fe21fae50f090ace1b276ce98c1f74
metadata.json:
72730f0817c6365654e0977e56779329d5743b37a1234894ff2c5794304f2865
```

All three are independently pinned in the adapter. Editing either JSON requires
an explicit reviewed package/hash update; editing metadata alone cannot bless
replacement model bytes. Model loading checks the JSON, artifact and runtime
before deserialization, then deserializes the **same in-memory bytes** that were
hashed. Hash mismatches, missing files, mismatched dependency versions,
deserialization warnings, wrong model classes, feature/category changes and
wrong fitted sample/tree counts fail closed. Successful loads are cached for the
process lifetime, as in Marrakech; disk changes are detected on a fresh process
or uncached load rather than rehashing the entire artifact on every prediction.

The source artifact matches local `origin/develop` commit
`62a1db64024306021e86d836f8239f5e3ff3cfd6`. Source files were not edited or
reserialized. This preserves audited bytes; it does not convert the unsigned
repository snapshot into a signed training attestation or make arbitrary Joblib
files safe. The loader accepts this explicitly pinned package only.

Internal application identifiers assigned for this package are
`model_id=rabat-random-forest` and `model_version=rabat-random-forest-v1`.
They are new application-owned identifiers, not recovered notebook training IDs
or Supabase registrations. Training date and source model ID remain unknown/null.

## Preserved model semantics

The pipeline is `ColumnTransformer -> RandomForestRegressor`, with steps `prep`
and `rf`, 500 fitted trees, 700 training samples and 43 encoded columns.
The exact raw DataFrame order is:

```text
Type, Localisation, Area, Rooms, Bedrooms, Bathrooms, Current_state, Age
```

All eight prepared fields plus `city=Rabat` are required. The adapter validates
inputs before model loading. City is checked separately and never enters the
saved feature matrix. Unsupported fields, including floor, Loc_Type, Price,
model identity and a client-supplied allow_prepared switch, are rejected.

- Type must exactly match the fitted lowercase vocabulary: appartement, bureau,
  maison, studio or villa. These are internal compatibility capabilities, not
  public property-type approval.
- Only the ten evidenced rare locations map to `Autre`: Al Kamra, Akkari,
  Hay Al Amal, Médina, Hay Bouhlal, Al Kouass, Les Oudayas, Hay Al Farah, Skhirat,
  Takadoum. Other values must exactly match the fitted location vocabulary.
  Arbitrary unknowns are rejected instead of silently taking the encoder's
  all-zero unknown-category path. No invented aliases or cross-city neighborhoods
  are accepted.
- Current_state contains **age-band text**, not Casablanca condition labels.
  Numeric Age must match that band's documented value. The mapping is
  `Moins d'un an:0.5`, `1-5 ans:3`, `5-10 ans:7.5`, `10-20 ans:15`,
  `20-30 ans:25`, `30-50 ans:40`, `50-70 ans:60`, `70-100 ans:85`,
  `Inconnu:15`. The explicit Inconnu value preserves the reproduced cohort median;
  missing fields are not silently filled. `Plus de 100 ans` is not fitted support.
- Numeric inputs must be finite real numbers, excluding booleans, numeric text,
  missing values and fractional counts. Conservative **internal** bounds follow
  the observed cleaned cohort: area 35–3,000 m², rooms 1–18, bedrooms 1–14 and
  bathrooms 1–12. These reject extrapolation without clipping. They are an
  engineering test policy, not independently certified public coverage.
- The saved pipeline performs its own one-hot encoding and numeric passthrough.
  Area and counts stay raw: no Casablanca log-area/caps, no re-encoding and no
  Marrakech Loc_Type interaction are introduced.
- The forest outputs log1p price. The adapter applies `numpy.expm1` **once**,
  checks shape/type and finite positive MAD results, retains `raw_price_mad`,
  and rounds `estimated_price_mad` to whole MAD. It also rejects values that round
  to zero. No unsupported thousand-MAD presentation rule is added.
- Serialized `n_jobs=-1` becomes `n_jobs=1` only in memory to bound inference
  concurrency. Trees, weights, preprocessing and source/package files remain
  unchanged. No fit, clone-training or export step runs.
- Context validates the same inputs and explicitly reports explanation,
  comparables and market_context unavailable. It never loads another city model
  or invents uncertainty/context output.

## Internal discovery and public isolation

Use the prepared-only module explicitly in Python:

```python
from backend.inference import prepared, rabat

description = prepared.model_metadata("Rabat")
# status='prepared_internal_only', public_enabled=False,
# operationally_deployed=False, inference_ready=None; no artifact is loaded.

checked = prepared.model_metadata("Rabat", check_ready=True)
# inference_ready=True means the local package loaded successfully only.

result = rabat.predict({
    "city": "Rabat", "Type": "appartement", "Localisation": "Agdal",
    "Area": 110, "Rooms": 3, "Bedrooms": 2, "Bathrooms": 1,
    "Current_state": "5-10 ans", "Age": 7.5,
})
# raw_price_mad=1885593.2799045164; estimated_price_mad=1885593
```

The operational `MODEL_REGISTRY` remains unchanged with Casablanca and Marrakech
only. `registry.predict_for_city`, `registry.context_for_city`, `service.estimate`
and `service.context` still reject Rabat, including with their existing internal
allow_prepared argument. No public handler imports the prepared discovery module.
Signed HTTP Rabat estimation/context/health/metadata requests remain rejected;
body fields cannot activate a Python-only package. Frontend capabilities and
public TypeScript contracts continue to mark Rabat unavailable.

This separation avoids modifying Marrakech/Casablanca dispatch behavior or
introducing a new HTTP-controlled bypass during Phase 1. Future shared-service
integration needs its own reviewed application contract and authorization.

## Runtime and compatibility evidence

The tested local environment uses CPython **3.12.10**, scikit-learn **1.9.0**,
NumPy **2.4.4**, pandas **2.2.3**, SciPy **1.17.1** and Joblib **1.5.3**. The adapter
requires Python 3.12 and those exact package versions. These already match the
project requirements; no production dependency changes were made. Only sklearn
1.9.0 is evidenced as a serialized training dependency. Other versions describe
the tested compatibility runtime, not a recovered historical training lockfile.

The default workstation Python has sklearn 1.8.0 and is rejected. Tests use the
existing ignored sklearn-1.9 compatibility runtime. Rabat needs neither CatBoost
nor XGBoost for its own prediction; the combined city regression suite still
needs those existing cities' dependencies.

| Compared behavior | Rabat Phase 1 | Existing cities |
|---|---|---|
| Trust before load | Artifact, manifest and metadata pins; verified BytesIO | Marrakech verifies artifact/manifest and loads verified BytesIO; Casablanca verifies artifact |
| Fitted preprocessing | Saved RF pipeline plus documented external age/rare mapping | Marrakech saved stacking pipeline; Casablanca manually reproduces CatBoost features |
| Input validation | Eight required features, numeric Age/band consistency, strict category/range rejection | City-specific existing contracts unchanged |
| Output | One expm1, raw MAD plus whole MAD and explicit internal identity | Existing golden predictions and output conventions unchanged |
| Lazy readiness | Explicit prepared-only discovery | Existing public metadata/health paths unchanged |
| Public inference | Unregistered and disabled | Casablanca/Marrakech gates and routes unchanged |

## Evaluation status and exact remaining release blockers

1. **No independent holdout validation.** The audited R² 0.9521408362, MAE
   673,900.58 MAD and RMSE 1,546,508.58 MAD are resubstitution diagnostics on the
   same 700 rows used for fitting. They live under `training_diagnostics`, with
   `independent_test_metrics=null` and
   `metrics_status=no_independent_holdout_validation`. Neither those values nor
   the golden fixtures establish independent accuracy. Obtain a genuinely
   independent labelled evaluation cohort or authenticated held-out evidence for
   the frozen artifact; do not manufacture a holdout by splitting its training CSV.
2. **Incomplete training/export provenance.** The notebook's CatBoost lookup and
   export filename contradict its RF definition; it has no saved evaluation
   outputs or executable final full-cohort export matching this artifact. The
   audit establishes strong 700-row fitted-tree consistency, not the missing
   author/export record. Request the corrected provenance record from the owner.
3. **Historical training runtime/date missing.** No complete original dependency
   lock or verified trained_at exists. Test the pinned compatibility runtime on
   the intended deployment OS/runtime, measure cold-start/memory/request budgets,
   and review any version changes before accepting new pins. Windows-local
   golden/concurrency passes do not certify deployment portability.
4. **Public scope and validation policy unapproved.** Review numeric envelopes,
   age semantics, count relationships, location aliases and allowed property
   types. Studio has two clean rows and bureau one; fitted category support alone
   is insufficient for public coverage. Validate performance across neighborhoods,
   property types and price bands before setting public support.
5. **No application/persistence integration.** Rabat is absent from public Python
   dispatch, Next.js contracts/validators/types and Supabase city/model/RPC
   registration. A separately authorized phase must integrate signed transport,
   strict response identities, entitlement/idempotency handling, event/passport
   persistence and end-to-end tests. No database migration was written or run.
6. **Optional capability evidence absent.** No validated Rabat explanations,
   comparable listings, market context or uncertainty calibration is supplied.
   Keep those capabilities unavailable unless independently implemented/reviewed.
7. **Public activation/deployment not authorized.** Internal readiness must not
   become an available/deployed status. Keep public flags false until explicit
   release approval after the preceding blockers are resolved.

## Validation results

The 26 golden fixtures were generated directly from the verified source pipeline
in the matched, restricted audit runtime **before** implementing the adapter.
They cover all five fitted property types, nine state/age bands, all ten rare
neighborhood mappings, the additional Hay Al Kora category and the notebook's
Agdal example. MAD parity tolerance is an absolute 1e-6. They are frozen
compatibility fixtures, not predictions generated by the adapter to test itself.

Tests cover missing/extra fields; invalid city/category/number/range/age pairs;
single expm1; malformed/nonfinite/nonpositive model output; missing/tampered
artifact and JSON files; missing/wrong dependencies; Python version; unexpected
model classes and altered fitted contracts; warning rejection; same-bytes
deserialization; cached/repeated/concurrent predictions; lazy imports/discovery;
unavailable context and signed-HTTP/public-registry rejection.

Combined Python run (new Rabat plus unchanged Casablanca, Marrakech, city service,
gateway and startup tests): **356 passed, 1 failed**. The sole failure is the
existing `test_preview_startup.py::test_existing_preview_runtime_harness_results`:
`preview_validation.py` unconditionally reads distribution metadata for
`xgboost-cpu`, which is absent on this Windows installation. Standard `xgboost`
3.4.1 is installed and is accepted by Marrakech's existing loader; its prediction,
context, signed HTTP and golden tests pass. The failure is in the existing
reporting harness's package-name lookup, not Rabat inference. That code and the
runtime were deliberately not changed to mask the environment limitation.

All **189 Rabat tests passed** in that combined run, alongside 167 passing
existing Python checks. `npm run test:security` also passed **106/106**, including
real CPU inference for the existing two cities, isolated PostgreSQL persistence/
RLS checks, signed gateway policy, Admin data and Rabat's still-unavailable public
estimation capability. `git diff --check` and final package/source hash checks
passed. These tests do not write to the configured live Supabase database.

The first run also encountered sandbox temp-directory permissions; the recorded
rerun uses an explicit writable test directory under ignored `outputs/`.

```powershell
outputs/admin-data/runtime/Scripts/python.exe -m pytest `
  tests/test_rabat_inference.py tests/test_marrakech_inference.py `
  tests/test_marrakech_availability.py tests/test_casablanca_inference.py `
  tests/test_casablanca_api.py tests/test_city_service.py `
  tests/test_gateway_security.py tests/test_preview_startup.py `
  --basetemp=outputs/rabat-audit/pytest-phase1 --tb=short -q
```

Use a new dedicated basetemp path when reproducing; pytest owns/clears that path.
No production HTTP or database calls are part of these tests; Flask requests use
its local test client. Existing source artifacts and datasets retain their audit
hashes. Existing city adapters, registries, services, API code and Supabase files
remain unmodified.
