"""M4 ruling #3 crossing-budget gate, plus an alternating-boundary health witness.

This is an acceptance audit, never application routing or path search. Two paths
whose four distinct boundary endpoints alternate around a rectangle must meet
inside it. Count each pair once in each disjoint registered junction region.
"""
import itertools
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
scene = json.loads((ROOT / 'scene.json').read_text())

def contains(p, b):
    return b['x'] <= p[0] <= b['x'] + b['width'] and b['y'] <= p[1] <= b['y'] + b['height']

def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]


def crossing(a, b):
    """Return single-point intersections and their acute angle; overlaps are never exempt."""
    p = (a['from']['x'], a['from']['y'])
    q = (b['from']['x'], b['from']['y'])
    r = (a['to']['x'] - p[0], a['to']['y'] - p[1])
    s = (b['to']['x'] - q[0], b['to']['y'] - q[1])
    assert math.hypot(*r) and math.hypot(*s), 'Zero-length segment: cannot classify crossing'
    delta = (q[0] - p[0], q[1] - p[1])
    denominator = cross(r, s)
    if denominator == 0:
        if cross(delta, r) != 0:
            return None
        axis = 0 if r[0] else 1
        start = max(min(p[axis], p[axis] + r[axis]), min(q[axis], q[axis] + s[axis]))
        end = min(max(p[axis], p[axis] + r[axis]), max(q[axis], q[axis] + s[axis]))
        if start > end:
            return None
        at = (start - p[axis]) / r[axis]
        return (p[0] + at*r[0], p[1] + at*r[1]), 0, start == end
    t, u = cross(delta, s) / denominator, cross(delta, r) / denominator
    if not (0 <= t <= 1 and 0 <= u <= 1):
        return None
    cosine = abs(r[0]*s[0] + r[1]*s[1]) / (math.hypot(*r) * math.hypot(*s))
    angle = math.degrees(math.acos(min(1, cosine)))
    return (p[0] + t*r[0], p[1] + t*r[1]), angle, True


def exemption(hit, junctions):
    point, angle, single = hit
    registered = sorted(j['id'] for j in junctions if contains(point, j['bounds']))
    legal = single and angle >= 60 and bool(registered)
    return legal, registered


def within_budget(counts):
    return all(n <= 6 for n in counts.values())


def verify_classifier():
    # Negative controls keep the exemption narrow without adding test files.
    box = [{'id': 'registered', 'bounds': {'x': -2, 'y': -2, 'width': 4, 'height': 4}}]
    segment = lambda a, b: {'from': dict(zip(('x', 'y'), a)), 'to': dict(zip(('x', 'y'), b))}
    horizontal = segment((-1, 0), (1, 0))
    perpendicular = crossing(horizontal, segment((0, -1), (0, 1)))
    shallow = crossing(horizontal, segment((-1, -1), (1, 1)))
    overlap = crossing(horizontal, segment((0, 0), (2, 0)))
    assert exemption(perpendicular, box)[0]
    assert not exemption(perpendicular, [])[0]
    assert not exemption(shallow, box)[0]
    assert not exemption(overlap, box)[0]
    assert exemption(((0, 0), 60, True), box)[0]
    assert not exemption(((0, 0), 59.999, True), box)[0]
    assert within_budget({'section': 6}) and not within_budget({'section': 7}), 'Ceiling must reject seven budgeted crossings'
    print('PASS exemption controls: registered perpendicular only; >=60 threshold; outside/shallow/overlap retained; ceiling rejects 7')


verify_classifier()
hits = {}
for a, b in itertools.combinations(scene['wiring']['value'], 2):
    for sa, sb in itertools.product(a['segments'], b['segments']):
        hit = crossing(sa, sb)
        if hit is not None:
            point, angle, single = hit
            key = (a['id'], b['id'], *point)
            legal, registered = exemption(hit, scene['junctions'])
            previous = hits.get(key)
            # At a bend every incident segment must qualify; never hide a tangent/overlap.
            if previous is not None:
                legal = legal and previous['excluded']
                angle = min(angle, previous['angleDegrees'])
                single = single and previous['singlePoint']
            hits[key] = {'wires': [a['id'], b['id']], 'point': list(point),
                         'angleDegrees': angle, 'singlePoint': single,
                         'registeredJunctions': registered, 'excluded': legal}
