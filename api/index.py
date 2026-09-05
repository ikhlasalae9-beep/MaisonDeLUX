"""Vercel Serverless Function entrypoint for MaisonDeLUX ML valuation."""
import sys
from pathlib import Path

# Ensure repository root is in sys.path for module resolution
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Pre-load custom unpickler dependency for joblib model
import ml.src.inference  # noqa: F401

from backend.app import app

# Expose WSGI application for Vercel
application = app

if __name__ == '__main__':
    app.run(port=5000, debug=False)
