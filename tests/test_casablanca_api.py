"""Focused public API policy tests for the Casablanca-only Phase 3 service."""

import math

import pytest

from api.index import app


@pytest.fixture
def client():
    return app.test_client()


@pytest.fixture
def payload():
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


def test_ml_health_and_metadata_are_casablanca_only(client):
    health = client.get("/api/ml/health")
    assert health.status_code == 200
    assert health.get_json()["city"] == "Casablanca"
    assert health.get_json()["public_enabled"] is True

    metadata = client.get("/api/ml/metadata")
    assert metadata.status_code == 200
    body = metadata.get_json()
    assert body["status"] == "available"
    assert body["supported"]["property_types"] == ["appartement", "villa"]
    assert "Maârif" in body["supported"]["neighborhoods"]


def test_valid_casablanca_request_uses_catboost_without_phase_a_dependency(client, payload):
    response = client.post("/api/ml/estimate", json=payload)
    assert response.status_code == 200
    body = response.get_json()
    assert math.isfinite(body["estimated_price_mad"])
    assert body["estimated_price_mad"] > 0
    assert body["model_version"] == "casablanca-catboost-v1"
    assert "explanation" not in body
    assert "comparables" not in body


def test_optional_context_is_loaded_separately_after_prediction(client, payload):
    normal = client.post("/api/ml/estimate", json=payload).get_json()
    response = client.post("/api/ml/context", json=payload)
    assert response.status_code == 200
    body = response.get_json()
    assert normal["model_version"] == "casablanca-catboost-v1"
    assert body["explanation"]["method"] == "catboost_shap_values"
    assert body["comparables"]


def test_comparable_failure_cannot_block_base_prediction(client, payload, monkeypatch):
    import backend.inference.casablanca as casablanca

    monkeypatch.setattr(casablanca, "_comparables", lambda _payload: (_ for _ in ()).throw(FileNotFoundError()))
    prediction = client.post("/api/ml/estimate", json=payload)
    context = client.post("/api/ml/context", json=payload)
    assert prediction.status_code == 200
    assert prediction.get_json()["estimated_price_mad"] > 0
    assert context.status_code == 200
    assert context.get_json()["unavailable"] == ["comparables"]
    assert context.get_json()["explanation"]["method"] == "catboost_shap_values"


@pytest.mark.parametrize(
    "changes",
    [
        {"city": "Rabat"},
        {"property_type": "terrain"},
        {"neighborhood": "Quartier inconnu"},
    ],
)
def test_unsupported_scope_is_rejected(client, payload, changes):
    response = client.post("/api/ml/estimate", json={**payload, **changes})
    assert response.status_code == 400
    assert response.get_json()["code"] == "unsupported_request"


def test_legacy_prediction_routes_fail_closed(client, payload):
    assert client.post("/api/estimate", json=payload).status_code == 410
    assert client.post("/estimate", json=payload).status_code == 410
