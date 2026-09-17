"""Reconcile canonical M4.5 evidence. Assertion failures are fatal; --write refreshes metrics."""
import hashlib
import json
import re
import statistics
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]


def read(name):
    return json.loads((ROOT / name).read_text())


scene, operations, browser, oracle, selection, visual = map(read, [
    'scene.json', 'calculations.json', 'm45-browser.json', 'oracle.json',
    'm4-selection.json', 'm4-visual-budget.json',
])
assert scene['wiring']['ok']
wires = scene['wiring']['value']
assert len(scene['nodes']) == 24 and len(scene['sections']) == 4 and len(wires) == 26
assert [w['id'] for w in wires if w['to'] == 'node-23'] == [f'w{i}' for i in range(19, 25)]
assert [w['id'] for w in wires if w['from'] == 'node-24'] == ['w25', 'w26']
assert [w['wire'] for w in oracle['wires']] == [w['id'] for w in wires]
for wire, row in zip(wires, oracle['wires']):
    length = sum(abs(s['to']['x']-s['from']['x']) + abs(s['to']['y']-s['from']['y']) for s in wire['segments'])
    assert row['length'] == length and 0 < row['oracle'] <= length
assert operations['wireRouting']['total'] <= 1050
assert operations['laneNetwork']['total'] <= 20000
assert operations['laneNetwork']['roadPairDiscoveryChecks'] == 0
assert max(x['operations'] for x in operations['perLeg']) <= 60
assert operations['scalingProbe']['nodes'] == [24, 48]
assert operations['scalingProbe']['ratio'] <= 2.5
assert operations['instrumentedSceneIdentical']
assert len(operations['stageInvocations']) > 26
assert all(n == 1 for n in operations['stageInvocations'].values())
loads = [x['roads:navigation-to-ready'] for x in browser['loads']]
assert len(loads) == 5 and statistics.median(loads) == browser['medianMilliseconds'] <= 300
assert browser['nodes'] == 24 and browser['wires'] == 26 and browser['roadsOff']
assert browser['layoutRecalcCount'] == selection['counterBefore'] == selection['counterAfter'] == 1
assert '26 wires' in selection['messages'][0]
assert all(m.startswith('PASS') for m in selection['messages'])
assert any('hub node-23' in m for m in selection['messages'])
assert any('api node-24' in m for m in selection['messages'])
assert len(selection['performance']['loads']) == 5
assert statistics.median(selection['performance']['loads']) == selection['performance']['median'] <= 300
assert visual['ceiling'] == 6
assert all(n == 0 for n in visual['budgetedCounts'].values())
proof = read('m45-topological-bound.json')
assert proof['sceneSha256'] == hashlib.sha256((ROOT/'scene.json').read_bytes()).hexdigest()
assert proof['lowerBound'] == 17 and proof['independentEndpointLowerBound'] == 14 and proof['linkedRoadOrderLowerBound'] == 3
assert proof['uncertifiedCrossings'] == [] and len(proof['certifiedCrossings']) == len(visual['crossings'])
assert proof['actualCounts'] == visual['counts']
assert all(visual['counts'][key] <= ceiling for key,ceiling in proof['ceilings'].items())
assert proof['J21'] <= 2
assert browser['baselineVerified']
assert (ROOT/'m45-junction-before.png').read_bytes() != (ROOT/'m45-junction-after.png').read_bytes()
for section, total in visual['counts'].items():
    records = [r for r in visual['crossings'] if r['section'] == section]
    assert len(records) == total
    assert sum(r['excluded'] for r in records) == visual['junctionCrossingCounts'][section]
    assert sum(not r['excluded'] for r in records) == visual['budgetedCounts'][section]
for record in visual['crossings']:
    assert record['reason']
    if record['excluded']:
        assert record['singlePoint'] and record['angleDegrees'] >= 60 and record['registeredJunctions']
