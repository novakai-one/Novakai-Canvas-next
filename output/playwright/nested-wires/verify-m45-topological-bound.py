"""Certify M4.5 lower bounds without application search or geometry mutation.

Layer 1 independently relaxes every endpoint over all pitch-6 traffic-half slots.
Layer 2 retains only pair order along each road: one assigned straight lane
cannot change rank between junctions. Exhaustive Boolean truth tables in this
OFFLINE prover certify incompatible orders; they never choose application lanes.
The current canonical scene is audited against immutable M4 boundary arms.
Exit 1 rejects the corrected S1 <= 16 acceptance gate; it is not a passing run.
"""
import hashlib
import itertools
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASELINE = '0e5f21e:output/playwright/nested-wires/scene.json'
baseline = json.loads(subprocess.check_output(['git', 'show', BASELINE], text=True))
scene_bytes = (ROOT / 'scene.json').read_bytes()
scene = json.loads(scene_bytes)
roads = {road['id']: road for road in scene['roads']}
lanes = {lane['id']: lane for lane in scene['wireLanes']}
SIDES = ['N', 'E', 'S', 'W']
assert len({(lane['wireId'], lane['roadId']) for lane in lanes.values()}) == len(lanes), 'Proof expects one traversal per wire/road'
baseline_lanes = {lane['id']: lane for lane in baseline['wireLanes']}
assert set(lanes) == set(baseline_lanes)
for lane_id, lane in lanes.items():
    assert all(lane[key] == baseline_lanes[lane_id][key] for key in ['wireId', 'roadId', 'direction'])



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


def linked_constraint(junction, pair, first, second):
    """A complete truth table, valid for every rank magnitude in the traffic half.

    Different groups have disjoint perimeter ranges. Only endpoints sharing
    one road/direction/arm can reorder; their order is precisely the road-pair
    Boolean. Enumerating the first two ranks represents BOTH orders, not a
    restriction to those ranks. All other rank magnitudes preserve this order.
    Unsupported overlapping ranges are omitted, weakening the certificate.
    """
    endpoints = first + second
    variables = set()
    for a, b in itertools.combinations(endpoints, 2):
        ra, rb = a['clockwiseRange'], b['clockwiseRange']
        if ra[1] < rb[0] or rb[1] < ra[0]:
            continue
        same_group = all(a[key] == b[key] for key in ['road', 'direction', 'side'])
        if not same_group or a['wire'] == b['wire']:
            return None
        assert len(a['allowedIndices']) >= 2
        variables.add(a['road'])
    if not variables:
        return None  # Already counted (if forced) by the disjoint-range layer.
    variables = sorted(variables)
    rows = []
    for values in itertools.product([False, True], repeat=len(variables)):
        assignment = dict(zip(variables, values))
        positions = []
        for endpoint in endpoints:
            index = 0
            if endpoint['road'] in assignment:
                index = int((endpoint['wire'] == pair[0]) != assignment[endpoint['road']])
            coordinate = endpoint['allowedCoordinates'][index]
            position = perimeter(SIDES.index(endpoint['side']), coordinate, junction['bounds'])
            positions.append((position, endpoint['wire']))
        assert len(set(p for p, _ in positions)) == 4
        order = [wire for _, wire in sorted(positions)]
        rows.append({'values': list(values), 'crossing': order[0] == order[2] and order[1] == order[3]})
    return {'junction': junction['id'], 'label': junction['label'], 'bounds': junction['bounds'],
            'wires': list(pair), 'variables': variables, 'endpoints': endpoints, 'truthTable': rows}


def order_constraints(subject):
    constraints = []
    for junction in subject['junctions']:
        if owner(junction['bounds']) != 'section-1':
            continue
        paths = []
        for wire in subject['wiring']['value']:
            hits = events(wire, junction['bounds'])
            if len(hits) != 2 or any(hit['laneId'] is None for hit in hits):
                continue
            paths.append((wire['id'], [{'wire': wire['id'], **endpoint_range(hit, junction['bounds'])}
                                       for hit in hits]))
        for (a, first), (b, second) in itertools.combinations(paths, 2):
            constraint = linked_constraint(junction, (a, b), first, second)
            if constraint is not None and any(row['crossing'] for row in constraint['truthTable']):
                constraints.append(constraint)
    return constraints


def violated(constraint, assignment):
    values = [assignment[v] for v in constraint['variables']]
    return next(row['crossing'] for row in constraint['truthTable'] if row['values'] == values)


def exhaustive_table(constraints):
    variables = sorted({v for c in constraints for v in c['variables']})
    table = []
    for values in itertools.product([False, True], repeat=len(variables)):
        assignment = dict(zip(variables, values))
        crossings = [c['label'] for c in constraints if violated(c, assignment)]
        table.append({'assignment': assignment, 'mandatoryCrossingsAt': crossings,
                      'crossings': len(crossings)})
    return table


def controls():
    def fixed(label, value):
        return {'label': label, 'variables': ['road'],
                'truthTable': [{'values': [b], 'crossing': b == value} for b in [False, True]]}
    assert min(r['crossings'] for r in exhaustive_table([fixed('A', True), fixed('B', False)])) == 1
    assert min(r['crossings'] for r in exhaustive_table([fixed('A', True), fixed('B', True)])) == 0
    independent = fixed('B', False) | {'variables': ['different-road']}
    assert min(r['crossings'] for r in exhaustive_table([fixed('A', True), independent])) == 0
    print('PASS linked-order controls: opposite requirements force 1; compatible orders and independent roads force 0')


