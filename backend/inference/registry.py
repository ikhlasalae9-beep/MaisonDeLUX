"""Minimal city-to-model registry; prepared models are not public by default."""

from __future__ import annotations

from typing import Any, Mapping

from . import casablanca


class ModelRegistryError(ValueError):
    """Raised when a city has no enabled model."""


MODEL_REGISTRY = {
    "casablanca": {
        "city": "Casablanca",
        "model_id": "casablanca-catboost-alae",
        "version": "casablanca-catboost-v1",
        "status": "available",
        "public_enabled": True,
        "predict": casablanca.predict,
    }
}


def predict_for_city(
    payload: Mapping[str, Any], *, allow_prepared: bool = False, include_context: bool = True
) -> dict[str, Any]:
    city = payload.get("city") if isinstance(payload, Mapping) else None
    key = city.strip().casefold() if isinstance(city, str) else ""
    entry = MODEL_REGISTRY.get(key)
    if entry is None:
        raise ModelRegistryError("No model is registered for this city")
    if not entry["public_enabled"] and not allow_prepared:
        raise ModelRegistryError("This city model is prepared but not publicly enabled")
    return entry["predict"](payload, include_context=include_context)
