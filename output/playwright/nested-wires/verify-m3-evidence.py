"""Reconcile the M3 acceptance artifacts; assertions fail the process. --write refreshes metrics."""
import hashlib
import itertools
import json
import re
import statistics
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
def read(name): return json.loads((ROOT / name).read_text())
scene, operations, browser, oracle = map(read, ['scene.json', 'calculations.json', 'm3-browser.json', 'oracle.json'])
selection = json.loads((ROOT.parent / 'selection/metrics.json').read_text())
assert scene['wiring']['ok'] and len(scene['wiring']['value']) == 18
assert len(oracle['wires']) == 18
assert operations['wireRouting']['total'] <= 700
assert operations['laneNetwork']['total'] <= 15000
assert operations['laneNetwork']['roadPairDiscoveryChecks'] == 0
assert max(x['operations'] for x in operations['perLeg']) <= 60
assert operations['scalingProbe']['nodes'] == [22,44]
assert operations['scalingProbe']['ratio'] <= 2.5
loads = [x['roads:navigation-to-ready'] for x in browser['loads']]
assert len(loads) == 5 and statistics.median(loads) == browser['medianMilliseconds'] <= 280
assert selection['counterBefore'] == selection['counterAfter'] == 1
assert '18 wires' in selection['messages'][0]
assert all(m.startswith('PASS') for m in selection['messages'])
manifest = {}
for name in ['m3-overview','m3-corridor-s2s4','m3-corridor-s3s4','m3-shared-rows']:
    data = (ROOT / (name+'.png')).read_bytes()
    assert data.startswith(b'\x89PNG\r\n\x1a\n')
    manifest[name] = hashlib.sha256(data).hexdigest()
checks = (ROOT / 'm3-final-checks.txt').read_text()
passed = re.search(r'Tests\s+(\d+) passed', checks)
assert passed and int(passed.group(1)) >= 208
assert '[ELIFECYCLE]' not in checks
changed = subprocess.check_output(['git','diff','--name-only','--diff-filter=A','2c8ca32'],cwd=REPO,text=True).splitlines()
changed += subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=REPO,text=True).splitlines()
assert not [p for p in changed if p.endswith('.test.ts')]
old_law = subprocess.check_output(['git','show','2c8ca32:capability/layout/core/nested-wire-law.ts'],cwd=REPO)
assert old_law == (REPO / 'capability/layout/core/nested-wire-law.ts').read_bytes()
# Count clean junction crossings, excluding common node-port endpoints, per deepest section.
def contains(p,b): return b['x'] <= p[0] <= b['x']+b['width'] and b['y'] <= p[1] <= b['y']+b['height']
def crossing(a,b):
    ah = a['from']['y'] == a['to']['y']; bh = b['from']['y'] == b['to']['y']
    if ah == bh:return None
    h,v = (a,b) if ah else (b,a)
    x,y = v['from']['x'],h['from']['y']
    if min(h['from']['x'],h['to']['x']) <= x <= max(h['from']['x'],h['to']['x']) and min(v['from']['y'],v['to']['y']) <= y <= max(v['from']['y'],v['to']['y']):return (x,y)
ports = {p['portId']:p for p in scene['ports']}
crossings = set()
for a,b in itertools.combinations(scene['wiring']['value'],2):
    shared = set([a['sourcePortId'],a['targetPortId']]) & set([b['sourcePortId'],b['targetPortId']])
    terminals = {(ports[p]['point']['x'],ports[p]['point']['y']) for p in shared}
    for sa,sb in itertools.product(a['segments'],b['segments']):
        hit = crossing(sa,sb)
        if hit and hit not in terminals:crossings.add((a['id'],b['id'],*hit))
counts = {s['id']:0 for s in scene['sections']} | {'world':0}
for a,b,x,y in crossings:
    owners = sorted([s for s in scene['sections'] if contains((x,y),s['bounds'])],key=lambda s:s['bounds']['width']*s['bounds']['height'])
    counts[owners[0]['id'] if owners else 'world'] += 1
assert all(n<=6 for n in counts.values()), counts
metrics = {'milestone':'M3','scene':{'nodes':22,'sections':4,'wires':18},'widthFunction':'12 + 12 * laneCount','lanePitch':6,'calculations':operations,'browser':browser,'m2MedianMilliseconds':243.7,'selection':selection,'oracle':oracle,'screenshots':manifest,'visual':{'perSectionCrossings':counts,'crossings':sorted(crossings)},'tests':int(passed.group(1)),'newTestFiles':0}
if '--write' in sys.argv:(ROOT/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
assert read('metrics.json') == json.loads(json.dumps(metrics))
print(f'PASS DoD 1: pnpm check, {passed.group(1)} tests; zero new .test.ts files')
print(f"PASS DoD 4/5: routing={operations['wireRouting']['total']}; compilation={operations['laneNetwork']['total']}; max leg={max(x['operations'] for x in operations['perLeg'])}; pair discovery={operations['laneNetwork']['roadPairDiscoveryChecks']}; clone total={operations['scalingProbe']['totalOperations']}")
print(f'PASS DoD 5: five loads={loads}; median={statistics.median(loads):.3f} ms <=280; M2=243.7 ms')
print('PASS DoD 6: all selection items PASS; layout counter 1 -> 1')
print('PASS DoD 8: four required PNGs, hashes recorded; per-section crossings='+json.dumps(counts))
print('PASS DoD 9: scene, oracle, calculations and metrics all describe 18 wires')
print('PASS unchanged law: byte-identical to 2c8ca32')
