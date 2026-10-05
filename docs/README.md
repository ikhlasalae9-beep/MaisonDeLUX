# Documentation entry point

Current architecture: Next.js at the repository root; `app/api/estimations/`
enforces account/guest entitlements and uses the signed Python gateway in
`lib/estimations/gateway.ts`. Flask serves `/api/ml/*`. Only Casablanca is
registered for public inference, using `models/casablanca/v1/` and
`backend/inference/casablanca.py`. Market reference data is in `server-data/`.
Generic artifacts remain dependencies of backend startup, supporting endpoints,
location UI and tests; their presence does not enable another city.

- Collection: [DATA_COLLECTION](DATA_COLLECTION.md), [SCRAPING_AND_RECOVERY](SCRAPING_AND_RECOVERY.md), [SCRAPING_V3](SCRAPING_V3.md).
- ML preparation/provenance: [DATA_PIPELINE](DATA_PIPELINE.md), [DATA_SCHEMA](DATA_SCHEMA.md), original notebooks.
- Future city delivery: [Alae handoff](ALAE_MODEL_TRAINING_HANDOFF.md).
- Geography: [GEOGRAPHIC_DATA](GEOGRAPHIC_DATA.md), [CITY_MARKET_MAPPING](CITY_MARKET_MAPPING.md).
- Team workflow: [GIT_WORKFLOW](GIT_WORKFLOW.md), [Alae](GIT_GUIDE_ALAE.md), [Zineb](GIT_GUIDE_ZINEB.md).
- Phase C/auth: [manual setup](phase-c-manual-setup.md), [verification](phase-c-verification.md), [email setup](auth-email-setup.md).

Historical research: MODEL_V1 describes the former generic XGBoost path;
ML_AUDIT records earlier experiments. Neither specifies current Casablanca
inference. Reports are historical evidence, not current runtime contracts.
Collection documents describe successive pipelines; consult their release gates.

Notebook root: `ml/notebooks/`; generic workflows: `ml/notebooks/workflows/`.
See the city handoff for data/model paths. QA PDF: `reports/qa/`; workbook
previews: `reports/data_quality/workbook-previews/`. Acquisition tools and
metadata: `scripts/media/`; workbook generator: `scripts/data/`.
