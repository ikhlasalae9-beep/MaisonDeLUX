"""Inference-only adapter for Alae's approved Casablanca CatBoost artifact."""

from __future__ import annotations

import ast
import csv
import hashlib
import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any, Mapping

import joblib
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
PACKAGE_DIR = ROOT / "models" / "casablanca" / "v1"
MODEL_PATH = PACKAGE_DIR / "model.pkl"
MANIFEST_PATH = PACKAGE_DIR / "preprocessing.json"
METADATA_PATH = PACKAGE_DIR / "metadata.json"
REFERENCE_DATASET_PATH = ROOT / "ml" / "notebooks" / "mubawab_listings_clean.csv"


class CasablancaInferenceError(ValueError):
    """Raised when a request cannot be represented by the approved model."""


@lru_cache(maxsize=1)
def load_manifest() -> dict[str, Any]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_metadata() -> dict[str, Any]:
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


@lru_cache(maxsize=1)
def load_model():
    metadata = load_metadata()
    if _sha256(MODEL_PATH) != metadata["artifact_sha256"]:
        raise RuntimeError("Casablanca model checksum mismatch")

    model = joblib.load(MODEL_PATH)
    expected_class = "catboost.core.CatBoostRegressor"
    actual_class = f"{model.__class__.__module__}.{model.__class__.__name__}"
    if actual_class != expected_class:
        raise RuntimeError(f"Unexpected Casablanca model class: {actual_class}")

    expected_names = load_manifest()["model_feature_names"]
    if list(model.feature_names_) != expected_names:
        raise RuntimeError("Casablanca model feature contract mismatch")
    return model


def _text(payload: Mapping[str, Any], field: str, *, required: bool = True) -> str | None:
    value = payload.get(field)
    if value is None or value == "":
        if required:
            raise CasablancaInferenceError(f"{field} is required")
        return None
    if not isinstance(value, str):
        raise CasablancaInferenceError(f"{field} must be text")
    value = value.strip()
    if not value and required:
        raise CasablancaInferenceError(f"{field} is required")
    return value or None


def _number(
    payload: Mapping[str, Any],
    field: str,
    *,
    minimum: float,
    integer: bool,
) -> float:
    value = payload.get(field)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise CasablancaInferenceError(f"{field} must be numeric")
    number = float(value)
    if not math.isfinite(number) or number < minimum:
        raise CasablancaInferenceError(f"{field} is outside the supported range")
    if integer and not number.is_integer():
        raise CasablancaInferenceError(f"{field} must be an integer")
    return number


def transform(payload: Mapping[str, Any]) -> np.ndarray:
    """Reproduce the final notebook matrix in the model's stored feature order."""
    if not isinstance(payload, Mapping):
        raise CasablancaInferenceError("A JSON object is required")

    manifest = load_manifest()
    allowed_fields = set(manifest["logical_inputs"])
    extras = set(payload) - allowed_fields
    if extras:
        raise CasablancaInferenceError(f"Unsupported fields: {', '.join(sorted(extras))}")

    city = _text(payload, "city")
    if city.casefold() != "casablanca":
        raise CasablancaInferenceError("Estimation is not available for this city")

    property_type = _text(payload, "property_type")
    type_map = manifest["categorical"]["Type"]["accepted"]
    if property_type not in type_map:
        raise CasablancaInferenceError("Unsupported property_type for the Casablanca model")

    neighborhood = _text(payload, "neighborhood")
    neighborhoods = manifest["categorical"]["Localisation"]["accepted"]
    if neighborhood not in neighborhoods:
        raise CasablancaInferenceError("Unsupported neighborhood for the Casablanca model")

    current_state = _text(payload, "current_state", required=False)
    states = manifest["categorical"]["Current_state"]["accepted"]
    if current_state is not None and current_state not in states:
        raise CasablancaInferenceError("Unsupported current_state for the Casablanca model")

    age = _text(payload, "age", required=False)
    ages = manifest["categorical"]["Age"]["accepted"]
    if age is not None and age not in ages:
        raise CasablancaInferenceError("Unsupported age for the Casablanca model")

    area = _number(payload, "area", minimum=np.nextafter(0.0, 1.0), integer=False)
    rooms = _number(payload, "rooms", minimum=1, integer=True)
    bedrooms = _number(payload, "bedrooms", minimum=1, integer=True)
    bathrooms = _number(payload, "bathrooms", minimum=1, integer=True)
    floor = _number(payload, "floor", minimum=0, integer=True)

    names = manifest["model_feature_names"]
    index = {name: position for position, name in enumerate(names)}
    vector = np.zeros(len(names), dtype=np.float64)
    vector[index["Area"]] = np.log1p(area)
    vector[index["Rooms"]] = min(rooms, 10)
    vector[index["Bedrooms"]] = min(bedrooms, 10)
    vector[index["Bathrooms"]] = min(bathrooms, 10)
    vector[index["Floor"]] = min(floor, 10)
    vector[index[f"Type_{type_map[property_type]}"]] = 1.0
    vector[index[f"Localisation_{neighborhood}"]] = 1.0
    if current_state is not None:
        vector[index[f"Current_state_{current_state}"]] = 1.0
    if age is not None:
        vector[index[f"Age_{age}"]] = 1.0
    return vector.reshape(1, -1)


