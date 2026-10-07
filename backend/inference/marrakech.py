"""Internal, complete-input inference for the immutable Marrakech v1 package.

The saved stack owns all feature transforms. Raw MAD is retained for parity;
estimated_price_mad follows Casablanca's whole-MAD result convention, while
display_price_mad follows the certified notebook's nearest-1000 presentation.
No explanation or market-data provider has been certified for this city.
"""

from __future__ import annotations

import hashlib
import io
import json
import math
from functools import lru_cache
from importlib.metadata import PackageNotFoundError, version
from numbers import Real
from pathlib import Path
from typing import Any, Mapping

ROOT = Path(__file__).resolve().parents[2]
PACKAGE_PATH = ROOT / "models" / "marrakech" / "v1"
MODEL_PATH = PACKAGE_PATH / "model.pkl"
MANIFEST_PATH = PACKAGE_PATH / "preprocessing.json"
METADATA_PATH = PACKAGE_PATH / "metadata.json"
CERTIFIED_SHA256 = "623de883b958bb3fca1bfd545fa0f1d41d084179a45f901940f8901170e8dcf4"


class MarrakechInferenceError(ValueError):
    """The input does not satisfy Marrakech's certified complete contract."""


class MarrakechConfigurationError(RuntimeError):
    """The certified artifact or its runtime cannot safely be used."""


@lru_cache(maxsize=1)
def load_metadata() -> dict[str, Any]:
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_manifest() -> dict[str, Any]:
    content = MANIFEST_PATH.read_bytes()
    if hashlib.sha256(content).hexdigest() != load_metadata()["preprocessing_sha256"]:
        raise MarrakechConfigurationError("Marrakech preprocessing checksum mismatch")
    return json.loads(content.decode("utf-8"))


@lru_cache(maxsize=1)
def load_model():
    """Verify before deserializing; import model dependencies only on demand."""
    metadata = load_metadata()
    content = MODEL_PATH.read_bytes()
    if (metadata["artifact_sha256"] != CERTIFIED_SHA256
            or hashlib.sha256(content).hexdigest() != CERTIFIED_SHA256):
        raise MarrakechConfigurationError("Marrakech artifact checksum mismatch")
    for package in ("scikit-learn", "xgboost"):
        expected = metadata["dependency_versions_proven_by_evidence"][package]["version"]
        distributions = ("xgboost-cpu", "xgboost") if package == "xgboost" else (package,)
        installed = []
        for distribution in distributions:
            try:
                installed.append(version(distribution))
            except PackageNotFoundError:
                continue
        if not installed or any(actual != expected for actual in installed):
            raise MarrakechConfigurationError(f"Marrakech requires {package} {expected}")
    import joblib

    # Deserialize the very bytes verified above, not a second filesystem read.
    model = joblib.load(io.BytesIO(content))
    identity = f"{type(model).__module__}.{type(model).__name__}"
    if identity != metadata["object_class"]:
        raise MarrakechConfigurationError("Marrakech model class mismatch")
    if list(model.feature_names_in_) != load_manifest()["model_feature_names"]:
        raise MarrakechConfigurationError("Marrakech model feature order mismatch")
    return model


def _prepared_row(payload: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise MarrakechInferenceError("Marrakech input must be an object")
    city = payload.get("city")
    if not isinstance(city, str) or city.strip().casefold() != "marrakech":
        raise MarrakechInferenceError("Marrakech adapter requires city Marrakech")
    manifest = load_manifest()
    required = manifest["required_prepared_fields"]
    missing = set(required) - payload.keys()
    extra = payload.keys() - (set(required) | {"city"})
    if missing or extra:
        raise MarrakechInferenceError("Missing required or unsupported Marrakech fields")
    row = {key: payload[key] for key in required}
    type_aliases = {"appartement": "Appartement", "villa": "Villa"}
    if isinstance(row["Type"], str):
        row["Type"] = type_aliases.get(row["Type"], row["Type"])
    location = row["Localisation"]
    if isinstance(location, str):
        row["Localisation"] = manifest["verified_training_location_aliases"].get(location, location)
    for key, vocabulary in manifest["categorical"].items():
        if not isinstance(row[key], str) or row[key] not in vocabulary:
            raise MarrakechInferenceError(f"Unsupported Marrakech {key}")
    for key, constraint in manifest["numerical"].items():
        value = row[key]
        if isinstance(value, bool) or not isinstance(value, Real):
            raise MarrakechInferenceError(f"{key} must be a finite number")
        try:
            number = float(value)
        except (ValueError, OverflowError):
            raise MarrakechInferenceError(f"{key} must be a finite number") from None
        minimum = constraint.get("minimum_inclusive", constraint.get("minimum"))
        maximum = constraint["maximum"]
        if (not math.isfinite(number) or number < minimum
                or (maximum is not None and number > maximum)
                or (key != "Area" and not number.is_integer())):
            raise MarrakechInferenceError(f"{key} is outside the certified Marrakech contract")
        row[key] = number if key == "Area" else int(number)
    row["Loc_Type"] = row["Localisation"] + "|" + row["Type"]
    return row


def transform(payload: Mapping[str, Any]):
    row = _prepared_row(payload)
    import pandas as pd

    return pd.DataFrame([row], columns=load_manifest()["model_feature_names"])


def predict(payload: Mapping[str, Any]) -> dict[str, Any]:
    matrix = transform(payload)
    model = load_model()
    import numpy as np

    log_price = float(model.predict(matrix)[0])
    if not math.isfinite(log_price):
        raise RuntimeError("Marrakech model returned an invalid log price")
    with np.errstate(over="ignore", invalid="ignore"):
        raw_price = float(np.expm1(log_price))
    if not math.isfinite(raw_price) or raw_price <= 0:
        raise RuntimeError("Marrakech model returned an invalid MAD price")
    return {
        "estimated_price_mad": round(raw_price),
        "raw_price_mad": raw_price,
        "display_price_mad": int(np.round(raw_price, -3)),
        "currency": "MAD",
        "model_version": load_metadata()["model_version"],
        "model_id": load_metadata()["model_id"],
    }


def prediction_context(payload: Mapping[str, Any]) -> dict[str, Any]:
    _prepared_row(payload)
    return {"unavailable": ["explanation", "comparables", "market_context"]}
