"""Sign internal inference requests; never disable the production gateway guard."""
import hashlib
import hmac
import json
import time
import pytest
from api.index import app


@pytest.fixture
def signed_client(monkeypatch):
    secret = 'test-only-inference-gateway-secret-32-chars'
    monkeypatch.setenv('INFERENCE_GATEWAY_SECRET', secret)
    raw = app.test_client()

    class Client:
        def open(self, path, method='GET', **kwargs):
            body = json.dumps(kwargs.pop('json')).encode() if 'json' in kwargs else kwargs.pop('data', b'')
            if isinstance(body, str):
                body = body.encode()
            timestamp = str(int(time.time()))
            message = timestamp.encode() + b'\n' + path.split('?')[0].encode() + b'\n' + body
            headers = dict(kwargs.pop('headers', {}))
            headers.update({'X-MDL-Timestamp': timestamp, 'X-MDL-Signature': hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()})
            content_type = kwargs.pop('content_type', 'application/json')
            return raw.open(path, method=method, data=body, headers=headers, content_type=content_type, **kwargs)

        def get(self, path, **kwargs):
            return self.open(path, **kwargs)

        def post(self, path, **kwargs):
            return self.open(path, method='POST', **kwargs)

    return Client()
