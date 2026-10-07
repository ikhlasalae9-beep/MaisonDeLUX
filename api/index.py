"""Vercel Serverless Function entrypoint for MaisonDeLUX ML valuation."""
import sys
from pathlib import Path

# Ensure repository root is in sys.path for module resolution
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    import ml.src.inference  # noqa: F401
except ImportError:
    pass

from backend.app import app

# Startup checks are Preview-only and never expose prepared inference over HTTP.
import json
import os
if os.environ.get('VERCEL_ENV') == 'preview' and os.environ.get('VERCEL_GIT_COMMIT_REF') == 'test':
    from backend.inference.preview_validation import validate_preview_runtime
    result = validate_preview_runtime()
    print('MDL_PREVIEW_RUNTIME_CHECK ' + json.dumps(result, ensure_ascii=False, default=str), flush=True)

# Expose WSGI application for Vercel
application = app

if __name__ == '__main__':
    app.run(port=5000, debug=False)
