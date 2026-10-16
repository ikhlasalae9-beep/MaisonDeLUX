"""Prepared Rabat parity, package trust, input boundaries and public isolation."""
import copy
import hashlib
import io
import json
import subprocess
import sys
import warnings
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import pytest

from backend.inference import casablanca, marrakech, prepared, rabat as r, registry, service

ROOT = Path(__file__).resolve().parents[1]
METADATA = json.loads((ROOT / "models/rabat/v1/metadata.json").read_text(encoding="utf-8"))
CASES = METADATA["golden_prediction_cases"]


@pytest.fixture
def payload():
    return {"city": "Rabat", **CASES[0]["input"]}


@pytest.fixture
def clean_caches():
    def clear():
        for loader in [r.load_model, r.load_manifest, r.load_metadata]:
            loader.cache_clear()
    clear()
    yield
    clear()


def test_package_is_a_byte_copy_and_all_json_bytes_are_pinned():
    source = ROOT / METADATA["source_artifact"]
    assert r.MODEL_PATH.read_bytes() == source.read_bytes()
    for path, digest in [(r.MODEL_PATH, r.CERTIFIED_SHA256),
                         (r.MANIFEST_PATH, r.MANIFEST_SHA256),
                         (r.METADATA_PATH, r.METADATA_SHA256)]:
        assert hashlib.sha256(path.read_bytes()).hexdigest() == digest
    assert METADATA["artifact_size_bytes"] == 13870138
    assert METADATA["public_enabled"] is False
    assert METADATA["operationally_deployed"] is False
    assert METADATA["independent_test_metrics"] is None
    assert METADATA["trained_at"] is None


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["id"])
def test_golden_predictions_from_frozen_source_pipeline(case, monkeypatch):
    from sklearn.ensemble import RandomForestRegressor

    def forbidden(*_args, **_kwargs):
        pytest.fail("Rabat must not fit or load another city's artifact")
    monkeypatch.setattr(RandomForestRegressor, "fit", forbidden)
    monkeypatch.setattr(casablanca, "load_model", forbidden)
    monkeypatch.setattr(marrakech, "load_model", forbidden)
    payload = {"city": "Rabat", **case["input"]}
    frame = r.transform(payload)
    assert frame.iloc[0]["Localisation"] == case["expected_location"]
    assert float(r.load_model().predict(frame)[0]) == pytest.approx(case["expected_log"], abs=1e-12, rel=0)
    result = r.predict(payload)
    assert result["raw_price_mad"] == pytest.approx(case["expected_mad"], abs=1e-6, rel=0)
    assert result["estimated_price_mad"] == case["expected_estimated_price_mad"]
    assert (result["city"], result["currency"], result["model_id"], result["model_version"]) == (
        "Rabat", "MAD", "rabat-random-forest", "rabat-random-forest-v1")


def test_exact_features_no_numeric_clipping_or_city_interaction(payload):
    frame = r.transform(payload)
    assert list(frame.columns) == ["Type", "Localisation", "Area", "Rooms", "Bedrooms", "Bathrooms", "Current_state", "Age"]
    assert frame.shape == (1, 8)
    assert frame.iloc[0]["Area"] == 110
    assert frame.iloc[0]["Age"] == 7.5
    assert list(r.load_model().named_steps["prep"].get_feature_names_out()) == r.load_manifest()["embedded_preprocessing"]["encoded_feature_names"]
    assert r.load_model().named_steps["rf"].n_jobs == 1
    for field, rule in r.load_manifest()["numerical"].items():
        for boundary in [rule["minimum"], rule["maximum"]]:
            assert r.transform({**payload, field: boundary}).iloc[0][field] == boundary


@pytest.mark.parametrize("band,age", list(json.loads((ROOT / "models/rabat/v1/preprocessing.json").read_text(encoding="utf-8"))["age_band_to_years"].items()))
def test_explicit_age_mapping_and_inconnu_median(payload, band, age):
    frame = r.transform({**payload, "Current_state": band, "Age": age})
    assert frame.iloc[0]["Age"] == age


@pytest.mark.parametrize("field", ["Type", "Localisation", "Current_state"])
@pytest.mark.parametrize("value", [None, "", "unsupported", [], True, 123])
def test_invalid_categories_never_reach_artifact(payload, field, value, monkeypatch):
    monkeypatch.setattr(r, "load_model", lambda: pytest.fail("Invalid category reached artifact"))
    with pytest.raises(r.RabatInferenceError):
        r.predict({**payload, field: value})


@pytest.mark.parametrize("field", METADATA["model_feature_names"])
def test_all_eight_fields_are_required(payload, field):
    del payload[field]
    with pytest.raises(r.RabatInferenceError):
        r.transform(payload)


@pytest.mark.parametrize("field", ["Area", "Rooms", "Bedrooms", "Bathrooms", "Age"])
@pytest.mark.parametrize("value", [None, float("nan"), float("inf"), float("-inf"), -1, 0, True, False, "100", [], 10**400])
def test_invalid_numeric_inputs_fail_before_loading(payload, field, value, monkeypatch):
    monkeypatch.setattr(r, "load_model", lambda: pytest.fail("Invalid number reached artifact"))
    with pytest.raises(r.RabatInferenceError):
        r.predict({**payload, field: value})


