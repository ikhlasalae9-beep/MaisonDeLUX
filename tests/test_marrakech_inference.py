"""Certified adapter parity, strict rejection, and cross-city isolation gates."""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from backend.inference import casablanca, marrakech as m, registry

ROOT = Path(__file__).resolve().parents[1]
CASES = json.loads((ROOT / "models/marrakech/v1/metadata.json").read_text(encoding="utf-8"))["golden_prediction_cases"][:3]


def prepared(case):
    return {"city": "Marrakech", **{k: v for k, v in case["input"].items() if k != "Loc_Type"}}


@pytest.fixture
def payload():
    return prepared(CASES[0])


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["id"])
def test_production_adapter_golden_parity(case, monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("Marrakech must not load Casablanca")

    monkeypatch.setattr(casablanca, "load_model", forbidden)
    result = registry.predict_for_city(prepared(case), allow_prepared=True)
    assert result["raw_price_mad"] == pytest.approx(case["expected_mad"], rel=0, abs=1e-6)
    assert result["estimated_price_mad"] == round(case["expected_mad"])
    assert result["display_price_mad"] == case["expected_display_mad"]
    assert result["currency"] == "MAD"
    assert result["model_version"] == "marrakech-stacking-v1"
    assert result["model_id"] == "marrakech-stacking-alae"
    assert m.MODEL_PATH == ROOT / "models/marrakech/v1/model.pkl"
    assert hashlib.sha256(m.MODEL_PATH.read_bytes()).hexdigest() == m.CERTIFIED_SHA256


def test_exact_feature_order_raw_area_derived_interaction_and_type_aliases(payload):
    frame = m.transform({**payload, "Type": "appartement"})
    assert list(frame.columns) == ["Type", "Localisation", "Area", "Rooms", "Bedrooms", "Bathrooms", "Current_state", "Age", "Loc_Type"]
    assert frame.shape == (1, 9)
    assert frame.iloc[0]["Area"] == 100
    assert frame.iloc[0]["Loc_Type"] == "Guéliz|Appartement"
    assert m.transform({**payload, "Type": "villa"}).iloc[0]["Type"] == "Villa"
    assert m.transform({**payload, "Localisation": "Majorelle"}).iloc[0]["Loc_Type"] == "Guéliz|Appartement"


@pytest.mark.parametrize("field", ["Type", "Localisation", "Current_state", "Age"])
@pytest.mark.parametrize("value", [None, "", "unsupported", [], True])
def test_invalid_categories_fail_before_model(payload, field, value, monkeypatch):
    monkeypatch.setattr(m, "load_model", lambda: pytest.fail("Invalid input reached model"))
    with pytest.raises(m.MarrakechInferenceError):
        m.predict({**payload, field: value})


@pytest.mark.parametrize("field", ["Type", "Localisation", "Area", "Rooms", "Bedrooms", "Bathrooms", "Current_state", "Age"])
def test_missing_required_inputs_fail(payload, field):
    del payload[field]
    with pytest.raises(m.MarrakechInferenceError):
        m.transform(payload)


@pytest.mark.parametrize("field", ["Area", "Rooms", "Bedrooms", "Bathrooms"])
@pytest.mark.parametrize("value", [None, float("nan"), float("inf"), float("-inf"), -1, 0, True, False, "100", "broken", [], 10**400])
def test_invalid_numbers_fail(payload, field, value):
    with pytest.raises(m.MarrakechInferenceError):
        m.transform({**payload, field: value})


@pytest.mark.parametrize("field,value", [("Area", 14.99), ("Rooms", 16), ("Bedrooms", 13), ("Bathrooms", 13), ("Rooms", 1.5), ("Bedrooms", 2.5), ("Bathrooms", 3.5)])
def test_ranges_and_fractional_counts_fail(payload, field, value):
    with pytest.raises(m.MarrakechInferenceError):
        m.transform({**payload, field: value})


def test_contract_boundaries_without_clipping(payload):
    frame = m.transform({**payload, "Area": 15, "Rooms": 15, "Bedrooms": 12, "Bathrooms": 12})
    assert list(frame[["Area", "Rooms", "Bedrooms", "Bathrooms"]].iloc[0]) == [15, 15, 12, 12]
    assert m.transform({**payload, "Area": 1e12}).iloc[0]["Area"] == 1e12


@pytest.mark.parametrize("field", ["Loc_Type", "Floor", "floor", "region", "parking", "balcony", "sea_view", "furnished_status"])
def test_extra_features_and_spoofed_interaction_fail(payload, field):
    with pytest.raises(m.MarrakechInferenceError):
        m.transform({**payload, field: "Casablanca|Villa"})


@pytest.mark.parametrize("city", ["Rabat", "unknown", "", None, 10])
def test_unsupported_city_has_no_fallback(payload, city, monkeypatch):
    def forbidden(_payload):
        pytest.fail("Unsupported city reached a handler")

    for entry in registry.MODEL_REGISTRY.values():
        monkeypatch.setitem(entry, "predict", forbidden)
        monkeypatch.setitem(entry, "context", forbidden)
    for handler in [registry.predict_for_city, registry.context_for_city]:
        with pytest.raises(registry.ModelRegistryError):
            handler({**payload, "city": city}, allow_prepared=True)


def test_route_de_casablanca_stays_marrakech(payload, monkeypatch):
    def forbidden(_payload):
        pytest.fail("Marrakech location dispatched to Casablanca")

    monkeypatch.setitem(registry.MODEL_REGISTRY["casablanca"], "predict", forbidden)
    monkeypatch.setattr(casablanca, "load_model", forbidden)
    request = {**payload, "Localisation": "Route de Casablanca"}
    assert m.transform(request).iloc[0]["Loc_Type"] == "Route de Casablanca|Appartement"
    assert registry.predict_for_city(request, allow_prepared=True)["model_version"] == "marrakech-stacking-v1"


def test_single_inverse_without_model_refitting(payload, monkeypatch):
    class LogModel:
        def predict(self, frame):
            assert frame.iloc[0]["Area"] == 100
            return [CASES[0]["expected_log"]]

    monkeypatch.setattr(m, "load_model", lambda: LogModel())
    original = np.expm1
    calls = []

    def inverse(value):
        calls.append(value)
        return original(value)

    monkeypatch.setattr(np, "expm1", inverse)
    assert m.predict(payload)["raw_price_mad"] == CASES[0]["expected_mad"]
    assert calls == [CASES[0]["expected_log"]]


@pytest.mark.parametrize("log_price", [float("nan"), float("inf"), 1000, 0, -1])
def test_invalid_model_outputs_fail_closed(payload, log_price, monkeypatch):
    class InvalidModel:
        def predict(self, _frame):
            return [log_price]

    monkeypatch.setattr(m, "load_model", lambda: InvalidModel())
    with pytest.raises(RuntimeError, match="invalid"):
        m.predict(payload)


def test_context_is_city_owned_unavailable_and_never_loads_a_model(payload, monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("Marrakech context touched another city or a model")

    monkeypatch.setattr(m, "load_model", forbidden)
    monkeypatch.setattr(casablanca, "load_model", forbidden)
    monkeypatch.setitem(registry.MODEL_REGISTRY["casablanca"], "context", forbidden)
    assert registry.context_for_city(payload, allow_prepared=True) == {"unavailable": ["explanation", "comparables", "market_context"]}


def test_artifact_mismatch_rejected_before_deserialization(tmp_path, monkeypatch):
    import joblib

    corrupt = tmp_path / "model.pkl"
    corrupt.write_bytes(b"not a certified model")
    m.load_model.cache_clear()
    monkeypatch.setattr(m, "MODEL_PATH", corrupt)
    monkeypatch.setattr(joblib, "load", lambda *_: pytest.fail("Unverified bytes deserialized"))
    with pytest.raises(m.MarrakechConfigurationError, match="checksum"):
        m.load_model()
    assert m.load_model.cache_info().currsize == 0


def test_runtime_mismatch_fails_closed(monkeypatch):
    m.load_model.cache_clear()
    monkeypatch.setattr(m, "version", lambda _: "incompatible")
    with pytest.raises(m.MarrakechConfigurationError, match="requires scikit-learn"):
        m.load_model()


def test_import_is_lazy_in_fresh_process():
    # Package __init__ imports the existing registry and Casablanca module;
    # this harmless module import must not load either city's artifact.
    script = "from backend.inference import marrakech as m, casablanca as c; import sys; assert all(x not in sys.modules for x in ['pandas','sklearn','xgboost']); assert m.load_model.cache_info().currsize == c.load_model.cache_info().currsize == 0"
    subprocess.run([sys.executable, "-B", "-c", script], cwd=ROOT, check=True)


def test_casablanca_dispatch_does_not_load_marrakech(monkeypatch):
    monkeypatch.setattr(m, "load_model", lambda: pytest.fail("Casablanca loaded Marrakech"))
    request = dict(city="Casablanca", property_type="appartement", neighborhood="Maârif", area=100, rooms=3, bedrooms=2, bathrooms=2, floor=4, current_state="Bon état", age="10-20 ans")
    assert registry.predict_for_city(request) == {"estimated_price_mad": 1217911, "currency": "MAD", "model_version": "casablanca-catboost-v1"}
    assert registry.context_for_city(request) == casablanca.prediction_context(request)


def test_direct_adapter_rejects_wrong_city_and_non_object(payload):
    for value in [None, [], {**payload, "city": "Casablanca"}]:
        with pytest.raises(m.MarrakechInferenceError):
            m.transform(value)


def test_prepared_registry_does_not_publicly_enable_marrakech(payload):
    assert registry.MODEL_REGISTRY["marrakech"]["public_enabled"] is False
    for handler in [registry.predict_for_city, registry.context_for_city]:
        with pytest.raises(registry.ModelRegistryError, match="not publicly enabled"):
            handler(payload)