for name in ['structural-identity','lanes','invariants','geometry','operations','topological-bound']:
    output = (ROOT / f'm45-{name}-output.txt').read_text()
    assert 'PASS ' in output and 'FAIL ' not in output and 'AssertionError' not in output, name
print('PASS DoD 4: lane, pin, fan, overlap, containment, determinism and geometry-scope audits')
manifest = {}
for name in ['m45-overview', 'm45-roads-off', 'm45-junction-before-after', 'm45-junction-before', 'm45-junction-after']:
    data = (ROOT / (name + '.png')).read_bytes()
    assert data.startswith(b'\x89PNG\r\n\x1a\n')
    manifest[name] = hashlib.sha256(data).hexdigest()
checks = (ROOT / 'm45-check-output.txt').read_text()
passed = re.search(r'Tests\s+(\d+) passed', checks)
assert passed and int(passed.group(1)) >= 208
assert '[ELIFECYCLE]' not in checks and 'FAIL ' not in checks
changed = subprocess.check_output(['git', 'diff', '--name-only', '--diff-filter=A', '0e5f21e'], cwd=REPO, text=True).splitlines()
changed += subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=REPO, text=True).splitlines()
assert not [p for p in changed if p.endswith('.test.ts')]
metrics = {
    'milestone': 'M4.5', 'status': 'PASS',
    'scene': {'nodes': 24, 'sections': 4, 'wires': 26},
    'widthFunction': '12 + 12 * laneCount', 'lanePitch': 6,
    'preservationBaseline': '0e5f21e', 'permittedDerivedChanges': 'junction-aware lane indices, exact derived pin rows, junction traversals',
    'calculations': operations, 'browser': browser, 'selection': selection,
    'oracle': oracle, 'visual': visual, 'screenshots': manifest,
    'crossingCertification': proof,
    'tests': int(passed.group(1)), 'newTestFiles': 0,
}
if '--write' in sys.argv:
    (ROOT / 'metrics.json').write_text(json.dumps(metrics, indent=2) + '\n')
assert read('metrics.json') == metrics
print(f'PASS DoD 1: pnpm check, {passed.group(1)} tests; zero new .test.ts files')
print('PASS DoD 2: 24 nodes / 26 wires; frozen identity checked separately against 0e5f21e')
print(f"PASS DoD 3: certified={len(proof['certifiedCrossings'])}; uncertified={len(proof['uncertifiedCrossings'])}; J21={proof['J21']}; budgeted=" + json.dumps(visual['budgetedCounts']) + '; junction health=' + json.dumps(visual['junctionCrossingCounts']))
print(f"PASS DoD 5: routing={operations['wireRouting']['total']}; compilation={operations['laneNetwork']['total']}; max leg={max(x['operations'] for x in operations['perLeg'])}; discovery=0; every stage=1")
print(f"PASS DoD 6: loads={loads}; median={statistics.median(loads):.3f} ms; clone ops={operations['scalingProbe']['totalOperations']}; growth={operations['scalingProbe']['ratio']}")
print('PASS DoD 7: every selection item PASS, hub/api neighborhoods; layout counter 1 -> 1')
print('PASS DoD 8: required PNG hashes recorded; roads-off captured via checkbox')
print('PASS DoD 9: canonical scene/oracle/calculations/metrics reconciled for 26 wires')
for revision in ['8015299','9e79f68']:
    subprocess.run(['git','merge-base','--is-ancestor',revision,'HEAD'],cwd=REPO,check=True)
print('PASS both accepted bound-proof commits retained as ancestors')
if '--final' in sys.argv:
    branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=REPO, text=True).strip()
    status = subprocess.check_output(['git', 'status', '--porcelain'], cwd=REPO, text=True)
    assert branch == 'feat/lane-continuity' and status == '', (branch, status)
    print('PASS DoD 10: branch feat/lane-continuity; git status --porcelain empty')
    print(subprocess.check_output(['git', 'log', '--oneline', '-4'], cwd=REPO, text=True), end='')
