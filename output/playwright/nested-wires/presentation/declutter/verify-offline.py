"""Run unchanged M6 checks, preserving historical artifacts and republishing fresh ops."""
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
NESTED = ROOT / 'output/playwright/nested-wires'
def run(command, name):
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    (OUT / (name + '.txt')).write_text('$ ' + ' '.join(command) + '\n' + result.stdout + result.stderr + f'\nexit {result.returncode}\n')
    print(f'{name}: exit {result.returncode}', flush=True)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
def baseline(path):
    return subprocess.check_output(['git', 'show', 'b20053d:' + str(path.relative_to(ROOT))], cwd=ROOT)
def meter(runner, generated, published, name):
    saved = generated.read_bytes()
    try:
        run(['node', '--import', 'tsx', str(runner.relative_to(ROOT))], name + '-ops-output')
        fresh = generated.read_bytes()
        (OUT / (name + '-operations.json')).write_bytes(fresh)
        assert json.loads(fresh) == json.loads(baseline(published)), name + ' M6 ops drift'
        print(f'PASS {name}: every ops field equals M6 exactly', flush=True)
    finally:
        generated.write_bytes(saved)
run(['node', '--import', 'tsx', str((OUT / 'verify-identity.mjs').relative_to(ROOT))], 'identity')
run(['node', '--import', 'tsx', 'output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs'], 'templates-invariants')
for entry in json.loads((NESTED / 'templates-scene/regressions.json').read_text()):
    path = entry['runner']
    if path.endswith('count-operations.mjs'):
        continue
    command = ['python3', path] if path.endswith('.py') else ['node', '--import', 'tsx', path]
    run(command, Path(path).stem)
meter(NESTED / 'templates-scene/count-operations.mjs', NESTED / 'templates-scene/operations.json', NESTED / 'templates-scene/operations.json', 'templates')
meter(NESTED / 'count-operations.mjs', NESTED / 'calculations.json', NESTED / 'templates-scene/nested-operations.json', 'nested')
run(['pnpm', 'tokens:check'], 'tokens-check')
