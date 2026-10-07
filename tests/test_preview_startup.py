"""Branch-scoped startup trigger, stdout record and unchanged public policy."""
import importlib
import importlib.util
import json
import platform
import sys
from pathlib import Path
from unittest.mock import Mock

import pytest
from backend.app import app
from backend.inference import preview_validation, registry

ENTRYPOINT = Path(__file__).resolve().parents[1] / 'api/index.py'


def startup(monkeypatch):
    name = '_mdl_preview_startup_test'
    spec = importlib.util.spec_from_file_location(name, ENTRYPOINT)
    module = importlib.util.module_from_spec(spec)
    monkeypatch.setitem(sys.modules, name, module)
    spec.loader.exec_module(module)
    assert importlib.import_module(name) is module
    assert importlib.import_module(name) is module
    return module


@pytest.mark.parametrize('environment,branch,legacy_flag,expected_calls', [
    ('production', 'test', '1', 0),
    ('production', 'main', '1', 0),
    ('preview', 'main', '1', 0),
    ('preview', '', '1', 0),
    ('preview', 'test', None, 1),
    ('preview', 'test', '0', 1),
])
def test_startup_guard_and_flushed_stdout(monkeypatch, capsys, environment, branch, legacy_flag, expected_calls):
    monkeypatch.setenv('VERCEL_ENV', environment)
    monkeypatch.setenv('VERCEL_GIT_COMMIT_REF', branch)
    if legacy_flag is None:
        monkeypatch.delenv('MDL_PREVIEW_RUNTIME_CHECK', raising=False)
    else:
        monkeypatch.setenv('MDL_PREVIEW_RUNTIME_CHECK', legacy_flag)
    result = {'status': 'PASS', 'goldens': ['Guéliz'], 'detail': Path('runtime')}
    validator = Mock(return_value=result)
    monkeypatch.setattr(preview_validation, 'validate_preview_runtime', validator)
    routes_before = [(rule.rule, rule.endpoint) for rule in app.url_map.iter_rules()]
    flags_before = {key: entry['public_enabled'] for key, entry in registry.MODEL_REGISTRY.items()}
    stdout = sys.stdout
    flush = Mock(wraps=stdout.flush)
    monkeypatch.setattr(stdout, 'flush', flush)
    module = startup(monkeypatch)
    assert validator.call_count == expected_calls
    # Reading pytest's capture buffer itself flushes stdout; inspect first.
    if expected_calls:
        flush.assert_called_once()
    else:
        flush.assert_not_called()
    output = capsys.readouterr().out
    if expected_calls:
        assert output == 'MDL_PREVIEW_RUNTIME_CHECK ' + json.dumps(result, ensure_ascii=False, default=str) + '\n'
    else:
        assert output == ''
    assert module.application is app
    assert routes_before == [(rule.rule, rule.endpoint) for rule in app.url_map.iter_rules()]
    assert flags_before == {key: entry['public_enabled'] for key, entry in registry.MODEL_REGISTRY.items()}
    assert registry.MODEL_REGISTRY['marrakech']['public_enabled'] is False
    with pytest.raises(registry.ModelRegistryError):
        registry.predict_for_city({'city': 'Marrakech'})


def test_startup_failure_propagates_without_pass_record(monkeypatch, capsys):
    monkeypatch.setenv('VERCEL_ENV', 'preview')
    monkeypatch.setenv('VERCEL_GIT_COMMIT_REF', 'test')
    validator = Mock(side_effect=RuntimeError('golden parity failure'))
    monkeypatch.setattr(preview_validation, 'validate_preview_runtime', validator)
    with pytest.raises(RuntimeError, match='golden parity failure'):
        startup(monkeypatch)
    validator.assert_called_once_with()
    assert 'MDL_PREVIEW_RUNTIME_CHECK' not in capsys.readouterr().out
    assert registry.MODEL_REGISTRY['marrakech']['public_enabled'] is False


def test_existing_preview_runtime_harness_results():
    result = preview_validation.validate_preview_runtime()
    assert result['status'] == 'PASS'
    assert [case['mad'] for case in result['goldens']] == pytest.approx(
        [1468447.422627404, 4700250.321581060, 1472533.476353344], rel=0, abs=1e-6)
    assert result['casablanca_mad'] == 1217911
    assert result['warnings'] == 0
    assert result['python'].startswith('3.12.')
    assert result['platform'] == platform.system()
    assert result['sklearn'] == '1.9.0'
    assert result['xgboost_cpu'] == '3.4.1'
    assert result['repeated_requests'] == 3
    assert result['concurrency_workers'] == 2
    for key in ['warm_mean_seconds', 'concurrency_seconds', 'total_seconds']:
        assert result[key] > 0
    assert 'peak_resident_bytes' in result
    if platform.system() == 'Linux':
        assert result['peak_resident_bytes'] > 0
    assert result['marrakech_sha256'] == '623de883b958bb3fca1bfd545fa0f1d41d084179a45f901940f8901170e8dcf4'
    assert registry.MODEL_REGISTRY['marrakech']['public_enabled'] is False
