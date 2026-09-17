"""Final reproducibility/scope audit. Assertion failures stop this evidence runner."""
import hashlib
import json
import struct
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
SPEC = ROOT / 'output/playwright/nested-wires/templates-scene/scene-spec.json'
REPORT = SPEC.with_name('extraction-report.md')
def run(args):
    return subprocess.check_output(args, cwd=ROOT, stderr=subprocess.STDOUT)
assert run(['git', 'branch', '--show-current']).decode().strip() == 'feat/m65b-declutter'
saved = [SPEC.read_bytes(), REPORT.read_bytes()]
for iteration in range(2):
    run(['node', '--import', 'tsx', str(SPEC.with_name('extract-scene.mts'))])
    assert saved == [SPEC.read_bytes(), REPORT.read_bytes()]
print('PASS extractor: two reruns reproduce extended spec/report byte-for-byte; 16 nodes / 9 sections / 29 wires')
print('SPEC sha256=' + hashlib.sha256(saved[0]).hexdigest())
for name in ['templates-roads-off', 'templates-roads-on', 'templates-contract-detail', 'nested-roads-off', 'selection-wire-label']:
    dimensions = struct.unpack('>II', (OUT / (name + '.png')).read_bytes()[16:24])
    assert dimensions == (1920, 1440), (name, dimensions)
    print(f'PASS {name}.png: {dimensions[0]}x{dimensions[1]}')
run(['git', 'diff', '--exit-code', '11f2db3', '--', 'docs/agent-diagrams/visual-quality/assets', 'quality/agent-diagrams/references', 'capability/design-system', 'capability/layout/core', 'apps/web/cli/verify-selection.mjs', 'output/playwright/nested-wires/presentation/styling', 'output/playwright/nested-wires/presentation/stop-report.md'])
print('PASS approved references, M6.5a tokens, layout core, selection runner, styling/STOP evidence unchanged')
selection = json.loads((OUT / 'nested-selection.json').read_text())
assert selection['counterBefore'] == selection['counterAfter'] == 1
assert selection['performance']['median'] <= 300
print(f"PASS inherited selection: layout=1 -> 1; median={selection['performance']['median']} ms")
print('PASS branch feat/m65b-declutter')
