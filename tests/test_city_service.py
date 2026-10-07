"""Application contract, public rejection, and exact city identity boundaries."""
import json
from pathlib import Path
import pytest
from backend.inference import service, registry, marrakech

CASES = json.loads((Path(__file__).resolve().parents[1] / 'models/marrakech/v1/metadata.json').read_text(encoding='utf-8'))['golden_prediction_cases'][:3]


@pytest.mark.parametrize('installed', [
    {'scikit-learn':'1.9.0', 'xgboost-cpu':'3.4.1'},
    {'scikit-learn':'1.9.0', 'xgboost':'3.4.1'},
])
def test_exact_cpu_or_standard_distribution_supported(monkeypatch, installed):
    def version(name):
        if name not in installed:
            raise marrakech.PackageNotFoundError(name)
        return installed[name]
    marrakech.load_model.cache_clear()
    monkeypatch.setattr(marrakech, 'version', version)
    try:
        assert marrakech.load_model() is not None
    finally:
        marrakech.load_model.cache_clear()


@pytest.mark.parametrize('installed', [
    {'scikit-learn':'1.9.0'},
    {'scikit-learn':'1.9.0', 'xgboost-cpu':'3.3.0'},
    {'scikit-learn':'1.9.0', 'xgboost-cpu':'3.4.1', 'xgboost':'3.3.0'},
    {'scikit-learn':'1.8.0', 'xgboost-cpu':'3.4.1'},
])
def test_distribution_guard_still_rejects_missing_conflicting_or_wrong_versions(monkeypatch, installed):
    def version(name):
        if name not in installed:
            raise marrakech.PackageNotFoundError(name)
        return installed[name]
    marrakech.load_model.cache_clear()
    monkeypatch.setattr(marrakech, 'version', version)
    try:
        with pytest.raises(marrakech.MarrakechConfigurationError):
            marrakech.load_model()
    finally:
        marrakech.load_model.cache_clear()

def application_input(case):
    return {'city':'Marrakech', **{source:case['input'][target] for source,target in service.MARRAKECH_FIELDS.items()}}

@pytest.mark.parametrize('case',CASES,ids=lambda c:c['id'])
def test_service_golden_and_normalized_persistence_input(case):
    payload=application_input(case)
    response=service.estimate(payload,allow_prepared=True)
    assert response['raw_price_mad'] == pytest.approx(case['expected_mad'],rel=0,abs=1e-6)
    assert response['city']=='Marrakech'
    assert response['model_id']=='marrakech-stacking-alae'
    _,prepared,normalized=service.normalized_input(payload,allow_prepared=True)
    assert 'Loc_Type' not in prepared and 'Loc_Type' not in normalized
    assert normalized['property_type'] in ['appartement','villa']
    assert service.context(payload,allow_prepared=True)=={'unavailable':['explanation','comparables','market_context']}

@pytest.mark.parametrize('extra',['allow_prepared','Loc_Type','floor'])
def test_public_and_internal_clients_cannot_spoof_control_fields(extra,signed_client):
    payload={**application_input(CASES[0]),extra:True}
    assert signed_client.post('/api/ml/estimate',json=payload).status_code==400
    with pytest.raises(marrakech.MarrakechInferenceError):
        service.estimate(payload,allow_prepared=True)

@pytest.mark.parametrize('field,value',[('city','Casablanca'),('model_id','casablanca-catboost-alae'),('model_version','casablanca-catboost-v1')])
def test_wrong_model_identity_fails_closed(field,value,monkeypatch):
    response=dict(estimated_price_mad=1,city='Marrakech',model_id='marrakech-stacking-alae',model_version='marrakech-stacking-v1')
    response[field]=value
    monkeypatch.setitem(registry.MODEL_REGISTRY['marrakech'],'predict',lambda _:response)
    with pytest.raises(RuntimeError,match='identity mismatch'):
        service.estimate(application_input(CASES[0]),allow_prepared=True)

def test_metadata_distinguishes_prepared_readiness_without_paths(signed_client):
    body=service.model_metadata('Marrakech',check_ready=True)
    assert body['artifact_present'] is True and body['inference_ready'] is True
    assert body['public_enabled'] is False
    assert 'path' not in json.dumps(body).casefold()
    assert signed_client.get('/api/ml/metadata?city=unsupported').status_code==400

def test_invalid_input_never_reaches_model(monkeypatch):
    monkeypatch.setattr(marrakech,'load_model',lambda:pytest.fail('Invalid input reached model'))
    payload=application_input(CASES[0])
    for field in ['area','rooms','bedrooms','bathrooms']:
        invalid=dict(payload);del invalid[field]
        with pytest.raises(marrakech.MarrakechInferenceError):service.estimate(invalid,allow_prepared=True)
