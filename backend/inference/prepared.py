"""Python-only package discovery, deliberately separate from the public registry.

No HTTP handler imports this module. Readiness here means local artifact loading,
never deployment or authorization to serve estimates. Do not expose it as an
HTTP-controlled allow_prepared switch.
"""
from . import rabat


def model_metadata(city="Rabat", *, check_ready=False):
    if not isinstance(city, str) or city.strip().casefold() != "rabat":
        raise ValueError("No prepared-only package is registered for this city")
    metadata, manifest = rabat.load_metadata(), rabat.load_manifest()
    ready = None
    if check_ready:
        rabat.load_model()
        ready = True
    return {"city": "Rabat", "model_id": rabat.MODEL_ID,
            "model_version": rabat.MODEL_VERSION,
            "status": "prepared_internal_only", "public_enabled": False,
            "operationally_deployed": False, "artifact_present": rabat.MODEL_PATH.is_file(),
            "inference_ready": ready, "required_fields": list(manifest["required_prepared_fields"]),
            "metrics_status": metadata["metrics_status"],
            "release_blockers": list(metadata["release_blockers"])}
