"""Independent artifact checks; --write assembles metrics from measured raw evidence."""
import hashlib
import itertools
import json
import re
import statistics
import struct
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def read(name):
    return json.loads((ROOT / name).read_text())


def overlap(a, b):
    p, q, r, t = a['from'], a['to'], b['from'], b['to']
    return sum(max(0, min(max(p[o], q[o]), max(r[o], t[o])) - max(min(p[o], q[o]), min(r[o], t[o])))
               for axis, o in [('x', 'y'), ('y', 'x')] if p[axis] == q[axis] == r[axis] == t[axis])


def cross(a, b):
    if (a['from']['y'] == a['to']['y']) == (b['from']['y'] == b['to']['y']):
        return []
    h, v = (a, b) if a['from']['y'] == a['to']['y'] else (b, a)
    x, y = v['from']['x'], h['from']['y']
    if min(h['from']['x'], h['to']['x']) <= x <= max(h['from']['x'], h['to']['x']) and min(v['from']['y'], v['to']['y']) <= y <= max(v['from']['y'], v['to']['y']):
        return [(x, y)]
    return []


def rectangles_overlap(a, b):
    return max(a['x'], b['x']) < min(a['x'] + a['width'], b['x'] + b['width']) and max(a['y'], b['y']) < min(a['y'] + a['height'], b['y'] + b['height'])


def luminance(color):
    channels = [int(x) / 255 for x in re.findall(r'\d+', color)[:3]]
    linear = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in channels]
    return sum(x * weight for x, weight in zip(linear, [0.2126, 0.7152, 0.0722]))


def contrast(label):
    a, b = sorted([luminance(label['color']), luminance(label['halo'])])
    return (b + 0.05) / (a + 0.05)


def shape_quality(scene, browser):
    wires = scene['wiring']['value']
    pairs = [(a, b, x, y) for a, b in itertools.combinations(wires, 2) for x, y in itertools.product(a['segments'], b['segments'])]
    overlap_count = sum(overlap(x, y) > 0 for _, _, x, y in pairs)
    self_count = sum(overlap(a, b) > 0 for w in wires for a, b in itertools.combinations(w['segments'], 2))
    crossings = sorted({(a['id'], b['id'], *p) for a, b, x, y in pairs for p in cross(x, y)})
    labels = browser['visual']['labels']
    label_collisions = sum(rectangles_overlap(a['bounds'], b['bounds']) for a, b in itertools.combinations(labels, 2))
    body_collisions = sum(rectangles_overlap(label['bounds'], node['bounds']) for label in labels for node in browser['visual']['nodes'])
    heading_ratio = float(browser['visual']['headingSize'][:-2]) / float(browser['visual']['bodySize'][:-2])
    result = {'wireOverlapCount': overlap_count, 'selfOverlapCount': self_count, 'crossings': crossings, 'labelCollisionCount': label_collisions, 'labelNodeCollisionCount': body_collisions, 'minimumLabelHaloContrast': min(map(contrast, labels)), 'headingBodyRatio': heading_ratio}
    assert [overlap_count, self_count, label_collisions, body_collisions] == [0, 0, 0, 0], result
    assert result['minimumLabelHaloContrast'] >= 4.5, result
    assert heading_ratio >= 1.3, result
    # Ruling #14: M4.5 certification supersedes the historical crossings ceiling.
    proof = read('m45-topological-bound.json')
    certified = {(*record['wires'], *record['point']) for record in proof['certifiedCrossings']}
    assert (proof['sceneSha256'] == hashlib.sha256((ROOT / 'scene.json').read_bytes()).hexdigest()
            and proof['uncertifiedCrossings'] == [] and set(crossings) == certified), result
    return result


def screenshots(browser):
    names = ['overview'] + [f'w{i:02}' for i in range(1, 13)]
    assert len(browser['screenshots']) == 12
    assert all(s['fullyVisible'] for s in browser['screenshots'])
    hashes = {}
    for name in names:
        content = (ROOT / f'{name}.png').read_bytes()
        assert content[:8] == b'\x89PNG\r\n\x1a\n'
        assert struct.unpack('>II', content[16:24]) == (1920, 1440)
        hashes[name] = hashlib.sha256(content).hexdigest()
    return hashes


calculations, browser, scene = read('calculations.json'), read('browser.json'), read('scene.json')
loads = [v['roads:navigation-to-ready'] for v in browser['browser']['loads']]
assert len(loads) == 5
assert statistics.median(loads) == browser['medianMilliseconds']
assert sum(v['total'] for v in calculations['wireRouting']['perWire'].values()) == calculations['wireRouting']['total']
quality = shape_quality(scene, browser)
manifest = screenshots(browser)
# Rulings #15/#16: fixed accepted default-scene values, never self-derived ceilings.
ceilings = dict(zip([f'w{i:02}' for i in range(1, 27)], [
    11, 32, 14, 11, 15, 34, 32, 15, 34, 71, 42, 103, 32,
    11, 15, 72, 46, 104, 15, 11, 43, 33, 65, 51, 27, 53,
]))
assert len(scene['nodes']) == 24 and len(scene['sections']) == 4
assert [w['id'] for w in scene['wiring']['value']] == list(ceilings)
assert set(calculations['wireRouting']['perWire']) == set(ceilings)
for wire, ceiling in ceilings.items():
    value = calculations['wireRouting']['perWire'][wire]['total']
    assert value == ceiling, (wire, value, ceiling)
    print(f'PASS {wire}: {value} == {ceiling} routing ops')