@pytest.mark.parametrize("field,value", [("Area", 34.99), ("Area", 3000.01), ("Rooms", 19),
    ("Bedrooms", 15), ("Bathrooms", 13), ("Rooms", 2.5), ("Bedrooms", 1.5),
    ("Bathrooms", 1.5), ("Age", 15), ("Age", "5-10 ans"), ("Type", "Appartement"),
    ("Current_state", "Bon état"), ("Current_state", "Plus de 100 ans")])
def test_contract_differences_from_other_cities_are_enforced(payload, field, value):
    with pytest.raises(r.RabatInferenceError):
        r.transform({**payload, field: value})


@pytest.mark.parametrize("field", ["Floor", "floor", "Loc_Type", "region", "parking", "Price", "model_id", "allow_prepared"])
def test_unrecognized_features_are_not_silently_ignored(payload, field):
    with pytest.raises(r.RabatInferenceError):
        r.transform({**payload, field: True})


@pytest.mark.parametrize("value", [None, [], {}, {"city": "Casablanca"}, {"city": "Marrakech"}])
def test_non_objects_and_other_cities_fail(value):
    with pytest.raises(r.RabatInferenceError):
        r.transform(value)


def test_only_documented_rare_locations_map_to_autre(payload):
    manifest = r.load_manifest()
    for location in manifest["rare_neighborhood_map"]:
        assert r.transform({**payload, "Localisation": location}).iloc[0]["Localisation"] == "Autre"
    assert r.transform({**payload, "Localisation": "Hay Al Kora"}).iloc[0]["Localisation"] == "Hay Al Kora"
    with pytest.raises(r.RabatInferenceError):
        r.transform({**payload, "Localisation": "Previously unseen Rabat district"})


def test_single_inverse_transform(payload, monkeypatch):
    class LogModel:
        def predict(self, _frame):
            return [CASES[0]["expected_log"]]
    monkeypatch.setattr(r, "load_model", lambda: LogModel())
    original, calls = np.expm1, []
    def inverse(value):
        calls.append(value)
        return original(value)
    monkeypatch.setattr(np, "expm1", inverse)
    assert r.predict(payload)["raw_price_mad"] == CASES[0]["expected_mad"]
    assert calls == [CASES[0]["expected_log"]]


@pytest.mark.parametrize("output", [[float("nan")], [float("inf")], [1000], [0], [-1], [0.01], [], [[14]], [14, 15], [True], ["14"], [1j]])
def test_bad_model_outputs_fail_closed(payload, output, monkeypatch):
    class InvalidModel:
        def predict(self, _frame):
            return output
    monkeypatch.setattr(r, "load_model", lambda: InvalidModel())
    with pytest.raises(RuntimeError, match="invalid"):
        r.predict(payload)


@pytest.mark.parametrize("attribute,label", [("MODEL_PATH", "artifact"), ("MANIFEST_PATH", "preprocessing"), ("METADATA_PATH", "metadata")])
@pytest.mark.parametrize("missing", [False, True])
def test_missing_or_tampered_package_is_rejected_before_deserialization(attribute, label, missing, tmp_path, monkeypatch, clean_caches):
    import joblib
    path = tmp_path / "unverified"
    if not missing:
        path.write_bytes(b"tampered package")
    monkeypatch.setattr(r, attribute, path)
    monkeypatch.setattr(joblib, "load", lambda *_: pytest.fail("Unverified package reached deserialization"))
    with pytest.raises(r.RabatConfigurationError, match=label):
        r.load_model()
    assert r.load_model.cache_info().currsize == 0


@pytest.mark.parametrize("package", list(METADATA["tested_runtime"]["packages"]))
@pytest.mark.parametrize("missing", [False, True])
def test_dependency_guards_precede_deserialization(package, missing, monkeypatch, clean_caches):
    import joblib
    original = r.version
    def installed(name):
        if name == package:
            if missing:
                raise r.PackageNotFoundError(name)
            return "incompatible"
        return original(name)
    monkeypatch.setattr(r, "version", installed)
    monkeypatch.setattr(joblib, "load", lambda *_: pytest.fail("Incompatible runtime reached deserialization"))
    with pytest.raises(r.RabatConfigurationError, match="requires " + package):
        r.load_model()


def test_wrong_python_runtime_fails(monkeypatch, clean_caches):
    with monkeypatch.context() as context:
        context.setattr(r.sys, "version_info", (3, 11))
        with pytest.raises(r.RabatConfigurationError, match="Python 3.12"):
            r.load_model()


def test_unexpected_model_class_fails(monkeypatch, clean_caches):
    import joblib
    monkeypatch.setattr(joblib, "load", lambda *_: object())
    with pytest.raises(r.RabatConfigurationError, match="class mismatch"):
        r.load_model()


