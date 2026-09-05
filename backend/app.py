"""MaisonDeLUX V1 inference. Run from the repository: python -m backend.app."""
import json
import math
from pathlib import Path
import numpy as np
import xgboost as xgb
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

try:
    import pandas as pd
except ImportError:
    pd = None

ROOT = Path(__file__).resolve().parents[1]
metadata = json.loads((ROOT / 'models/maisondelux_price_model_v1_metadata.json').read_text(encoding='utf-8'))
locations = json.loads((ROOT / 'models/locations_v1.json').read_text(encoding='utf-8'))
FEATURES = metadata['features']


class LightweightModel:
    """Lightweight inference model avoiding scikit-learn/scipy/pandas in production."""
    def __init__(self, booster_path, prep_config_path):
        self.booster = xgb.Booster()
        self.booster.load_model(str(booster_path))
        with open(prep_config_path, 'r', encoding='utf-8') as f:
            self.cfg = json.load(f)
        self.frequent_cities_set = set(self.cfg['frequent_cities'])
        self.frequent_neighborhoods_set = set(self.cfg['frequent_neighborhoods'])

    @property
    def regressor_(self):
        if not hasattr(self, '_cached_joblib_regressor'):
            import joblib
            orig = joblib.load(ROOT / 'models/maisondelux_price_model_v1.joblib')
            self._cached_joblib_regressor = orig.regressor_
        return self._cached_joblib_regressor

    def transform_row(self, row_dict):
        vec = np.zeros(237, dtype=np.float32)
        for i, col in enumerate(self.cfg['num_features']):
            val = row_dict.get(col)
            if val is None or val == '' or (isinstance(val, (int, float)) and not math.isfinite(val)):
                val = self.cfg['num_imputer_medians'][i]
            else:
                val = float(val)
            vec[i] = (val - self.cfg['num_scaler_mean'][i]) / self.cfg['num_scaler_scale'][i]

        region = str(row_dict.get('region', '')).strip()
        if region in self.cfg['cat_offsets']['region']:
            vec[self.cfg['cat_offsets']['region'][region]] = 1.0

        city = str(row_dict.get('city', '')).strip()
        city_token = city if city in self.frequent_cities_set else self.cfg['rare_label']
        if city_token in self.cfg['cat_offsets']['city']:
            vec[self.cfg['cat_offsets']['city'][city_token]] = 1.0

        neigh = row_dict.get('neighborhood')
        if neigh is None or neigh == '' or neigh == self.cfg['missing_label'] or (isinstance(neigh, float) and math.isnan(neigh)):
            neigh_token = self.cfg['missing_label']
        else:
            s_neigh = str(neigh).strip()
            neigh_token = s_neigh if s_neigh in self.frequent_neighborhoods_set else self.cfg['rare_label']
        if neigh_token in self.cfg['cat_offsets']['neighborhood']:
            vec[self.cfg['cat_offsets']['neighborhood'][neigh_token]] = 1.0

        pt = str(row_dict.get('property_type', '')).strip()
        if pt in self.cfg['cat_offsets']['property_type']:
            vec[self.cfg['cat_offsets']['property_type'][pt]] = 1.0

        for feat in ['parking', 'balcony', 'sea_view', 'furnished_status']:
            val = row_dict.get(feat)
            val = str(val).strip() if val is not None and val != '' and (not isinstance(val, float) or not math.isnan(val)) else 'unknown'
            if val in self.cfg['cat_offsets'][feat]:
                vec[self.cfg['cat_offsets'][feat][val]] = 1.0

        return vec

    def predict(self, X):
        if isinstance(X, dict):
            vec = self.transform_row(X).reshape(1, -1)
        elif hasattr(X, 'to_dict') and callable(X.to_dict):
            records = X.to_dict(orient='records')
            mat = np.empty((len(records), 237), dtype=np.float32)
            for i, r in enumerate(records):
                mat[i] = self.transform_row(r)
            vec = mat
        elif isinstance(X, (list, tuple)):
            if len(X) > 0 and isinstance(X[0], dict):
                mat = np.empty((len(X), 237), dtype=np.float32)
                for i, r in enumerate(X):
                    mat[i] = self.transform_row(r)
                vec = mat
            else:
                vec = np.asarray(X, dtype=np.float32)
        elif isinstance(X, np.ndarray):
            vec = X
        else:
            vec = self.transform_row(dict(X)).reshape(1, -1)

        dmat = xgb.DMatrix(vec, missing=0.0)
        preds = self.booster.predict(dmat)
        return np.expm1(preds)


model = LightweightModel(
    ROOT / 'models/maisondelux_price_model_v1.json',
    ROOT / 'models/maisondelux_preprocessing_v1.json'
)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024


def validate(data):
    if not isinstance(data, dict):
        raise ValueError('Un objet JSON est requis.')
    if set(data) - set(FEATURES):
        raise ValueError('Le formulaire contient des champs non pris en charge.')
    row = {}
    for key in FEATURES[:3]:
        value = data.get(key)
        if key != 'surface_m2' and (value is None or value == ''):
            row[key] = np.nan
            continue
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f'{key} doit être numérique.')
        if not math.isfinite(value) or (value <= 0 if key == 'surface_m2' else value < 0):
            raise ValueError(f'{key} doit être fini et positif.')
        if key != 'surface_m2' and value != int(value):
            raise ValueError(f'{key} doit être entier.')
        row[key] = value
    for key in FEATURES[3:]:
        value = data.get(key)
        if value is not None and not isinstance(value, str):
            raise ValueError(f'{key} doit être du texte.')
        value = value.strip() if value else ''
        if len(value) > 200:
            raise ValueError(f'{key} est trop long.')
        if key in ('city', 'region', 'property_type') and not value:
            raise ValueError(f'{key} est requis.')
        row[key] = value or ('unknown' if key in FEATURES[7:] else np.nan)
    if pd is not None:
        return pd.DataFrame([row], columns=FEATURES)
    return row


@app.errorhandler(HTTPException)
def http_error(error):
    return jsonify(error=error.description), error.code


@app.post('/api/estimate')
@app.post('/estimate')
def estimate():
    try:
        frame = validate(request.get_json())
    except ValueError as error:
        return jsonify(error=str(error)), 400
    try:
        price = float(model.predict(frame)[0])
        if not math.isfinite(price) or price <= 0:
            raise ValueError('Invalid model output')
    except Exception:
        app.logger.exception('Inference failed')
        return jsonify(error="Le service d'estimation est momentanément indisponible."), 503
    return jsonify(estimated_price_mad=round(price), currency='MAD', model_version='v1')


@app.get('/api/villes')
@app.get('/villes')
def cities():
    return jsonify(villes=sorted(locations))


@app.get('/api/metrics')
@app.get('/metrics')
def metrics():
    return jsonify(**metadata, currency='MAD', model_version='v1')


@app.get('/')
@app.get('/api')
@app.get('/api/')
def health():
    return jsonify(status='ok', model_version='v1')


if __name__ == '__main__':
    app.run(port=5000, debug=False)
