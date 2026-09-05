"""Tests for the production Vercel Python API entrypoint and ML inference."""
import math
import pytest
from pathlib import Path
from api.index import app

ROOT = Path(__file__).resolve().parents[1]

@pytest.fixture
def client():
    return app.test_client()

def test_model_file_loading():
    """Verify that model artifacts and reference files exist and are readable."""
    assert (ROOT / 'models/maisondelux_price_model_v1.joblib').is_file()
    assert (ROOT / 'models/maisondelux_price_model_v1_metadata.json').is_file()
    assert (ROOT / 'models/locations_v1.json').is_file()
    assert (ROOT / 'models/neighborhoods_v1.json').is_file()

def test_health_endpoint(client):
    """Verify health check on root and /api."""
    res1 = client.get('/')
    assert res1.status_code == 200
    assert res1.get_json()['status'] == 'ok'
    assert res1.get_json()['model_version'] == 'v1'

    res2 = client.get('/api')
    assert res2.status_code == 200
    assert res2.get_json()['status'] == 'ok'

def test_valid_apartment_estimate(client):
    """Verify valid apartment estimation returns proper structure."""
    payload = {
        'city': 'Casablanca',
        'region': 'Casablanca-Settat',
        'neighborhood': 'MaÂrif',
        'property_type': 'appartement',
        'surface_m2': 100,
        'bedrooms': 2,
        'bathrooms': 1,
        'parking': 'unknown',
        'balcony': 'unknown',
        'sea_view': 'unknown',
        'furnished_status': 'unknown'
    }
    res = client.post('/api/estimate', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert 'estimated_price_mad' in data
    assert math.isfinite(data[
        'estimated_price_mad']) and data[
        'estimated_price_mad'] > 0
    assert data['currency'] == 'MAD'
    assert data['model_version'] == 'v1'

def test_invalid_request(client):
    """Verify invalid payloads return 400 with descriptive error."""
    res = client.post('/api/estimate', json={'surface_m2': -10})
    assert res.status_code == 400
    assert 'error' in res.get_json()

    res = client.post('/api/estimate', json={'surface_m2': 'cent'})
    assert res.status_code == 400

    res = client.post('/api/estimate', data='not json', content_type='application/json')
    assert res.status_code == 400

def test_same_origin_api_request(client):
    """Verify supporting endpoints used by same-origin frontend client."""
    villes_res = client.get('/api/villes')
    assert villes_res.status_code == 200
    assert 'villes' in villes_res.get_json()
    assert 'Casablanca' in villes_res.get_json()['villes']

    metrics_res = client.get('/api/metrics')
    assert metrics_res.status_code == 200
    assert metrics_res.get_json()['model_name'] == 'XGBoost'

def test_known_sanity_prediction(client):
    """Verify known sanity prediction for Casablanca / Maârif 90m2 apartment."""
    payload = {
        'city': 'Casablanca',
        'region': 'Casablanca-Settat',
        'neighborhood': 'Maârif',
        'property_type': 'appartement',
        'surface_m2': 90,
        'bedrooms': 2,
        'bathrooms': 1,
        'parking': 'unknown',
        'balcony': 'unknown',
        'sea_view': 'unknown',
        'furnished_status': 'unknown'
    }
    res = client.post('/api/estimate', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data['currency'] == 'MAD'
    assert data['model_version'] == 'v1'
    # Expected: approx 1,288,988 MAD
    assert abs(data['estimated_price_mad'] - 1288988) <= 1000