@pytest.mark.parametrize("change", ["feature_order", "step_name", "categories", "tree_count", "training_rows"])
def test_loaded_pipeline_contract_mismatch_fails(change, monkeypatch, clean_caches):
    import joblib
    model = copy.deepcopy(r.load_model())
    if change == "feature_order":
        model.named_steps["prep"].feature_names_in_ = model.feature_names_in_[::-1]
    elif change == "step_name":
        model.steps[1] = ("CatBoost", model.steps[1][1])
    elif change == "categories":
        model.named_steps["prep"].named_transformers_["cat"].categories_[0][0] = "wrong"
    elif change == "tree_count":
        model.named_steps["rf"].n_estimators = 1
    else:
        model.named_steps["rf"]._n_samples = 472
    r.load_model.cache_clear()
    monkeypatch.setattr(joblib, "load", lambda *_: model)
    with pytest.raises(r.RabatConfigurationError, match="contract mismatch"):
        r.load_model()


def test_deserializes_the_verified_bytes_once(monkeypatch, clean_caches):
    import joblib
    original_read, original_load = Path.read_bytes, joblib.load
    reads, loads = [], []
    def read(path):
        if path == r.MODEL_PATH:
            reads.append(path)
            assert len(reads) == 1
        return original_read(path)
    def load(stream):
        assert isinstance(stream, io.BytesIO)
        assert hashlib.sha256(stream.getvalue()).hexdigest() == r.CERTIFIED_SHA256
        loads.append(True)
        return original_load(stream)
    monkeypatch.setattr(Path, "read_bytes", read)
    monkeypatch.setattr(joblib, "load", load)
    assert r.load_model() is r.load_model()
    assert len(reads) == len(loads) == 1


def test_compatibility_warnings_fail_closed(monkeypatch, clean_caches):
    import joblib
    def warning(*_):
        warnings.warn("Unexpected compatibility warning", UserWarning)
    monkeypatch.setattr(joblib, "load", warning)
    with pytest.raises(r.RabatConfigurationError, match="tested runtime"):
        r.load_model()
    assert r.load_model.cache_info().currsize == 0


def test_repeat_and_concurrent_predictions_preserve_golden(payload):
    expected = CASES[0]["expected_mad"]
    assert all(r.predict(payload)["raw_price_mad"] == expected for _ in range(3))
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(r.predict, [payload] * 4))
    assert all(item["raw_price_mad"] == expected for item in results)


def test_prepared_discovery_is_truthful_and_never_an_activation(clean_caches):
    metadata = prepared.model_metadata()
    assert metadata["status"] == "prepared_internal_only"
    assert metadata["public_enabled"] is metadata["operationally_deployed"] is False
    assert metadata["artifact_present"] is True
    assert metadata["inference_ready"] is None
    assert metadata["metrics_status"] == "no_independent_holdout_validation"
    assert r.load_model.cache_info().currsize == 0
    assert prepared.model_metadata(check_ready=True)["inference_ready"] is True
    assert registry.MODEL_REGISTRY["rabat"]["public_enabled"] is True
    assert registry.MODEL_REGISTRY["rabat"]["status"] == "available"
    with pytest.raises(ValueError):
        prepared.model_metadata("Casablanca")


def test_context_does_not_load_models(payload, monkeypatch):
    monkeypatch.setattr(r, "load_model", lambda: pytest.fail("Context loaded artifact"))
    assert r.prediction_context(payload) == {"unavailable": ["explanation", "comparables", "market_context"]}


def test_disabled_rabat_gate_still_rejects_without_fallback(payload, monkeypatch):
    monkeypatch.setitem(registry.MODEL_REGISTRY["rabat"], "public_enabled", False)
    monkeypatch.setattr(r, "load_model", lambda: pytest.fail("Public dispatcher reached Rabat"))
    for handler in [registry.predict_for_city, registry.context_for_city, service.estimate, service.context]:
        with pytest.raises(registry.ModelRegistryError):
            handler(payload)


def test_signed_http_rejects_prepared_shape_and_client_bypass(payload, signed_client, monkeypatch):
    monkeypatch.setattr(r, "load_model", lambda: pytest.fail("HTTP reached Rabat"))
    for path in ["/api/ml/estimate", "/api/ml/context"]:
        for body in [payload, {**payload, "allow_prepared": True}]:
            response = signed_client.post(path, json=body)
            assert response.status_code == 400
            assert response.get_json()["code"] == "unsupported_request"
            assert "estimated_price_mad" not in response.get_json()
    description = signed_client.get("/api/ml/metadata?city=Rabat")
    assert description.status_code == 200
    assert description.get_json()["public_enabled"] is True
    assert description.get_json()["status"] == "available"
    # Readiness is a protected internal check, not an estimate or activation.


def test_import_and_discovery_are_lazy_in_fresh_process():
    script = "from backend.inference import rabat, prepared, casablanca, marrakech; import sys; prepared.model_metadata(); assert all(name not in sys.modules for name in ['pandas','sklearn','xgboost','catboost','backend.app']); assert all(adapter.load_model.cache_info().currsize == 0 for adapter in [rabat,casablanca,marrakech])"
    subprocess.run([sys.executable, "-B", "-c", script], cwd=ROOT, check=True, timeout=30)
