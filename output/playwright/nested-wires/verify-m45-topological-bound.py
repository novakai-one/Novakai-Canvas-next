"""Audit the corrected M4.5 specification, allowing every lane-index permutation.

No application search or geometry mutation. The immutable M4 scene supplies
the frozen road routes. Each boundary endpoint independently ranges over ALL
pitch-6 indices fitting its traffic half, even unused indices: a relaxation of
any coordinated assignment.
Disjoint alternating endpoint ranges therefore certify unavoidable crossings.
Exit 1 means the milestone's S1 <= 11 target is impossible under these rules.
"""
import itertools
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASELINE = '0e5f21e:output/playwright/nested-wires/scene.json'
scene = json.loads(subprocess.check_output(['git', 'show', BASELINE], text=True))
roads = {road['id']: road for road in scene['roads']}
lanes = {lane['id']: lane for lane in scene['wireLanes']}
SIDES = ['N', 'E', 'S', 'W']


def contains(point, box):
    return all(box[k] <= point[k] <= box[k] + box[size]
               for k, size in [('x', 'width'), ('y', 'height')])


def perimeter(side, coordinate, box):
    x, y, w, h = (box[k] for k in ['x', 'y', 'width', 'height'])
    return [coordinate - x, w + coordinate - y,
            w + h + x + w - coordinate, 2*w + h + y + h - coordinate][side]


def events(wire, box):
    """Keep transverse boundary hits; prefer their adjacent lane-bearing stem."""
    found = {}
    x, y, w, h = (box[k] for k in ['x', 'y', 'width', 'height'])
    for segment in wire['segments']:
        a, b = segment['from'], segment['to']
        horizontal = a['y'] == b['y']
        along, across = ('x', 'y') if horizontal else ('y', 'x')
        lo, hi = sorted([a[along], b[along]])
        limits = [(x, 3), (x+w, 1)] if horizontal else [(y, 0), (y+h, 2)]
        low, high = (y, y+h) if horizontal else (x, x+w)
        for edge, side in limits:
            if not (lo <= edge <= hi and low < a[across] < high):
                continue
            key = (side, a[across])
            lane_id = segment.get('laneId')
            if key not in found or lane_id is not None:
                found[key] = {'side': side, 'coordinate': a[across],
                              'laneId': lane_id, 'point': {along: edge, across: a[across]}}
    return list(found.values())


def endpoint_range(event, box):
    """Exact set of allowable coordinates, WITHOUT retaining the baseline index."""
    lane = lanes[event['laneId']]
    road = roads[lane['roadId']]
    horizontal = road['axis'] == 'horizontal'
    across, size = ('y', 'height') if horizontal else ('x', 'width')
    assert contains(event['point'], road['bounds'])
    # Include spare physical slots, not just the occupied ranks in M4. This even
    # permits sparse assignments and ignores exclusivity between endpoints.
    count = int(road['bounds'][size] / 12)
    center = road['bounds'][across] + road['bounds'][size] / 2
    sign = lane['direction'] * (1 if horizontal else -1)
    assert event['coordinate'] == center + lane['offset']
    coordinates = [center + (index + .5) * 6 * sign for index in range(count)]
    assert event['coordinate'] in coordinates
    low, extent = (box['y'], box['height']) if horizontal else (box['x'], box['width'])
    assert all(low < coordinate < low + extent for coordinate in coordinates)
    positions = [perimeter(event['side'], coordinate, box) for coordinate in coordinates]
    return {'side': SIDES[event['side']], 'road': road['id'], 'direction': lane['direction'],
            'allowedIndices': list(range(count)), 'allowedCoordinates': coordinates,
            'clockwiseRange': [min(positions), max(positions)]}


