"""A disabled Marrakech capability must never invoke any other city's model."""
import pytest

from backend.inference import registry


def test_marrakech_registry_rejects_prediction_and_context_without_fallback(monkeypatch):
    def forbidden_prediction(_payload):
        raise AssertionError("Casablanca must not predict for Marrakech")

    monkeypatch.setitem(registry.MODEL_REGISTRY["marrakech"], "public_enabled", False)
    monkeypatch.setitem(registry.MODEL_REGISTRY["casablanca"], "predict", forbidden_prediction)
    for city in ["Marrakech", "marrakech", " MARRAKECH "]:
        with pytest.raises(registry.ModelRegistryError):
            registry.predict_for_city({"city": city})
        with pytest.raises(registry.ModelRegistryError):
            registry.context_for_city({"city": city})


def test_signed_marrakech_api_request_fails_closed(signed_client):
    payload = {
        "city": "Marrakech", "property_type": "appartement", "neighborhood": "Guéliz",
        "area": 100, "rooms": 3, "bedrooms": 2, "bathrooms": 2, "floor": 4,
        "current_state": "Bon état", "age": "10-20 ans",
    }
    response = signed_client.post("/api/ml/estimate", json=payload)
    assert response.status_code == 400
    body = response.get_json()
    assert body["code"] == "unsupported_request"
    assert "estimated_price_mad" not in body
