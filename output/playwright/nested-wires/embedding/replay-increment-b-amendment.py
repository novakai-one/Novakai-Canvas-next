"""Independent numeric stop diagnosis. Reads public results and observation-only graph captures."""
import gzip
import json
from collections import defaultdict, deque
from pathlib import Path

ROOT = Path('output/playwright/nested-wires/embedding')


def order_graph(graph):
    incoming = dict.fromkeys((v['key'] for v in graph['vertices']), 0)
    outgoing = defaultdict(list)
    for c in graph['constraints']:
        if c['from'] != c['to']:
            incoming[c['to']] += 1
            outgoing[c['from']].append(c)
    queue = deque(key for key, degree in incoming.items() if degree == 0)
    order = []
    while queue:
        key = queue.popleft()
        order.append(key)
        for c in outgoing[key]:
            incoming[c['to']] -= 1
            if incoming[c['to']] == 0:
                queue.append(c['to'])
    return order, outgoing


def first_cycle(graph):
    _, outgoing = order_graph(graph)
    color, stack = {}, []

    def visit(key):
        if color.get(key) == 2:
            return None
        if color.get(key) == 1:
            return stack[next(i for i, c in enumerate(stack) if c['from'] == key):].copy()
        color[key] = 1
        for c in outgoing[key]:
            stack.append(c)
            found = visit(c['to'])
            if found:
                return found
            stack.pop()
        color[key] = 2
        return None

    for vertex in graph['vertices']:
        found = visit(vertex['key'])
        if found:
            return found
    return []


def solve(graph, scene):
    order, outgoing = order_graph(graph)
    assert len(order) == len(graph['vertices']), 'diagnostic numeric replay requires a DAG'
    positions = {v['key']: v['position'] for v in graph['vertices']}
    for key in order:
        for c in outgoing[key]:
            positions[c['to']] = max(positions[c['to']], positions[key] + c['required'])
    for c in graph['constraints']:
        assert positions[c['to']] >= positions[c['from']] + c['required'], c['key']
    aliases = {alias: v for v in graph['vertices'] for alias in v['aliases']}
    value = lambda alias: positions[aliases[alias]['key']]
    for section in scene['sections']:
        for axis, dimension in [('x', 'width'), ('y', 'height')]:
            assert value(section['id'] + ':' + axis + ':high') - value(section['id'] + ':' + axis + ':low') >= section['bounds'][dimension]
    for node in scene['nodes']:
        for axis in ['x', 'y']:
            center = aliases[node['id'] + ':' + axis + ':center']
            assert any(a.startswith(node['sectionId'] + ':' + axis + ':track:') for a in center['aliases'])
    return positions, aliases


def contact_losses(graph, scene, positions, aliases):
    # Opaque logical keys come from the observer aliases. No coordinates are parsed from IDs.
    road_keys = {}
    populations = json.loads(gzip.decompress((ROOT / 'increment-a-authoring-ledger.json.gz').read_bytes()))['value']['populations']
    for p in populations:
        road_keys[p['roadId']] = p['key']
    retained = json.loads(gzip.decompress((ROOT / 'increment-a-authoring-ledger.json.gz').read_bytes()))['value']['contacts']
    roads = {road_keys[r['id']]: r for r in scene['roads']}
    value = lambda key: positions[aliases[key]['key']]
    losses = []
    for contact in retained:
        pair = [(key, roads[key]) for key in [contact['a'], contact['b']]]
        drives = [(key, r) for key, r in pair if r['kind'] == 'driveway']
        streets = [(key, r) for key, r in pair if r['kind'] == 'street']
        if not drives or not streets:
            continue
        key, street = streets[0]
        drive_key, drive = drives[0]
        axis, dimension = ('x', 'width') if street['axis'] == 'horizontal' else ('y', 'height')
        start = street['bounds'][axis] + value(key + ':start') - aliases[key + ':start']['position']
        end = street['bounds'][axis] + street['bounds'][dimension] + value(key + ':end') - aliases[key + ':end']['position']
        at = value(drive_key)
        if not start <= at <= end:
            losses.append({'contact': contact, 'drive': drive['id'], 'street': street['id'], 'tangentCenter': at, 'streetSpan': [start, end]})
    return losses


scenes = {}
for name in ['default', 'hub', 'templates', 'scale', 'authoring']:
    capture = json.loads(gzip.decompress((ROOT / f'increment-b-{name}-admission.json.gz').read_bytes()))
    graph, scene = capture['graph'], capture['scene']
    cycle = first_cycle(graph)
    if cycle:
        assert name == 'authoring'
        for c, following in zip(cycle, cycle[1:] + cycle[:1]):
            assert c['to'] == following['from']
        vertices = {v['key']: v for v in graph['vertices']}
        used = {gate for wire in scene['wiring']['value'] for gate in wire['gates']}
        unused = {p['portId'] for p in scene['ports'] if p['nodeId'] == p['sectionId']} - used
        # Diagnostic only: restore A's used-mouth coverage to explain why admission alone was insufficient.
        partial = {**graph, 'constraints': [c for c in graph['constraints'] if not unused.intersection(c['provenance'])]}
        positions, aliases = solve(partial, scene)
        losses = contact_losses(partial, scene, positions, aliases)
        assert len(losses) == 17
        baseline_positions = {v['key']: v['position'] for v in graph['vertices']}
        baseline_losses = contact_losses(graph, scene, baseline_positions, aliases)
        baseline_keys = {loss['contact']['key'] for loss in baseline_losses}
        newly_lost = [loss for loss in losses if loss['contact']['key'] not in baseline_keys]
        assert len(baseline_losses) == 6
        assert len(newly_lost) == 11
        scenes[name] = {'status': 'STOP-cyclic-admission', 'cycle': cycle,
                        'cycleVertices': [vertices[c['from']] for c in cycle],
                        'requiredSum': sum(c['required'] for c in cycle),
                        'interpretation': 'Zero-sum equality cycle; not a proof of mathematical unsatisfiability. Ratified DAG admission rejects it.',
                        'usedMouthsOnlyDiagnostic': {'constraints': len(partial['constraints']), 'allRelationsSatisfied': True,
                                                    'driveCentersOutsideRegisteredStreetSpan': losses, 'baselineOutsideSpan': baseline_losses,
                                                    'newOutsideSpanCount': len(newly_lost), 'candidateMaterialized': False}}
    else:
        positions, aliases = solve(graph, scene)
        assert (positions, aliases) == solve(graph, scene)
        moved = sum(positions[v['key']] != v['position'] for v in graph['vertices'])
        if name in ['default', 'hub']:
            assert moved == 0
        scenes[name] = {'status': 'numeric-replay-passed', 'constraintsSatisfied': len(graph['constraints']),
                        'movedAnchors': moved, 'sectionShrinks': 0, 'splitGridTracks': 0,
                        'numericSolvesIdentical': True, 'candidateMaterialized': False}
receipt = {'status': 'STOP-cyclic-admission', 'scenes': scenes}
(ROOT / 'increment-b-amendment-replay.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({name: {key: value for key, value in result.items() if key not in ['cycle', 'cycleVertices', 'usedMouthsOnlyDiagnostic']}
                  for name, result in scenes.items()}, indent=2))
