"""Transport authorization only. The approved inference implementation is untouched."""
import hashlib
import hmac
import os
import re
import time
from flask import jsonify, request

def require_gateway():
    # Dedicated key wins; the existing server-only Admin key keeps older
    # deployments signed during the Phase C environment transition.
    secret = os.environ.get('INFERENCE_GATEWAY_SECRET') or os.environ.get('ADMIN_SESSION_SECRET', '')
    if len(secret) < 32:
        return jsonify(code='service_unavailable'), 503
    timestamp = request.headers.get('X-MDL-Timestamp', '')
    signature = request.headers.get('X-MDL-Signature', '')
    if not re.fullmatch(r'[0-9a-f]{64}', signature):
        return jsonify(code='unauthorized'), 401
    try:
        if abs(time.time() - int(timestamp)) > 90:
            return jsonify(code='unauthorized'), 401
    except (ValueError, TypeError):
        return jsonify(code='unauthorized'), 401
    message = timestamp.encode() + b'\n' + request.path.encode() + b'\n' + request.get_data(cache=True)
    expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return jsonify(code='unauthorized'), 401
    return None