def _local_contributions(matrix: np.ndarray) -> dict[str, Any]:
    # Keep CatBoost's explainability module off metadata/page-startup paths.
    from catboost import Pool

    names = load_manifest()["model_feature_names"]
    shap = load_model().get_feature_importance(
        Pool(matrix, feature_names=names), type="ShapValues"
    )[0]
    feature_values = dict(zip(names, shap[:-1], strict=True))
    groups = {
        "property_type": sum(value for name, value in feature_values.items() if name.startswith("Type_")),
        "neighborhood": sum(value for name, value in feature_values.items() if name.startswith("Localisation_")),
        "area": feature_values["Area"],
        "rooms": feature_values["Rooms"],
        "bedrooms": feature_values["Bedrooms"],
        "bathrooms": feature_values["Bathrooms"],
        "floor": feature_values["Floor"],
        "current_state": sum(value for name, value in feature_values.items() if name.startswith("Current_state_")),
        "age": sum(value for name, value in feature_values.items() if name.startswith("Age_")),
    }
    factors = [
        {"key": key, "contribution_mad": round(float(value))}
        for key, value in sorted(groups.items(), key=lambda item: abs(item[1]), reverse=True)
    ]
    return {
        "method": "catboost_shap_values",
        "baseline_mad": round(float(shap[-1])),
        "factors": factors,
    }


@lru_cache(maxsize=1)
def _reference_rows() -> tuple[dict[str, Any], ...]:
    rows: list[dict[str, Any]] = []
    with REFERENCE_DATASET_PATH.open(encoding="utf-8", newline="") as stream:
        for source in csv.DictReader(stream):
            try:
                tags = ast.literal_eval(source["Other_tags"])
                row = {
                    "property_type": source["Type"],
                    "neighborhood": source["Localisation"],
                    "listing_price_mad": round(float(source["Price"])),
                    "area": float(source["Area"]),
                    "rooms": int(float(source["Rooms"])),
                    "bedrooms": int(float(source["Bedrooms"])),
                    "bathrooms": int(float(source["Bathrooms"])),
                    "floor": int(float(source["Floor"])),
                    "tags": [str(tag) for tag in tags] if isinstance(tags, list) else [],
                }
            except (KeyError, TypeError, ValueError, SyntaxError):
                continue
            if row["listing_price_mad"] > 0 and row["area"] > 0:
                rows.append(row)
    return tuple(rows)


def _comparables(payload: Mapping[str, Any], *, limit: int = 4) -> list[dict[str, Any]]:
    type_value = load_manifest()["categorical"]["Type"]["accepted"][payload["property_type"]]
    target_area = float(payload["area"])

    def score(row: Mapping[str, Any]) -> float:
        neighborhood_penalty = 0 if row["neighborhood"] == payload["neighborhood"] else 12
        area_penalty = min(abs(float(row["area"]) - target_area) / max(target_area, 1), 2) * 6
        structure_penalty = (
            abs(int(row["rooms"]) - int(payload["rooms"])) * 0.8
            + abs(int(row["bedrooms"]) - int(payload["bedrooms"])) * 0.8
            + abs(int(row["bathrooms"]) - int(payload["bathrooms"])) * 0.8
            + abs(int(row["floor"]) - int(payload["floor"])) * 0.25
        )
        tag_penalty = 0.0
        for key in ("current_state", "age"):
            requested = payload.get(key)
            if requested and requested not in row["tags"]:
                tag_penalty += 0.6
        return neighborhood_penalty + area_penalty + structure_penalty + tag_penalty

    candidates = [row for row in _reference_rows() if row["property_type"] == type_value]
    nearest = sorted(candidates, key=score)[:limit]
    return [
        {
            **row,
            "area": round(float(row["area"]), 1),
            "same_neighborhood": row["neighborhood"] == payload["neighborhood"],
            "area_difference_m2": round(abs(float(row["area"]) - target_area), 1),
        }
        for row in nearest
    ]


def prediction_context(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Optional Phase A analysis; failures here must never block base inference."""
    matrix = transform(payload)
    response: dict[str, Any] = {}
    unavailable: list[str] = []
    try:
        response["explanation"] = _local_contributions(matrix)
    except Exception:
        unavailable.append("explanation")
    try:
        response["comparables"] = _comparables(payload)
    except Exception:
        unavailable.append("comparables")
    if unavailable:
        response["unavailable"] = unavailable
    return response


def predict(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Run only the approved preprocessing -> CatBoost prediction path."""
    matrix = transform(payload)
    raw_price = float(load_model().predict(matrix)[0])
    if not math.isfinite(raw_price) or raw_price <= 0:
        raise RuntimeError("Casablanca model returned an invalid price")
    metadata = load_metadata()
    return {
        "estimated_price_mad": round(raw_price),
        "currency": "MAD",
        "model_version": metadata["model_version"],
    }
