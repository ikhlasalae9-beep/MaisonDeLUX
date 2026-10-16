"""Prepared Python-only Rabat inference. No public registry or HTTP integration.

The frozen pipeline owns encoding and the forest. The adapter only validates
the eight inputs, applies the documented rare-location mapping, and inverts the
log-price target once. Package hashes are pinned independently of the JSON files.
"""
from __future__ import annotations

import hashlib
import io
import json
import math
import sys
import warnings
from functools import lru_cache
from importlib.metadata import PackageNotFoundError, version
from numbers import Real
from pathlib import Path
from typing import Any, Mapping

ROOT = Path(__file__).resolve().parents[2]
PACKAGE_PATH = ROOT / "models" / "rabat" / "v1"
MODEL_PATH = PACKAGE_PATH / "model.joblib"
MANIFEST_PATH = PACKAGE_PATH / "preprocessing.json"
METADATA_PATH = PACKAGE_PATH / "metadata.json"
CERTIFIED_SHA256 = "e2d7355966d5424e09e9b2f3afb8f381dc4b1b2be183a2e4f31fdda17880ab60"
MANIFEST_SHA256 = "37d2ea1a6ec1fb2e531818a648ca885b32fe21fae50f090ace1b276ce98c1f74"
METADATA_SHA256 = "72730f0817c6365654e0977e56779329d5743b37a1234894ff2c5794304f2865"
MODEL_ID = "rabat-random-forest"
MODEL_VERSION = "rabat-random-forest-v1"


class RabatInferenceError(ValueError):
    """Input is outside the prepared Rabat contract."""


class RabatConfigurationError(RuntimeError):
    """The immutable package or its tested runtime is unavailable/inconsistent."""


def _verified_bytes(path: Path, expected: str, label: str) -> bytes:
    try:
        content = path.read_bytes()
    except OSError as error:
        raise RabatConfigurationError(f"Rabat {label} is unavailable") from error
    if hashlib.sha256(content).hexdigest() != expected:
        raise RabatConfigurationError(f"Rabat {label} checksum mismatch")
    return content


@lru_cache(maxsize=1)
def load_metadata() -> dict[str, Any]:
    return json.loads(_verified_bytes(METADATA_PATH, METADATA_SHA256, "metadata"))


@lru_cache(maxsize=1)
def load_manifest() -> dict[str, Any]:
    metadata = load_metadata()
    if metadata["preprocessing_sha256"] != MANIFEST_SHA256:
        raise RabatConfigurationError("Rabat manifest identity mismatch")
    return json.loads(_verified_bytes(MANIFEST_PATH, MANIFEST_SHA256, "preprocessing"))


def _runtime_guard(metadata: Mapping[str, Any]) -> None:
    if sys.version_info[:2] != (3, 12):
        raise RabatConfigurationError("Rabat requires the tested Python 3.12 runtime")
    for package, expected in metadata["tested_runtime"]["packages"].items():
        try:
            actual = version(package)
        except PackageNotFoundError as error:
            raise RabatConfigurationError(f"Rabat requires {package} {expected}") from error
        if actual != expected:
            raise RabatConfigurationError(f"Rabat requires {package} {expected}")


def _check_pipeline(model: Any, manifest: Mapping[str, Any]) -> None:
    def identity(value):
        return f"{type(value).__module__}.{type(value).__name__}"

    if identity(model) != "sklearn.pipeline.Pipeline":
        raise RabatConfigurationError("Rabat model class mismatch")
    try:
        if [name for name, _ in model.steps] != ["prep", "rf"]:
            raise ValueError("steps")
        prep, forest = model.named_steps["prep"], model.named_steps["rf"]
        encoder = prep.named_transformers_["cat"]
        if (identity(prep) != "sklearn.compose._column_transformer.ColumnTransformer"
                or identity(forest) != "sklearn.ensemble._forest.RandomForestRegressor"
                or identity(encoder) != "sklearn.preprocessing._encoders.OneHotEncoder"):
            raise ValueError("classes")
        if (list(model.feature_names_in_) != manifest["model_feature_names"]
                or list(prep.feature_names_in_) != manifest["model_feature_names"]
                or list(prep.get_feature_names_out()) != manifest["embedded_preprocessing"]["encoded_feature_names"]):
            raise ValueError("features")
        fields = manifest["embedded_preprocessing"]["categorical_features"]
        if [list(values) for values in encoder.categories_] != [manifest["categorical"][field] for field in fields]:
            raise ValueError("categories")
        if (forest.n_estimators != 500 or len(forest.estimators_) != 500
                or forest.min_samples_leaf != 2 or forest.random_state != 42
                or forest.n_features_in_ != 43 or forest._n_samples != 700
                or encoder.handle_unknown != "ignore" or prep.remainder != "passthrough"):
            raise ValueError("fitted contract")
    except (AttributeError, KeyError, TypeError, ValueError) as error:
        raise RabatConfigurationError("Rabat fitted pipeline contract mismatch") from error


