"""City-specific application contracts. Prepared execution is Python-only.

HTTP handlers never accept or forward a caller's allow_prepared field.
"""
from typing import Mapping
from . import casablanca, marrakech, registry

MARRAKECH_FIELDS = {
    "property_type": "Type", "neighborhood": "Localisation", "area": "Area",
    "rooms": "Rooms", "bedrooms": "Bedrooms", "bathrooms": "Bathrooms",
    "current_state": "Current_state", "age": "Age",
}
ADAPTERS = {"casablanca": casablanca, "marrakech": marrakech}


def entry_for(payload, *, allow_prepared=False):
    return registry._public_entry(payload, allow_prepared=allow_prepared)


def normalized_input(payload, *, allow_prepared=False):
    entry = entry_for(payload, allow_prepared=allow_prepared)
    key = entry["city"].casefold()
    if key == "marrakech":
        if set(payload) != {"city", *MARRAKECH_FIELDS}:
            raise marrakech.MarrakechInferenceError("Missing required or unsupported Marrakech fields")
        prepared = {"city": entry["city"], **{target: payload[source] for source, target in MARRAKECH_FIELDS.items()}}
        row = marrakech._prepared_row(prepared)
        normalized = {"city": entry["city"], **{source: row[target] for source, target in MARRAKECH_FIELDS.items()}}
        normalized["property_type"] = normalized["property_type"].casefold()
        return entry, prepared, normalized
    if key != "casablanca":
        raise registry.ModelRegistryError("No application contract is registered for this city")
    casablanca.transform(payload)
    return entry, dict(payload), dict(payload)


def estimate(payload, *, allow_prepared=False):
    entry, prepared, _ = normalized_input(payload, allow_prepared=allow_prepared)
    result = registry.predict_for_city(prepared, allow_prepared=allow_prepared)
    if (result.get("model_version") != entry["version"]
            or result.get("city", entry["city"]) != entry["city"]
            or result.get("model_id", entry["model_id"]) != entry["model_id"]):
        raise RuntimeError("City/model identity mismatch")
    return {**result, "city": entry["city"], "model_id": entry["model_id"]}


def context(payload, *, allow_prepared=False):
    _, prepared, _ = normalized_input(payload, allow_prepared=allow_prepared)
    return registry.context_for_city(prepared, allow_prepared=allow_prepared)


def model_metadata(city="Casablanca", *, check_ready=False):
    entry = entry_for({"city": city}, allow_prepared=True)
    adapter = ADAPTERS[entry["city"].casefold()]
    manifest = adapter.load_manifest()
    supported = {}
    for field, output in [("Type", "property_types"), ("Localisation", "neighborhoods"), ("Current_state", "current_states"), ("Age", "ages")]:
        rule = manifest["categorical"][field]
        supported[output] = list(rule["accepted"] if isinstance(rule, Mapping) else rule)
    if entry["city"] == "Marrakech":
        supported["property_types"] = [value.casefold() for value in supported["property_types"]]
    present = adapter.MODEL_PATH.is_file()
    ready = None
    if check_ready:
        adapter.load_model()
        ready = True
    return {"city": entry["city"], "status": entry["status"], "public_enabled": entry["public_enabled"],
            "model_version": entry["version"], "model_id": entry["model_id"],
            "artifact_present": present, "inference_ready": ready, "supported": supported}
