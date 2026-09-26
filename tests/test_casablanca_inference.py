"""Targeted verification for the protected Casablanca inference package."""

import csv
import hashlib
import math
from pathlib import Path

import numpy as np
import pytest

from backend.inference.casablanca import (
    CasablancaInferenceError,
    load_manifest,
    load_model,
    predict,
    transform,
)
from backend.inference.registry import ModelRegistryError, predict_for_city


ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = {
    "ml/notebooks/modele_MaisonDeLUX.pkl": "b5ba50e9b6fd35203b556c840fe97170ee23441a6cce0ffa927f3c09944b8e1d",
    "ml/notebooks/maisondelux_notebook1.ipynb": "d6868054da607581fe19aa25e5056267cc8228874f5ed87e3bf8bf5b14939312",
    "ml/notebooks/mubawab_listings_clean.csv": "45331a0f1615c6fe3bdd77051e3c4b5e3e5411f43223e2c4eedc2d4443f5bcfe",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


@pytest.fixture
def valid_payload():
    return {
        "city": "Casablanca",
        "property_type": "appartement",
        "neighborhood": "Maârif",
        "area": 100,
        "rooms": 3,
        "bedrooms": 2,
        "bathrooms": 2,
        "floor": 4,
        "current_state": "Bon état",
        "age": "10-20 ans",
    }


def test_original_research_files_are_unchanged_and_copy_is_identical():
    for relative_path, expected in ORIGINALS.items():
        assert sha256(ROOT / relative_path) == expected
    assert sha256(ROOT / "models/casablanca/v1/model.pkl") == ORIGINALS[
        "ml/notebooks/modele_MaisonDeLUX.pkl"
    ]


def test_trusted_model_loads_with_verified_feature_contract():
    model = load_model()
    manifest = load_manifest()
    assert model.__class__.__module__ == "catboost.core"
    assert model.__class__.__name__ == "CatBoostRegressor"
    assert len(model.feature_names_) == 117
    assert list(model.feature_names_) == manifest["model_feature_names"]


def test_preprocessing_order_caps_and_single_area_transform(valid_payload):
    matrix = transform(valid_payload)
    names = load_manifest()["model_feature_names"]
    assert matrix.shape == (1, 117)
    assert matrix[0, names.index("Area")] == pytest.approx(np.log1p(100))
    assert matrix[0, names.index("Rooms")] == 3
    capped = {**valid_payload, "rooms": 99, "bedrooms": 88, "bathrooms": 77, "floor": 66}
    capped_matrix = transform(capped)
    for name in ("Rooms", "Bedrooms", "Bathrooms", "Floor"):
        assert capped_matrix[0, names.index(name)] == 10


def test_missing_state_and_age_use_training_all_zero_encoding(valid_payload):
    payload = {**valid_payload, "current_state": None, "age": None}
    matrix = transform(payload)
    names = load_manifest()["model_feature_names"]
    state_age_indices = [
        index for index, name in enumerate(names)
        if name.startswith("Current_state_") or name.startswith("Age_")
    ]
    assert np.count_nonzero(matrix[0, state_age_indices]) == 0


def test_every_supported_casablanca_category_is_transformable(valid_payload):
    categorical = load_manifest()["categorical"]
    for property_type in categorical["Type"]["accepted"]:
        assert transform({**valid_payload, "property_type": property_type}).shape == (1, 117)
    for neighborhood in categorical["Localisation"]["accepted"]:
        assert transform({**valid_payload, "neighborhood": neighborhood}).shape == (1, 117)
    for current_state in categorical["Current_state"]["accepted"]:
        assert transform({**valid_payload, "current_state": current_state}).shape == (1, 117)
    for age in categorical["Age"]["accepted"]:
        assert transform({**valid_payload, "age": age}).shape == (1, 117)


def test_valid_property_reaches_model_without_price_inverse_transform(valid_payload):
    matrix = transform(valid_payload)
    raw_price = float(load_model().predict(matrix)[0])
    response = predict(valid_payload)
    assert math.isfinite(raw_price) and raw_price > 0
    assert response["estimated_price_mad"] == round(raw_price)
    assert response["currency"] == "MAD"
    assert response["model_version"] == "casablanca-catboost-v1"


def test_prediction_context_uses_native_shap_and_real_reference_rows(valid_payload):
    response = predict(valid_payload)
    explanation = response["explanation"]
    assert explanation["method"] == "catboost_shap_values"
    assert {factor["key"] for factor in explanation["factors"]} == {
        "property_type", "neighborhood", "area", "rooms", "bedrooms",
        "bathrooms", "floor", "current_state", "age",
    }
    reconstructed = explanation["baseline_mad"] + sum(
        factor["contribution_mad"] for factor in explanation["factors"]
    )
    assert reconstructed == pytest.approx(response["estimated_price_mad"], abs=6)

    comparables = response["comparables"]
    assert 1 <= len(comparables) <= 4
    assert all(item["property_type"] == "Appartements" for item in comparables)
    with (ROOT / "ml/notebooks/mubawab_listings_clean.csv").open(encoding="utf-8", newline="") as stream:
        source_rows = list(csv.DictReader(stream))
    assert all(any(
        row["Localisation"] == item["neighborhood"]
        and round(float(row["Price"])) == item["listing_price_mad"]
        and float(row["Area"]) == item["area"]
        for row in source_rows
    ) for item in comparables)


def test_context_can_be_skipped_without_changing_prediction(valid_payload):
    enriched = predict(valid_payload)
    lightweight = predict(valid_payload, include_context=False)
    assert lightweight["estimated_price_mad"] == enriched["estimated_price_mad"]
    assert lightweight["model_version"] == enriched["model_version"]
    assert "explanation" not in lightweight
    assert "comparables" not in lightweight


def test_unsupported_city_and_property_type_are_rejected(valid_payload):
    with pytest.raises(CasablancaInferenceError):
        transform({**valid_payload, "city": "Rabat"})
    with pytest.raises(CasablancaInferenceError):
        transform({**valid_payload, "property_type": "riad"})
    with pytest.raises(ModelRegistryError):
        predict_for_city({**valid_payload, "city": "Rabat"})


def test_registry_publicly_enables_only_verified_casablanca_model(valid_payload):
    response = predict_for_city(valid_payload)
    assert response["model_version"] == "casablanca-catboost-v1"