@lru_cache(maxsize=1)
def load_model():
    metadata, manifest = load_metadata(), load_manifest()
    if (metadata["artifact_sha256"] != CERTIFIED_SHA256
            or metadata["model_id"] != MODEL_ID or metadata["model_version"] != MODEL_VERSION
            or metadata["public_enabled"] is not False
            or metadata["operationally_deployed"] is not False):
        raise RabatConfigurationError("Rabat package identity/status mismatch")
    content = _verified_bytes(MODEL_PATH, CERTIFIED_SHA256, "artifact")
    _runtime_guard(metadata)
    # Import only after package validation. Never deserialize a second file read.
    import joblib

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error")
            model = joblib.load(io.BytesIO(content))
            _check_pipeline(model, manifest)
    except RabatConfigurationError:
        raise
    except Exception as error:
        raise RabatConfigurationError("Rabat model could not be loaded in the tested runtime") from error
    # Execution policy only: keep all trees/weights/transforms intact, do not fit
    # or reserialize, and avoid the artifact's unbounded n_jobs=-1 setting.
    model.named_steps["rf"].n_jobs = 1
    return model


def _prepared_row(payload: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise RabatInferenceError("Rabat input must be an object")
    city = payload.get("city")
    if not isinstance(city, str) or city.strip().casefold() != "rabat":
        raise RabatInferenceError("Rabat adapter requires city Rabat")
    manifest = load_manifest()
    fields = manifest["required_prepared_fields"]
    if set(payload) != {"city", *fields}:
        raise RabatInferenceError("All eight Rabat fields are required; unsupported fields are rejected")
    row = {field: payload[field] for field in fields}
    for field, vocabulary in manifest["categorical"].items():
        value = row[field]
        if not isinstance(value, str):
            raise RabatInferenceError(f"Unsupported Rabat {field}")
        if field == "Localisation":
            value = manifest["rare_neighborhood_map"].get(value, value)
        if value not in vocabulary:
            raise RabatInferenceError(f"Unsupported Rabat {field}")
        row[field] = value
    for field in [*manifest["numerical"], "Age"]:
        value = row[field]
        if isinstance(value, bool) or not isinstance(value, Real):
            raise RabatInferenceError(f"{field} must be a finite number")
        try:
            number = float(value)
        except (ValueError, OverflowError):
            raise RabatInferenceError(f"{field} must be a finite number") from None
        if not math.isfinite(number):
            raise RabatInferenceError(f"{field} must be a finite number")
        if field == "Age":
            if number != manifest["age_band_to_years"][row["Current_state"]]:
                raise RabatInferenceError("Age must match the documented Current_state band")
            row[field] = number
            continue
        rule = manifest["numerical"][field]
        if (number < rule["minimum"] or number > rule["maximum"]
                or (rule["integer"] and not number.is_integer())):
            raise RabatInferenceError(f"{field} is outside the prepared Rabat contract")
        row[field] = int(number) if rule["integer"] else number
    return row


def transform(payload: Mapping[str, Any]):
    row = _prepared_row(payload)
    import pandas as pd

    return pd.DataFrame([row], columns=load_manifest()["model_feature_names"])


def predict(payload: Mapping[str, Any]) -> dict[str, Any]:
    matrix = transform(payload)  # Invalid inputs never reach artifact loading.
    model = load_model()
    import numpy as np

    output = np.asarray(model.predict(matrix))
    if output.shape != (1,) or output.dtype.kind not in "fiu":
        raise RuntimeError("Rabat model returned an invalid output shape/type")
    log_price = float(output[0])
    if not math.isfinite(log_price):
        raise RuntimeError("Rabat model returned an invalid log price")
    with np.errstate(over="ignore", invalid="ignore"):
        raw_price = float(np.expm1(log_price))
    if not math.isfinite(raw_price) or raw_price <= 0 or round(raw_price) <= 0:
        raise RuntimeError("Rabat model returned an invalid MAD price")
    return {"city": "Rabat", "estimated_price_mad": round(raw_price),
            "raw_price_mad": raw_price, "currency": "MAD",
            "model_id": MODEL_ID, "model_version": MODEL_VERSION}


def prediction_context(payload: Mapping[str, Any]) -> dict[str, Any]:
    _prepared_row(payload)
    return {"unavailable": ["explanation", "comparables", "market_context"]}