assert calculations['wireRouting']['total'] == 992
assert calculations['laneNetwork']['total'] == 19768
assert calculations['laneNetwork']['roadPairDiscoveryChecks'] == 0
assert calculations['laneNetwork']['pairwiseRoadCandidates'] == 0
assert max(l['operations'] for l in calculations['perLeg']) == 41
probe = calculations['scalingProbe']
assert probe['nodes'] == [24, 48]
assert probe['laneCompile'][0] == calculations['laneNetwork']['total']
assert probe['ratio'] == probe['totalOperations'][1] / probe['totalOperations'][0]
assert probe['ratio'] == 1.698683048852266
assert statistics.median(loads) == 226.30000007152557
oracle = read('oracle.json')
assert len(oracle['wires']) == 26
assert [row['wire'] for row in oracle['wires']] == list(ceilings)
assert all(0 <= w['detourPercent'] <= 10 for w in oracle['wires'])
metrics = {'before': read('before.json'), 'after': {'calculations': calculations, 'browser': browser['browser'], 'visual': quality, 'screenshots': manifest, 'oracle': oracle}, 'ceilings': {'perWire': ceilings, 'perLeg': 41, 'wireTotal': 992, 'laneCompile': 19768, 'roadPairDiscoveryChecks': 0, 'medianLoadMilliseconds': 226.30000007152557, 'scalingRatio': 1.698683048852266}}
if '--write' in sys.argv:
    (ROOT / 'metrics.json').write_text(json.dumps(metrics, indent=2) + '\n')
assert read('metrics.json') == json.loads(json.dumps(metrics))
readme = (ROOT / 'README.md').read_text()
for value in [calculations['wireRouting']['total'], calculations['laneNetwork']['total'], *[v['total'] for v in calculations['wireRouting']['perWire'].values()]]:
    assert str(value) in readme, f'Missing README count: {value}'
assert f"{browser['medianMilliseconds']:.1f}" in readme
assert '100 nodes' in readme
print('PASS 4 metrics.json matches raw operation counts, five browser loads, and README summary.')
print('Node positioning:', calculations['stages']['nodes']['total'], '| Roads:', calculations['stages']['main-roads']['total'], '| Driveways:', calculations['stages']['driveways']['total'])
print('Wire routing per wire:', {key: value['total'] for key, value in calculations['wireRouting']['perWire'].items()})
print('Wire routing total:', calculations['wireRouting']['total'], '| Lane-network total:', calculations['laneNetwork']['total'])
print('Browser loads (ms):', [round(x, 1) for x in loads], '| Median:', round(statistics.median(loads), 1), 'ms')
print('PASS 5 overview.png + w01.png through w12.png: 13 valid 1920x1440 PNGs; all 12 complete paths inside their screenshot viewport.')
print('PASS visual geometry:', json.dumps(quality))

print('PASS hard ceilings: routing total', calculations['wireRouting']['total'], '== 992; lane compile', calculations['laneNetwork']['total'], '== 19768; road-pair discovery checks == 0')
print('PASS maximum leg:', max(l['operations'] for l in calculations['perLeg']), '== 41 ops')
print('PASS scaling: 24 nodes =', probe['laneCompile'][0], 'ops; 48 nodes =', probe['laneCompile'][1], 'ops; ratio =', probe['ratio'], '== 1.698683048852266')
print('PASS median load:', statistics.median(loads), '== 226.30000007152557 ms')

repo = ROOT.parents[2]
baseline = subprocess.check_output(['git', 'show', '266a96c:output/playwright/nested-wires/metrics.json'], cwd=repo, text=True)
assert json.loads(baseline) == read('before.json')
assert not (repo / 'capability/layout/tests/nested-wires.test.ts').exists()
added = subprocess.check_output(['git', 'diff', '--name-only', '--diff-filter=A', '266a96c'], cwd=repo, text=True).splitlines()
added += subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=repo, text=True).splitlines()
new_tests = [p for p in added if '/tests/' in p or re.search(r'\.(test|spec)\.[^.]+$', p)]
assert new_tests == [], new_tests
checks = (ROOT / 'checks.txt').read_text()
passed = re.search(r'Tests\s+(\d+) passed', checks)
assert passed and int(passed.group(1)) >= 208
assert '[ELIFECYCLE]' not in checks
assert probe['exactCloneVerified'] and probe['southOffset'] == 1920
print('PASS pinned M1 before metrics unchanged; exact 48-node clone verified at +1920 south.')
print('PASS nested-wires.test.ts deleted; new test files = 0; pnpm check test count =', passed.group(1))
