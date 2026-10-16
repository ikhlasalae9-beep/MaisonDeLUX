"""Rabat application contract and public transport/validation gates."""
import json
from pathlib import Path

import pytest

from backend.inference import rabat, registry, service, preview_validation

CASES = json.loads((Path(__file__).resolve().parents[1] / 'models/rabat/v1/metadata.json').read_text(encoding='utf8'))['golden_prediction_cases']


def application(case):
    return {'city': 'Rabat', **{source: case['input'][target] for source, target in service.RABAT_FIELDS.items()}}


@pytest.mark.parametrize('case', CASES, ids=lambda c: c['id'])
def test_internal_service_goldens_and_normalized_inputs(case):
    payload = application(case)
    result = service.estimate(payload, allow_prepared=True)
    assert result['city'] == 'Rabat'
    assert result['model_id'] == rabat.MODEL_ID
    assert result['model_version'] == rabat.MODEL_VERSION
    assert result['raw_price_mad'] == pytest.approx(case['expected_mad'], abs=1e-6, rel=0)
    _, prepared, normalized = service.normalized_input(payload, allow_prepared=True)
    assert len(prepared) == 9
    assert normalized['age'] == payload['age']
    assert normalized['neighborhood'] == case['expected_location']
    assert service.context(payload, allow_prepared=True) == {'unavailable': ['explanation', 'comparables', 'market_context']}
    assert registry.MODEL_REGISTRY['rabat']['public_enabled'] is True


@pytest.mark.parametrize('field,value', [('age', '5-10 ans'), ('current_state', 'Bon état'),
    ('age', 15), ('area', 1), ('rooms', True), ('floor', 1), ('allow_prepared', True)])
def test_bad_application_inputs_never_load_model(field, value, monkeypatch):
    monkeypatch.setattr(rabat, 'load_model', lambda: pytest.fail('Invalid application input reached model'))
    with pytest.raises(rabat.RabatInferenceError):
        service.estimate({**application(CASES[0]), field: value}, allow_prepared=True)


@pytest.mark.parametrize('field,value', [('city', 'Casablanca'), ('model_id', 'casablanca-catboost-alae'), ('model_version', 'marrakech-stacking-v1'), ('city', None), ('model_id', None)])
def test_shared_service_rejects_cross_city_response(field, value, monkeypatch):
    response = {'city': 'Rabat', 'model_id': rabat.MODEL_ID, 'model_version': rabat.MODEL_VERSION, 'estimated_price_mad': 1}
    response[field] = value
    monkeypatch.setitem(registry.MODEL_REGISTRY['rabat'], 'predict', lambda _: response)
    with pytest.raises(RuntimeError, match='identity mismatch'):
        service.estimate(application(CASES[0]), allow_prepared=True)


def test_metadata_health_are_truthful_but_signed_estimate_cannot_bypass(signed_client):
    for path in ['/api/ml/metadata?city=Rabat', '/api/ml/health?city=Rabat']:
        response = signed_client.get(path)
        assert response.status_code == 200
        body = response.get_json()
        assert body['status'] == 'available'
        assert body['public_enabled'] is True
        assert body['operationally_deployed'] is False
        assert body['supported']['ages'] == []
        assert body['age_band_to_years']['Inconnu'] == 15
    for extra in [{}, {'allow_prepared': True}]:
        response = signed_client.post('/api/ml/estimate', json={**application(CASES[0]), **extra})
        assert response.status_code == (400 if extra else 200)
        if extra:
            assert response.get_json()['code'] == 'unsupported_request'
        else:
            assert response.get_json()['estimated_price_mad'] == CASES[0]['expected_estimated_price_mad']


@pytest.mark.parametrize('installed,expected', [
    ({'xgboost-cpu': '3.4.1'}, 'xgboost-cpu'),
    ({'xgboost': '3.4.1'}, 'xgboost'),
    ({'xgboost': '3.4.1', 'xgboost-cpu': '3.4.1'}, 'xgboost-cpu'),
])
def test_harness_reports_supported_distribution_without_requiring_cpu(installed, expected, monkeypatch):
    def version(name):
        if name not in installed:
            raise preview_validation.PackageNotFoundError(name)
        return installed[name]
    monkeypatch.setattr(preview_validation, 'version', version)
    assert preview_validation.xgboost_runtime() == {'distribution': expected, 'version': '3.4.1'}


@pytest.mark.parametrize('installed', [{}, {'xgboost': 'wrong'}, {'xgboost-cpu': '3.4.1', 'xgboost': 'wrong'}])
def test_harness_still_rejects_missing_or_conflicting_versions(installed, monkeypatch):
    def version(name):
        if name not in installed:
            raise preview_validation.PackageNotFoundError(name)
        return installed[name]
    monkeypatch.setattr(preview_validation, 'version', version)
    with pytest.raises(RuntimeError, match='consistent'):
        preview_validation.xgboost_runtime()
