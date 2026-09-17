"""Replay unchanged acceptance suites and exact amended operation gates, serially."""
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
NESTED = 'output/playwright/nested-wires/'
def run(path, name, config=None):
    command = ['python3', path] if path.endswith('.py') else ['node', '--import', 'tsx', path]
    if config is not None:
        command.append(json.dumps(config))
    artifact = ROOT / (NESTED + 'static-proof.txt')
    saved = artifact.read_bytes() if path.endswith('verify-static.py') else None
    try:
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    finally:
        if saved is not None:
            artifact.write_bytes(saved)
    (OUT / (name + '.txt')).write_text('$ ' + ' '.join(command) + '\n' + result.stdout + result.stderr + f'\nexit {result.returncode}\n')
    print(f'{name}: exit {result.returncode}', flush=True)
    assert result.returncode == 0, result.stdout + result.stderr
run(str((OUT / 'verify-identity.mjs').relative_to(ROOT)), 'identity')
for entry in json.loads((ROOT / (NESTED + 'templates-scene/regressions.json')).read_text()):
    if not entry['runner'].endswith(('count-operations.mjs', 'verify-m45-evidence.py')):
        run(entry['runner'], Path(entry['runner']).stem)
run(NESTED + 'templates-scene/verify-templates-scene.mjs', 'templates-invariants')
run(NESTED + 'scale-scene/verify-scale-scene.mjs', 'scale-invariants')
for name, config, baseline in [
    ('nested', {'nested': True}, [19768, 992, 0]),
    ('templates', {'specFile': NESTED + 'templates-scene/scene-spec.json'}, [28443, 1626, 0]),
    ('scale', {'specFile': NESTED + 'scale-scene/scale-scene-spec.json'}, [43876, 2088, 0]),
]:
    config.update(directory=str(OUT.relative_to(ROOT)), outputFile=name+'-operations.json')
    run(NESTED + 'templates-scene/count-operations.mjs', name+'-ops-amended', config)
    data = json.loads((OUT / (name+'-operations.json')).read_text())
    actual = [sum(data['stages'][stage]['total'] for stage in ['wire-registry', 'lane-allocation', 'network', 'lane-projection']), sum(value['total'] for stage, value in data['stages'].items() if stage.startswith('wire:')), data['perWireRoadPairDiscovery']]
    assert actual == baseline, (name, actual, baseline)
    print(f'PASS {name}: exact compile/routing/discovery {actual}', flush=True)