def certify(a, b):
    ordered = sorted(a + b, key=lambda endpoint: endpoint['clockwiseRange'][0])
    if any(first['clockwiseRange'][1] >= second['clockwiseRange'][0]
           for first, second in zip(ordered, ordered[1:])):
        return None
    order = [endpoint['wire'] for endpoint in ordered]
    if order[0] == order[2] and order[1] == order[3]:
        return ordered
    return None


def owner(box):
    center = {'x': box['x'] + box['width']/2, 'y': box['y'] + box['height']/2}
    sections = [section for section in scene['sections'] if contains(center, section['bounds'])]
    return min(sections, key=lambda s: s['bounds']['width'] * s['bounds']['height'])['id'] if sections else 'world'


# Negative controls: same-direction endpoint ranges that can reorder are NOT proof.
def endpoint(wire, low, high):
    return {'wire': wire, 'clockwiseRange': [low, high]}


assert certify([endpoint('A', 0, 1), endpoint('A', 4, 5)],
               [endpoint('B', 2, 3), endpoint('B', 6, 7)])
assert certify([endpoint('A', 0, 3), endpoint('A', 4, 5)],
               [endpoint('B', 2, 3), endpoint('B', 6, 7)]) is None
assert certify([endpoint('A', 0, 1), endpoint('A', 2, 3)],
               [endpoint('B', 4, 5), endpoint('B', 6, 7)]) is None
print('PASS controls: disjoint ABAB accepted; reorderable ranges and AABB rejected')

witnesses = []
for junction in scene['junctions']:
    if owner(junction['bounds']) != 'section-1':
        continue
    paths = []
    for wire in scene['wiring']['value']:
        hits = events(wire, junction['bounds'])
        if len(hits) != 2 or any(hit['laneId'] is None for hit in hits):
            continue  # Omission weakens the lower bound; it never certifies a crossing.
        paths.append((wire['id'], [{'wire': wire['id'], **endpoint_range(hit, junction['bounds'])}
                                   for hit in hits]))
    for (a, first), (b, second) in itertools.combinations(paths, 2):
        ordered = certify(first, second)
        if ordered is None:
            continue
        reason = ' -> '.join(f"{e['wire']}:{e['side']}[{','.join(map(str, e['allowedCoordinates']))}]"
                             for e in ordered)
        witnesses.append({'junction': junction['id'], 'label': junction['label'],
                          'bounds': junction['bounds'], 'wires': [a, b],
                          'clockwiseEndpointRanges': ordered,
                          'justification': 'Disjoint ABAB ranges for every allowed index: ' + reason})
        print(f"FORCED {junction['label']} {a}/{b}: {reason}")

regions = {w['junction']: w['bounds'] for w in witnesses}
for a, b in itertools.combinations(regions.values(), 2):
    assert (a['x'] + a['width'] <= b['x'] or b['x'] + b['width'] <= a['x'] or
            a['y'] + a['height'] <= b['y'] or b['y'] + b['height'] <= a['y'])
print(f'PASS {len(regions)} disjoint junction rectangles; witness counts are additive')
report = {'baseline': BASELINE, 'section': 'section-1', 'target': 11,
          'lowerBound': len(witnesses), 'witnesses': witnesses,
          'scope': 'Every endpoint independently takes any pitch-6 index fitting its traffic half, '
                   'including spare slots and ignoring exclusivity. '
                   'This superset includes all globally coordinated lane permutations. '
                   'Frozen routes fix boundary arms; right-hand traffic fixes opposing half-orders. '
                   'No fixed baseline lane order, terminal order, projection algorithm, or pin position assumed.'}
(ROOT / 'm45-topological-bound.json').write_text(json.dumps(report, indent=2) + '\n')
print(f"MEASURE section-1 unavoidable crossings >= {len(witnesses)}; target <= 11")
if len(witnesses) > 11:
    print('FAIL DoD 3: lane reassignment alone cannot meet S1 <= 11 with frozen routes and right-hand traffic')
    raise SystemExit(1)
print('No impossibility certificate found; this does not prove the target feasible')
