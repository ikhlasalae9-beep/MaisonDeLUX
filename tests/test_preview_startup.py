"""Production startup never runs the retained internal validation harness."""
import importlib
import importlib.util
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


@pytest.mark.parametrize('environment,branch,legacy_flag', [
    ('production', 'test', '1'),
    ('production', 'main', '1'),
    ('preview', 'main', '1'),
    ('preview', '', '1'),
    ('preview', 'test', '1'),
    ('preview', 'test', None),
    ('preview', 'test', '0'),
])
def test_startup_never_runs_internal_validator(monkeypatch, capsys, environment, branch, legacy_flag):
    monkeypatch.setenv('VERCEL_ENV', environment)
    monkeypatch.setenv('VERCEL_GIT_COMMIT_REF', branch)
    if legacy_flag is None:
        monkeypatch.delenv('MDL_PREVIEW_RUNTIME_CHECK', raising=False)
    else:
        monkeypatch.setenv('MDL_PREVIEW_RUNTIME_CHECK', legacy_flag)
    validator = Mock(side_effect=RuntimeError('Startup must not validate models'))
    monkeypatch.setattr(preview_validation, 'validate_preview_runtime', validator)
    routes_before = [(rule.rule, rule.endpoint) for rule in app.url_map.iter_rules()]
    flags_before = {key: entry['public_enabled'] for key, entry in registry.MODEL_REGISTRY.items()}
    module = startup(monkeypatch)
    validator.assert_not_called()
    assert capsys.readouterr().out == ''
    assert module.application is app
    assert routes_before == [(rule.rule, rule.endpoint) for rule in app.url_map.iter_rules()]
    assert flags_before == {key: entry['public_enabled'] for key, entry in registry.MODEL_REGISTRY.items()}
    assert registry.MODEL_REGISTRY['marrakech']['public_enabled'] is True


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
    assert registry.MODEL_REGISTRY['marrakech']['public_enabled'] is True