controls()
constraints = order_constraints(scene)
# Compare frozen boundary-arm provenance, not the old indices or pin positions.
def arms(subject):
    return {(j['id'], w['id']): sorted((hit['side'], lanes[hit['laneId']]['roadId'],
                                      lanes[hit['laneId']]['direction'])
                                     for hit in events(w, j['bounds']) if hit['laneId'])
            for j in subject['junctions'] for w in subject['wiring']['value']}

assert arms(scene) == arms(baseline), 'Current traversals changed frozen junction boundary arms'
print('PASS current canonical scene boundary arms agree with immutable M4; no baseline indices frozen')
obstructions = []
for pair in sorted({tuple(c['wires']) for c in constraints}):
    group = [c for c in constraints if tuple(c['wires']) == pair]
    table = exhaustive_table(group)
    minimum = min(row['crossings'] for row in table)
    if not minimum:
        continue
    # Additivity: separate wire pairs count separate intersections; same pair
    # counted across rectangles only if those rectangle interiors are disjoint.
    boxes = {c['junction']: c['bounds'] for c in group}
    for a, b in itertools.combinations(boxes.values(), 2):
        assert (a['x'] + a['width'] <= b['x'] or b['x'] + b['width'] <= a['x'] or
                a['y'] + a['height'] <= b['y'] or b['y'] + b['height'] <= a['y'])
    assert not any(set(w['wires']) == set(pair) for w in witnesses), 'Do not double-count a range certificate'
    obstructions.append({'wires': list(pair), 'lowerBound': minimum,
                         'constraints': group, 'exhaustiveAssignments': table,
                         'justification': 'Every consistent per-road pair order has an alternating boundary pair. '
                                          'All Boolean assignments are listed; rank magnitudes cannot change their order.'})
    print(f"FORCED-LINKED {'/'.join(pair)} >= {minimum}: " + ', '.join(c['label'] for c in group))
    for row in table:
        print('  ORDER ' + json.dumps(row, sort_keys=True))

# Independent rank-magnitude check for the linked certificates: enumerate ALL
# physical slots (including unused ones), not just the representative two ranks.
# Share a rank variable only for the same wire on the same road.
checked = 0
for obstruction in obstructions:
    for constraint in obstruction['constraints']:
        endpoints = constraint['endpoints']
        groups = {(e['wire'], e['road']): e['allowedIndices'] for e in endpoints}
        keys = sorted(groups)
        pair = constraint['wires']
        for values in itertools.product(*(groups[k] for k in keys)):
            ranks = dict(zip(keys, values))
            if any(ranks[(pair[0], v)] == ranks[(pair[1], v)] for v in constraint['variables']):
                continue  # Two different wires cannot share an assigned lane.
            assignment = {v: ranks[(pair[0], v)] < ranks[(pair[1], v)] for v in constraint['variables']}
            ordered = sorted((perimeter(SIDES.index(e['side']),
                                        e['allowedCoordinates'][ranks[(e['wire'], e['road'])]],
                                        constraint['bounds']), e['wire']) for e in endpoints)
            labels = [wire for _, wire in ordered]
            actual = labels[0] == labels[2] and labels[1] == labels[3]
            assert actual == violated(constraint, assignment)
            checked += 1
print(f'PASS exhaustive rank-magnitude control: {checked} legal physical-slot combinations match linked truth tables')

linked_bound = sum(o['lowerBound'] for o in obstructions)
bound = len(witnesses) + linked_bound
report = {'baseline': BASELINE, 'sceneSha256': hashlib.sha256(scene_bytes).hexdigest(),
          'section': 'section-1', 'target': 16, 'lowerBound': bound,
          'rankMagnitudeCombinationsChecked': checked,
          'independentEndpointLowerBound': len(witnesses), 'linkedRoadOrderLowerBound': linked_bound,
          'witnesses': witnesses, 'roadOrderObstructions': obstructions,
          'scope': 'Frozen routes, right-hand traffic, one constant assigned lane per road traversal. '
                   'Layer 1 independently permits every physical pitch-6 slot, even spare slots. '
                   'Layer 2 keeps only each same-direction wire pair order constant along a road; '
                   'all pair orders are enumerated independently, ignoring three-wire transitivity. '
                   'Both layers relax legal assignments. Their counted pairs are disjoint. '
                   'A linked certificate forces a crossing at one listed junction, not at every junction.'}
(ROOT / 'm45-topological-bound.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'PASS additive certificates: {len(witnesses)} independent-endpoint + {linked_bound} linked-road-order')
print(f"MEASURE section-1 unavoidable crossings >= {bound}; corrected target <= 16")
if bound > 16:
    print(f'FAIL DoD 3: certified lower bound {bound} > 16 with frozen routes, right-hand traffic, and constant road lanes')
    raise SystemExit(1)
print('PASS lower-bound feasibility gate only; actual crossing ceilings and certification coverage must also pass')
