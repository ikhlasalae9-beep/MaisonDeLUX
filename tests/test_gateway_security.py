"""Exercise actual Flask boundaries before any CatBoost invocation."""
import hashlib
import hmac
import time
import pytest
from api.index import app


@pytest.mark.parametrize('path', ['/api/ml/estimate', '/api/ml/context', '/api/ml/health'])
def test_unsigned_or_tampered_transport_cannot_invoke_model(monkeypatch, path):
    import backend.app as service
    def forbidden(*_args, **_kwargs):
        pytest.fail('Unauthorized transport reached the model')
    monkeypatch.setattr(service, 'predict_for_city', forbidden)
    monkeypatch.setattr(service, 'context_for_city', forbidden)
    monkeypatch.setattr(service, 'load_model', forbidden)
    monkeypatch.setenv('INFERENCE_GATEWAY_SECRET', 'test-only-inference-gateway-secret-32-chars')
    client = app.test_client()
    method = 'GET' if path.endswith('health') else 'POST'
    assert client.open(path, method=method).status_code == 401
    assert client.open(path, method=method, headers={'X-MDL-Timestamp': str(int(time.time())), 'X-MDL-Signature': 'forged'}).status_code == 401


def test_expired_signature_and_missing_config_fail_closed(monkeypatch):
    secret = 'test-only-inference-gateway-secret-32-chars'
    monkeypatch.setenv('INFERENCE_GATEWAY_SECRET', secret)
    timestamp = str(int(time.time()) - 120)
    signature = hmac.new(secret.encode(), f'{timestamp}\n/api/ml/estimate\n{{}}'.encode(), hashlib.sha256).hexdigest()
    response = app.test_client().post('/api/ml/estimate', data='{}', headers={'X-MDL-Timestamp': timestamp, 'X-MDL-Signature': signature})
    assert response.status_code == 401
    monkeypatch.delenv('INFERENCE_GATEWAY_SECRET')
    response = app.test_client().post('/api/ml/estimate', json={})
    assert response.status_code == 503
    assert response.get_json() == {'code': 'service_unavailable'}