counts = {s['id']: 0 for s in scene['sections']} | {'world': 0}
budgeted_counts = dict(counts)
junction_counts = dict(counts)
records = []
for key, hit in sorted(hits.items()):
    owners = sorted((s for s in scene['sections'] if contains(hit['point'], s['bounds'])), key=lambda s: s['bounds']['width'] * s['bounds']['height'])
    owner = owners[0]['id'] if owners else 'world'
    counts[owner] += 1
    reason = 'perpendicular (>=60 degrees) single-point crossing at registered junction'
    if hit['excluded']:
        junction_counts[owner] += 1
    else:
        budgeted_counts[owner] += 1
        reason = 'not a >=60-degree single-point registered-junction crossing'
    record = {**hit, 'section': owner, 'reason': reason}
    records.append(record)
    print(('EXCLUDED ' if hit['excluded'] else 'BUDGETED ') + json.dumps(record))
print('MEASURE all crossings per section: ' + json.dumps(counts))
print('MEASURE junction crossings per section (health metric, no M4 ceiling): ' + json.dumps(junction_counts))
print('MEASURE budgeted crossings per section (ceiling <=6): ' + json.dumps(budgeted_counts))

def boundary_positions(wire, box):
    x, y, w, h = (box[k] for k in ['x', 'y', 'width', 'height'])
    positions = set()
    for segment in wire['segments']:
        a, b = segment['from'], segment['to']
        if a['y'] == b['y'] and y < a['y'] < y + h:
            for edge, distance in [(x, 2*w + h + y + h - a['y']), (x+w, w + a['y'] - y)]:
                if min(a['x'], b['x']) <= edge <= max(a['x'], b['x']):
                    positions.add(distance)
        if a['x'] == b['x'] and x < a['x'] < x + w:
            for edge, distance in [(y, a['x'] - x), (y+h, w + h + x + w - a['x'])]:
                if min(a['y'], b['y']) <= edge <= max(a['y'], b['y']):
                    positions.add(distance)
    return sorted(positions)

witnesses = []
s1 = next(s for s in scene['sections'] if s['id'] == 'section-1')['bounds']
s2 = next(s for s in scene['sections'] if s['id'] == 'section-2')['bounds']
for junction in scene['junctions']:
    box = junction['bounds']
    center = (box['x'] + box['width']/2, box['y'] + box['height']/2)
    if not contains(center, s1) or contains(center, s2):
        continue
    ends = [(wire['id'], boundary_positions(wire, box)) for wire in scene['wiring']['value']]
    for (a, pa), (b, pb) in itertools.combinations(ends, 2):
        if len(pa) != 2 or len(pb) != 2 or len(set(pa + pb)) != 4:
            continue
        order = [wire for position, wire in sorted([(p, a) for p in pa] + [(p, b) for p in pb])]
        if order[0] == order[2] and order[1] == order[3]:
            witnesses.append({'junction': junction['id'], 'bounds': box, 'wires': [a, b], 'boundaryOrder': order})
print(f'WITNESS section-1: {len(witnesses)} alternating-boundary wire pairs at registered junctions')
for witness in witnesses:
    print('WITNESS ' + json.dumps(witness))
report = {'ruling': 'M4 orchestrator ruling #3 (2026-09-17)',
          'counts': counts, 'budgetedCounts': budgeted_counts,
          'junctionCrossingCounts': junction_counts, 'ceiling': 6,
          'crossings': records, 'alternatingBoundaryWitnesses': witnesses}
(ROOT / 'm4-visual-budget.json').write_text(json.dumps(report, indent=2) + '\n')
assert within_budget(budgeted_counts), f'FAIL budgeted visual crossings: {budgeted_counts}; ceiling=6'
print('PASS DoD 3f retained crossing-budget gate under ruling #3; legal junction crossings reported, excluded with reasons')
