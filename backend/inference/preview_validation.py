"""Opt-in Preview startup checks; no endpoint and no public prepared switch."""
import hashlib
import warnings
import platform
from concurrent.futures import ThreadPoolExecutor
from importlib.metadata import version
from time import perf_counter
from . import service, marrakech, registry


def validate_preview_runtime():
    started = perf_counter()
    results = []
    payloads = []
    with warnings.catch_warnings(record=True) as captured:
        warnings.simplefilter('always')
        for case in marrakech.load_metadata()['golden_prediction_cases'][:3]:
            payload = {'city':'Marrakech', **{source:case['input'][target] for source,target in service.MARRAKECH_FIELDS.items()}}
            payloads.append(payload)
            before = perf_counter()
            result = service.estimate(payload,allow_prepared=True)
            if abs(result['raw_price_mad']-case['expected_mad']) > 1e-6:
                raise RuntimeError('Preview Marrakech golden parity failure')
            results.append({'case':case['id'],'mad':result['raw_price_mad'],'seconds':perf_counter()-before})
        before = perf_counter()
        repeated = [service.estimate(payloads[0],allow_prepared=True)['raw_price_mad'] for _ in range(3)]
        if any(abs(value-results[0]['mad']) > 1e-6 for value in repeated):
            raise RuntimeError('Preview repeated inference mismatch')
        warm_seconds = (perf_counter()-before)/3
        before = perf_counter()
        with ThreadPoolExecutor(max_workers=2) as pool:
            concurrent = list(pool.map(lambda payload: service.estimate(payload,allow_prepared=True)['raw_price_mad'], payloads))
        if any(abs(value-result['mad']) > 1e-6 for value,result in zip(concurrent,results)):
            raise RuntimeError('Preview concurrent inference mismatch')
        concurrency_seconds = perf_counter()-before
        c = dict(city='Casablanca',property_type='appartement',neighborhood='Maârif',area=100,rooms=3,bedrooms=2,bathrooms=2,floor=4,current_state='Bon état',age='10-20 ans')
        if service.estimate(c)['estimated_price_mad'] != 1217911:
            raise RuntimeError('Preview Casablanca prediction regression')
        context = service.context(c)
        if context.get('explanation',{}).get('method') != 'catboost_shap_values' or not context.get('comparables'):
            raise RuntimeError('Preview Casablanca context regression')
        try:
            registry.predict_for_city({'city':'Marrakech'})
        except registry.ModelRegistryError:
            pass
        else:
            raise RuntimeError('Preview public Marrakech capability enabled')
    if captured:
        raise RuntimeError('Preview model compatibility warnings')
    try:
        import resource
        peak_memory = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024
    except ImportError:
        peak_memory = None
    return {'status':'PASS','goldens':results,'casablanca_mad':1217911,'warnings':0,
            'python':platform.python_version(),'platform':platform.system(),
            'sklearn':version('scikit-learn'),'xgboost_cpu':version('xgboost-cpu'),
            'repeated_requests':3,'warm_mean_seconds':warm_seconds,
            'concurrency_workers':2,'concurrency_seconds':concurrency_seconds,
            'total_seconds':perf_counter()-started,'peak_resident_bytes':peak_memory,
            'marrakech_sha256':hashlib.sha256(marrakech.MODEL_PATH.read_bytes()).hexdigest()}
