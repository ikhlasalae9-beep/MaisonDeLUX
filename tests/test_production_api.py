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

def test_legacy_apartment_estimate_is_closed(client):
    """Verify archived national estimation cannot bypass city policy."""
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
    assert res.status_code == 410
    assert res.get_json()['code'] == 'legacy_estimator_disabled'

def test_invalid_request(client):
    """Verify invalid payloads return 400 with descriptive error."""
    res = client.post('/api/ml/estimate', json={'surface_m2': -10})
    assert res.status_code == 400
    assert 'error' in res.get_json()

    res = client.post('/api/ml/estimate', json={'surface_m2': 'cent'})
    assert res.status_code == 400

    res = client.post('/api/ml/estimate', data='not json', content_type='application/json')
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
    """Verify Casablanca requests reach the activated CatBoost adapter."""
    payload = {
        'city': 'Casablanca',
        'neighborhood': 'Maârif',
        'property_type': 'appartement',
        'area': 90,
        'rooms': 3,
        'bedrooms': 2,
        'bathrooms': 1,
        'floor': 2,
        'current_state': 'Bon état',
        'age': '10-20 ans',
    }
    res = client.post('/api/ml/estimate', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data['currency'] == 'MAD'
    assert data['model_version'] == 'casablanca-catboost-v1'
    assert data['estimated_price_mad'] > 0

def test_lightweight_joblib_parity():
    """Verify that LightweightModel exactly reproduces the original joblib pipeline."""
    import joblib
    import pandas as pd
    import ml.src.inference  # noqa: F401
    from backend.app import model, validate

    orig_model = joblib.load(ROOT / 'models/maisondelux_price_model_v1.joblib')

    # 1. Sanity case parity
    sanity_dict = {
        'city': 'Casablanca', 'region': 'Casablanca-Settat', 'neighborhood': 'Maârif',
        'property_type': 'appartement', 'surface_m2': 90, 'bedrooms': 2, 'bathrooms': 1,
        'parking': 'unknown', 'balcony': 'unknown', 'sea_view': 'unknown', 'furnished_status': 'unknown'
    }
    pred_orig_sanity = float(orig_model.predict(validate(sanity_dict))[0])
    pred_light_sanity = float(model.predict(sanity_dict)[0])
    assert abs(pred_orig_sanity - pred_light_sanity) < 0.01

    # 2. 100+ dataset rows parity
    csv_path = ROOT / 'data/processed/maisondelux_model_ready_v1.csv'
    if csv_path.is_file():
        df_sample = pd.read_csv(csv_path).sample(100, random_state=42)
        for _, row in df_sample.iterrows():
            row_dict = {
                'city': str(row['city']),
                'region': str(row['region']),
                'neighborhood': str(row['neighborhood_clean']) if pd.notna(row['neighborhood_clean']) else None,
                'property_type': str(row['property_type_repaired']),
                'surface_m2': float(row['surface_m2']),
                'bedrooms': float(row['bedrooms']) if pd.notna(row['bedrooms']) else None,
                'bathrooms': float(row['bathrooms']) if pd.notna(row['bathrooms']) else None,
                'parking': str(row['parking']) if pd.notna(row['parking']) else 'unknown',
                'balcony': str(row['balcony']) if pd.notna(row['balcony']) else 'unknown',
                'sea_view': str(row['sea_view']) if pd.notna(row['sea_view']) else 'unknown',
                'furnished_status': str(row['furnished_status']) if pd.notna(row['furnished_status']) else 'unknown',
            }
            pred_orig = float(orig_model.predict(validate(row_dict))[0])
            pred_light = float(model.predict(row_dict)[0])
            assert abs(pred_orig - pred_light) < 1.0


def test_requirements_include_verified_casablanca_runtime():
    """Verify the serverless runtime declares the activated adapter dependencies."""
    reqs_text = (ROOT / 'requirements.txt').read_text(encoding='utf-8')
    lines = [l.strip() for l in reqs_text.splitlines() if l.strip() and not l.startswith('#')]
    assert 'flask>=3.1,<4' in lines
    assert 'werkzeug>=3.1,<4' in lines
    assert 'catboost==1.2.10' in lines
    assert 'joblib>=1.5,<2' in lines
    assert 'numpy>=2.0,<3' in lines
    for forbidden in ['xgboost', 'scipy', 'scikit-learn', 'pandas']:
        assert not any(forbidden in l for l in lines)
