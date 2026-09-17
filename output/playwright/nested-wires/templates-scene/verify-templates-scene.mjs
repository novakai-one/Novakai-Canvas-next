/** M6 public-output acceptance. Assertions fail closed; Node owns retries after correction. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  createNestedRoadScene,
  inspectNestedWires,
} from '../../../../capability/layout/contract/index.ts';

const configuration = JSON.parse(process.argv[2] ?? '{}');
const directory = new URL(configuration.directory ?? './', import.meta.url);
const spec = JSON.parse(
  readFileSync(new URL(configuration.specFile ?? 'scene-spec.json', directory), 'utf8'),
);
const layoutOptions = configuration.layoutOptions ?? {};
const nodeCount = configuration.nodeCount ?? 16;
const sectionCount = configuration.sectionCount ?? 9;
const wireCount = configuration.wireCount ?? 29;
const stages = [];
const scene = createNestedRoadScene({
  spec,
  ...layoutOptions,
  measure: (stage, run) => {
    stages.push(stage);
    return run();
  },
});
function check(name, operation) {
  try {
    operation();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}
const finite = (item) => Object.values(item.bounds).every(Number.isFinite);
const contains = (outer, inner) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;
check(
  `${nodeCount} nodes / ${sectionCount} sections; every node and child inside its owner; finite bounds`,
  () => {
    assert.equal(scene.nodes.length, nodeCount);
    assert.equal(scene.sections.length, sectionCount);
    assert([...scene.nodes, ...scene.sections, ...scene.roads].every(finite));
    scene.nodes.forEach((node) =>
      assert(
        contains(
          scene.sections.find((section) => section.id === node.sectionId).bounds,
          node.bounds,
        ),
      ),
    );
    scene.sections
      .filter((section) => section.parentSectionId !== null)
      .forEach((section) =>
        assert(
          contains(
            scene.sections.find((parent) => parent.id === section.parentSectionId).bounds,
            section.bounds,
          ),
        ),
      );
  },
);
check('minimal nested-only regression and explicit empty-section rejection', () => {
  const regression = createNestedRoadScene({
    spec: {
      sections: [
        {
          number: 1,
          nodes: [],
          children: [{ number: 2, nodes: [{ number: 1, label: 'child.ts' }], children: [] }],
        },
      ],
      requests: [],
    },
  });
  assert([...regression.nodes, ...regression.sections, ...regression.roads].every(finite));
  assert.throws(
    () =>
      createNestedRoadScene({
        spec: { sections: [{ number: 1, nodes: [], children: [] }], requests: [] },
      }),
    RangeError,
  );
});
check('two complete builds byte-identical; each one-way pipeline stage once', () => {
  assert.equal(
    JSON.stringify(scene),
    JSON.stringify(createNestedRoadScene({ spec, ...layoutOptions })),
  );
  assert.equal(stages.length, new Set(stages).size);
  assert.deepEqual(stages, [
    'capacity',
    'nodes',
    'ports',
    'topology',
    'wire-registry',
    ...spec.requests.map((_, index) => `wire:w${String(index + 1).padStart(2, '0')}`),
    'lane-allocation',
    'main-roads',
    'driveways',
    'network',
    'lane-projection',
  ]);
});
console.log(`STAGES ${JSON.stringify(stages)}`);
assert(scene.wiring.ok, JSON.stringify(scene.wiring));
const wires = scene.wiring.value;
check(`all ${wireCount} value wires route ok:true`, () => assert.equal(wires.length, wireCount));
const inspection = inspectNestedWires(scene, wires);
console.log(`INSPECTION ${JSON.stringify(inspection)}`);
check(
  'all wires inside corridors; gate-mouth crossings only; no body or continuity failures',
  () => {
    assert.deepEqual(inspection, { corridors: [], nodeBodies: [], boundaries: [], continuity: [] });
  },
);
function intersection(a, b) {
  const x0 = Math.max(Math.min(a.from.x, a.to.x), Math.min(b.from.x, b.to.x));
  const x1 = Math.min(Math.max(a.from.x, a.to.x), Math.max(b.from.x, b.to.x));
  const y0 = Math.max(Math.min(a.from.y, a.to.y), Math.min(b.from.y, b.to.y));
  const y1 = Math.min(Math.max(a.from.y, a.to.y), Math.max(b.from.y, b.to.y));
  if (x0 > x1 || y0 > y1) return null;
  return { x: x0, y: y0, length: x1 - x0 + y1 - y0 };
}
const pairs = (items) => items.flatMap((a, index) => items.slice(index + 1).map((b) => [a, b]));
function overlapWitness(a, b, first, second) {
  const hit = intersection(first, second);
  if (!hit || hit.length === 0) return [];
  return [{ wires: [a.id, b.id], hit, first, second }];
}
const overlaps = pairs(wires).flatMap(([a, b]) =>
  a.segments.flatMap((first) =>
    b.segments.flatMap((second) => overlapWitness(a, b, first, second)),
  ),
);
console.log(`OVERLAPS ${JSON.stringify(overlaps)}`);
check('zero positive-length parallel/coincident wire overlaps', () =>
  assert.equal(overlaps.length, 0),
);
function witness(id) {
  const [wireId, number] = id.split(':');
  const wire = wires.find((item) => item.id === wireId);
  const segment = wire.segments[Number(number) - 1];
  return {
    id,
    from: wire.from,
    to: wire.to,
    segment,
    road: scene.roads.find((road) => road.id === segment.corridorId),
  };
}
const failure = {
  inspection,
  overlaps,
  corridorWitnesses: inspection.corridors.map(witness),
  boundaryWitnesses: inspection.boundaries.map(witness),
  stages,
};
writeFileSync(new URL('invariant-audit.json', directory), JSON.stringify(failure, null, 2) + '\n');

const roads = new Map(scene.roads.map((road) => [road.id, road]));
const lanes = scene.wireLanes;
const containsPoint = (p, b) =>
  p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
const across = (road) => (road.axis === 'horizontal' ? 'y' : 'x');
const along = (road) => (road.axis === 'horizontal' ? 'x' : 'y');
const breadth = (road) => (road.axis === 'horizontal' ? 'height' : 'width');
const trafficSign = (road) => (road.axis === 'horizontal' ? 1 : -1);
function terminalRank(wire, port) {
  return lanes.find((l) => l.wireId === wire.id && l.roadId === `drive:${port.portId}`).index;
}
function expectedPin(wire, port) {
  const group = wires
    .filter((w) => [w.sourcePortId, w.targetPortId].includes(port.portId))
    .toSorted((a, b) => terminalRank(a, port) - terminalRank(b, port));
  const lane = lanes.find((l) => l.wireId === wire.id && l.roadId === `drive:${port.portId}`);
  const cross = ['left', 'right'].includes(port.side) ? 'y' : 'x';
  return {
    ...port.point,
    [cross]:
      port.point[cross] +
      (group.indexOf(wire) - (group.length - 1) / 2) * 6 * Math.sign(lane.offset),
  };
}
function verifyNodeSize(node) {
  assert.equal(node.bounds.width, 192);
  assert.equal(node.bounds.height, 96);
}
function pinPosition(wire, port) {
  return wire.sourcePortId === port.portId ? wire.segments[0].from : wire.segments.at(-1).to;
}
function verifyPin(wire, port, node, c) {
  const actual = pinPosition(wire, port);
  assert.deepEqual(actual, expectedPin(wire, port));
  assert(actual[c] >= node.bounds[c] + 6);
  assert(actual[c] <= node.bounds[c] + node.bounds[c === 'x' ? 'width' : 'height'] - 6);
  return actual;
}
function verifyFanPair([a, b], port) {
  const segments = (wire) => wire.segments.filter((s) => s.corridorId === `drive:${port.portId}`);
  segments(a).forEach((sa) =>
    segments(b).forEach((sb) =>
      assert.equal(intersection(sa, sb), null, `${port.portId}: nonplanar fan`),
    ),
  );
}
function verifyRow(port) {
  const group = wires
    .filter((w) => [w.sourcePortId, w.targetPortId].includes(port.portId))
    .toSorted((a, b) => terminalRank(a, port) - terminalRank(b, port));
  if (!group.length) return [];
  const c = ['left', 'right'].includes(port.side) ? 'y' : 'x';
  const node = scene.nodes.find((n) => n.id === port.nodeId);
  const points = group.map((w) => verifyPin(w, port, node, c));
  const coordinates = points.map((p) => p[c]);
  assert.equal((Math.min(...coordinates) + Math.max(...coordinates)) / 2, port.point[c]);
  coordinates.slice(1).forEach((value, i) => assert.equal(Math.abs(value - coordinates[i]), 6));
  pairs(group).forEach((pair) => verifyFanPair(pair, port));
  return points.map((p) => JSON.stringify(p));
}
check(
  '3c/d all pin rows exact, centered, ordered, pitch 6, >=6 end margins; 192x96 nodes; single-wire pins unchanged; globally unique terminals',
  () => {
    scene.nodes.forEach(verifyNodeSize);
    const all = scene.ports.filter((p) => p.nodeId.startsWith('node-')).flatMap(verifyRow);
    assert.equal(new Set(all).size, all.length);
  },
);

check(
  'four owned port sides; assigned lanes distinct, pitch 6 and forward; all gate positions distinct',
  () => {
    scene.nodes.forEach((node) =>
      assert.deepEqual(node.ports.map((p) => p.side).sort(), ['bottom', 'left', 'right', 'top']),
    );
    scene.roads.forEach((road) => {
      const group = lanes.filter((l) => l.roadId === road.id);
      assert.equal(new Set(group.map((l) => l.offset)).size, group.length);
      assert.equal(road.wireLaneCount, group.length);
      assert.equal(road.bounds[breadth(road)], 12 + 12 * group.length);
      group.forEach((lane) => {
        const segments = wires
          .find((w) => w.id === lane.wireId)
          .segments.filter((s) => s.laneId === lane.id);
        assert(segments.length, `no forward lane ${lane.id}`);
        assert.equal(lane.offset, (lane.index + 0.5) * 6 * lane.direction * trafficSign(road));
        const at = road.bounds[across(road)] + road.bounds[breadth(road)] / 2 + lane.offset;
        segments.forEach((s) => {
          assert.equal(s.from[across(road)], at);
          assert.equal(s.to[across(road)], at);
          assert.equal(Math.sign(s.to[along(road)] - s.from[along(road)]), lane.direction, lane.id);
        });
      });
    });
  },
);
const hits = new Map();
const invalidContacts = [];
function recordContact(a, b, first, second) {
  const hit = intersection(first, second);
  if (!hit) return;
  const transverse = (first.from.x === first.to.x) !== (second.from.x === second.to.x);
  if (hit.length !== 0 || !transverse) {
    invalidContacts.push({ wires: [a.id, b.id], hit, transverse });
    return;
  }
  const registeredJunctions = scene.junctions
    .filter((j) => containsPoint(hit, j.bounds))
    .map((j) => j.id);
  hits.set(`${a.id}/${b.id}/${hit.x}/${hit.y}`, {
    wires: [a.id, b.id],
    point: { x: hit.x, y: hit.y },
    registeredJunctions,
  });
}
pairs(wires).forEach(([a, b]) =>
  a.segments.forEach((first) => b.segments.forEach((second) => recordContact(a, b, first, second))),
);
check(
  'all distinct-wire contacts transverse; no parallel touches; each crossing in a registered junction',
  () => {
    assert.deepEqual(invalidContacts, []);
    assert([...hits.values()].every((hit) => hit.registeredJunctions.length > 0));
  },
);
console.log(`INVALID_CONTACTS ${JSON.stringify(invalidContacts)}`);
function owner(point) {
  return (
    scene.sections
      .filter((s) => containsPoint(point, s.bounds))
      .sort((a, b) => a.bounds.width * a.bounds.height - b.bounds.width * b.bounds.height)[0]?.id ??
    'world'
  );
}
const counts = Object.fromEntries(
  ['world', ...scene.sections.map((s) => s.id)].map((id) => [id, 0]),
);
for (const hit of hits.values()) counts[owner(hit.point)] += 1;
console.log(`CROSSINGS ${JSON.stringify(counts)}`);
writeFileSync(new URL('scene.json', directory), JSON.stringify(scene, null, 2) + '\n');

// Independent topological certificate, ported from the retained M4.5 prover.
// Enumerations belong exclusively to this offline audit, never the layout pipeline.
const laneById = new Map(lanes.map((l) => [l.id, l]));
// Terminal fans may occupy a junction. Close the proof disk at the node-owned
// pins so its boundary does not cut an in-progress fan (or count a tangent twice).
function proofRegion(junction) {
  const terminalRoads = junction.roadIds
    .map((id) => roads.get(id))
    .filter((r) => r.access?.nodeId.startsWith('node-'));
  const boxes = [junction.bounds, ...terminalRoads.map((r) => r.bounds)];
  const x = Math.min(...boxes.map((b) => b.x)),
    y = Math.min(...boxes.map((b) => b.y));
  return {
    ...junction,
    bounds: {
      x,
      y,
      width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
      height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
    },
  };
}
function closeAtPin(found, wire, portId, pin, box) {
  const road = roads.get(`drive:${portId}`);
  const side = [
    pin.y === box.y,
    pin.x === box.x + box.width,
    pin.y === box.y + box.height,
    pin.x === box.x,
  ].findIndex(Boolean);
  if (side < 0 || !containsPoint(pin, box)) return found;
  const lane = lanes.find((l) => l.wireId === wire.id && l.roadId === road.id);
  const retained = found.filter((e) => !(e.side === side && containsPoint(e.point, road.bounds)));
  return [
    ...retained,
    { side, coordinate: pin[across(road)], point: pin, laneId: lane.id, terminal: true },
  ];
}
function closeTerminals(found, wire, box) {
  const first = closeAtPin(found, wire, wire.sourcePortId, wire.segments[0].from, box);
  return closeAtPin(first, wire, wire.targetPortId, wire.segments.at(-1).to, box);
}
function perimeter(side, coordinate, b) {
  return [
    coordinate - b.x,
    b.width + coordinate - b.y,
    b.width + b.height + b.x + b.width - coordinate,
    2 * b.width + b.height + b.y + b.height - coordinate,
  ][side];
}
function segmentEvents(segment, b) {
  const [a, z] = [segment.from, segment.to];
  const horizontal = a.y === z.y;
  const [along, across] = horizontal ? ['x', 'y'] : ['y', 'x'];
  const [lo, hi] = [Math.min(a[along], z[along]), Math.max(a[along], z[along])];
  const limits = boundaryLimits(horizontal, b);
  const [low, high] = [b[across], b[across] + (horizontal ? b.height : b.width)];
  return limits
    .filter(([edge]) => [lo <= edge, edge <= hi, low < a[across], a[across] < high].every(Boolean))
    .map(([edge, side]) => ({
      side,
      coordinate: a[across],
      laneId: segment.laneId,
      point: { [along]: edge, [across]: a[across] },
    }));
}
function boundaryLimits(horizontal, b) {
  return horizontal
    ? [
        [b.x, 3],
        [b.x + b.width, 1],
      ]
    : [
        [b.y, 0],
        [b.y + b.height, 2],
      ];
}
function events(wire, b) {
  const found = new Map();
  wire.segments
    .flatMap((segment) => segmentEvents(segment, b))
    .forEach((event) => {
      const key = `${event.side}/${event.coordinate}`;
      if (!found.has(key) || event.laneId) found.set(key, event);
    });
  return closeTerminals([...found.values()], wire, b);
}
function endpointCoordinates(event, road, center, sign, count) {
  if (!event.terminal)
    return Array.from({ length: count }, (_, index) => center + (index + 0.5) * 6 * sign);
  const rowCount = lanes.filter((l) => l.roadId === road.id).length;
  const pinCenter = scene.ports.find((p) => p.portId === road.access?.portId).point[across(road)];
  return Array.from(
    { length: rowCount },
    (_, index) => pinCenter + (index - (rowCount - 1) / 2) * 6 * sign,
  );
}
function endpointRange(event, box) {
  const lane = laneById.get(event.laneId),
    road = roads.get(lane.roadId);
  const [across, size] = road.axis === 'horizontal' ? ['y', 'height'] : ['x', 'width'];
  assert(containsPoint(event.point, road.bounds));
  const count = Math.floor(road.bounds[size] / 12),
    center = road.bounds[across] + road.bounds[size] / 2;
  const sign = lane.direction * trafficSign(road);
  const coordinates = endpointCoordinates(event, road, center, sign, count);
  if (!event.terminal) assert.equal(event.coordinate, center + lane.offset);
  assert(coordinates.includes(event.coordinate));
  assert(coordinates.every((v) => box[across] < v && v < box[across] + box[size]));
  const positions = coordinates.map((v) => perimeter(event.side, v, box));
  return {
    wire: lane.wireId,
    side: event.side,
    road: road.id,
    direction: lane.direction,
    coordinates,
    range: [Math.min(...positions), Math.max(...positions)],
  };
}
function alternates(ordered) {
  return ordered[0] === ordered[2] && ordered[1] === ordered[3] && ordered[0] !== ordered[1];
}
function certify(first, second) {
  const ordered = [...first, ...second].sort((a, b) => a.range[0] - b.range[0]);
  if (ordered.slice(1).some((e, i) => ordered[i].range[1] >= e.range[0])) return null;
  return alternates(ordered.map((e) => e.wire)) ? ordered : null;
}
function assignments(variables) {
  return Array.from({ length: 2 ** variables.length }, (_, mask) =>
    Object.fromEntries(variables.map((v, i) => [v, Boolean(mask & (2 ** i))])),
  );
}
function sameGroup(a, b) {
  return [
    a.road === b.road,
    a.direction === b.direction,
    a.side === b.side,
    a.wire !== b.wire,
    JSON.stringify(a.coordinates) === JSON.stringify(b.coordinates),
  ].every(Boolean);
}
function constraint(junction, pair, first, second) {
  const endpoints = [...first, ...second];
  const overlapping = pairs(endpoints).filter(
    ([a, b]) => !(a.range[1] < b.range[0] || b.range[1] < a.range[0]),
  );
  if (overlapping.some(([a, b]) => !sameGroup(a, b))) return null;
  const names = [...new Set(overlapping.map(([a]) => a.road))].sort();
  if (!names.length) return null;
  overlapping.forEach(([a, b]) => assert(a.coordinates.length >= 2 && b.coordinates.length >= 2));
  const table = assignments(names).map((assignment) => {
    const positions = endpoints.map((e) => {
      const index = Object.hasOwn(assignment, e.road)
        ? Number((e.wire === pair[0]) !== assignment[e.road])
        : 0;
      return [perimeter(e.side, e.coordinates[index], junction.bounds), e.wire];
    });
    assert.equal(
      new Set(positions.map((p) => p[0])).size,
      4,
      JSON.stringify({ pair, junction: junction.label, endpoints, positions }),
    );
    return {
      assignment,
      crossing: alternates(positions.sort((a, b) => a[0] - b[0]).map((p) => p[1])),
    };
  });
  return {
    junction: junction.id,
    bounds: junction.bounds,
    wires: pair,
    variables: names,
    endpoints,
    table,
  };
}
function violated(c, assignment) {
  return c.table.find((row) => c.variables.every((v) => row.assignment[v] === assignment[v]))
    .crossing;
}
const endpointCertificates = [],
  constraints = [];
const proofRegions = scene.junctions.map(proofRegion);
function junctionPath(wire, junction) {
  const hits = events(wire, junction.bounds);
  if (hits.length !== 2 || hits.some((e) => !e.laneId)) return [];
  return [{ id: wire.id, endpoints: hits.map((e) => endpointRange(e, junction.bounds)) }];
}
function certifyPair(junction, a, b) {
  const ordered = certify(a.endpoints, b.endpoints);
  if (ordered)
    endpointCertificates.push({
      junction: junction.id,
      bounds: junction.bounds,
      wires: [a.id, b.id],
      endpoints: ordered,
    });
  const linked = constraint(junction, [a.id, b.id], a.endpoints, b.endpoints);
  retainConstraint(linked);
}
function retainConstraint(linked) {
  if (linked?.table.some((row) => row.crossing)) constraints.push(linked);
}
function disjointRegions(a, b) {
  return [
    a.x + a.width <= b.x,
    b.x + b.width <= a.x,
    a.y + a.height <= b.y,
    b.y + b.height <= a.y,
  ].some(Boolean);
}
check('topological endpoint ranges and linked road-order constraints', () => {
  assert.equal(new Set(lanes.map((l) => `${l.wireId}/${l.roadId}`)).size, lanes.length);
  pairs(proofRegions).forEach(([a, b]) =>
    assert(disjointRegions(a.bounds, b.bounds), `${a.label}/${b.label} proof regions overlap`),
  );
  proofRegions.forEach((junction) => {
    const paths = wires.flatMap((wire) => junctionPath(wire, junction));
    pairs(paths).forEach(([a, b]) => certifyPair(junction, a, b));
  });
});
const obstructions = [];
for (const key of new Set(constraints.map((c) => c.wires.join('/')))) {
  const group = constraints.filter((c) => c.wires.join('/') === key);
  const variables = [...new Set(group.flatMap((c) => c.variables))].sort();
  const table = assignments(variables).map((assignment) => ({
    assignment,
    crossings: group.filter((c) => violated(c, assignment)).map((c) => c.junction),
  }));
  const lowerBound = Math.min(...table.map((row) => row.crossings.length));
  if (lowerBound)
    obstructions.push({ wires: group[0].wires, lowerBound, constraints: group, table });
}
const certified = new Map(
  endpointCertificates.map((c) => [
    `${c.junction}/${c.wires.join('/')}`,
    { kind: 'endpoint-alternation', certificate: c },
  ]),
);
for (const obstruction of obstructions) {
  const relevant = [...hits.values()].filter(
    (hit) =>
      hit.wires.join('/') === obstruction.wires.join('/') &&
      !hit.registeredJunctions.some((j) => certified.has(`${j}/${hit.wires.join('/')}`)),
  );
  // A bound cannot certify surplus crossings of the same pair.
  if (relevant.length !== obstruction.lowerBound) continue;
  assert(
    obstruction.constraints.every((c) => !certified.has(`${c.junction}/${c.wires.join('/')}`)),
    'additive certificates require disjoint regions',
  );
  for (const c of obstruction.constraints) {
    const assignment = Object.fromEntries(
      c.variables.map((v) => [
        v,
        lanes.find((l) => l.wireId === c.wires[0] && l.roadId === v).index <
          lanes.find((l) => l.wireId === c.wires[1] && l.roadId === v).index,
      ]),
    );
    if (violated(c, assignment))
      certified.set(`${c.junction}/${c.wires.join('/')}`, {
        kind: 'linked-road-order',
        certificate: obstruction,
      });
  }
}
function coverage(hits, certificates) {
  const seen = new Set(),
    covered = [],
    uncovered = [];
  hits.forEach((hit) => {
    const key = hit.registeredJunctions
      .map((j) => `${j}/${hit.wires.join('/')}`)
      .find((k) => certificates.has(k) && !seen.has(k));
    if (!key) {
      uncovered.push(hit);
      return;
    }
    seen.add(key);
    covered.push({ ...hit, justification: certificates.get(key) });
  });
  return { covered, uncovered };
}
const certification = coverage([...hits.values()], certified);
const lowerBound =
  endpointCertificates.length + obstructions.reduce((sum, item) => sum + item.lowerBound, 0);
check('actual crossing count equals additive endpoint and linked-order lower bound', () => {
  assert.equal(hits.size, lowerBound);
});
check(
  'certificate negative controls reject reorderable ranges, unknown pairs and duplicate crossings',
  () => {
    const e = (wire, lo, hi) => ({ wire, range: [lo, hi] });
    assert(certify([e('a', 0, 1), e('a', 4, 5)], [e('b', 2, 3), e('b', 6, 7)]));
    assert.equal(certify([e('a', 0, 3), e('a', 4, 5)], [e('b', 2, 3), e('b', 6, 7)]), null);
    assert.equal(certify([e('a', 0, 1), e('a', 2, 3)], [e('b', 4, 5), e('b', 6, 7)]), null);
    assert.equal(
      coverage([{ wires: ['fake-a', 'fake-b'], registeredJunctions: [] }], certified).uncovered
        .length,
      1,
    );
    if (certification.covered.length)
      assert.equal(
        coverage([certification.covered[0], certification.covered[0]], certified).uncovered.length,
        1,
      );
  },
);
console.log(
  `CERTIFICATION ${certification.covered.length} certified / ${certification.uncovered.length} uncertified`,
);
writeFileSync(
  new URL('crossing-certificates.json', directory),
  JSON.stringify(
    { counts, lowerBound, endpointCertificates, obstructions, ...certification },
    null,
    2,
  ) + '\n',
);
check('zero uncertified crossings', () => assert.equal(certification.uncovered.length, 0));

check('exact semantic directory tree and per-directory file order', () => {
  const shape = (section) => [
    section.number,
    section.nodes.map((n) => n.label),
    section.children.map(shape),
  ];
  assert.deepEqual(
    spec.sections.map(shape),
    configuration.expectedShape ?? [
      [
        1,
        ['api.ts', 'brands.ts', 'compose.ts', 'errors.ts', 'index.ts', 'types.ts'],
        [
          [2, ['codecs.ts', 'identity.ts'], []],
          [3, ['failure-source.ts', 'preset.ts'], []],
        ],
      ],
      [
        4,
        [],
        [
          [5, ['plan.ts'], []],
          [6, ['select.ts'], []],
          [7, ['instantiate.ts'], []],
          [8, ['catalog.ts', 'outcomes.ts'], []],
        ],
      ],
      [9, ['identity.ts'], []],
    ],
  );
});
function gateHit(segment, port, road) {
  const a = along(road),
    c = across(road),
    at = port.point[a];
  if (segment.from[a] === segment.to[a]) return [];
  if (
    at < Math.min(segment.from[a], segment.to[a]) ||
    at > Math.max(segment.from[a], segment.to[a])
  )
    return [];
  return [{ ...port.point, [c]: segment.from[c] }];
}
check('every gate traversal crosses its own mouth at its assigned distinct offset', () => {
  scene.roads
    .filter((r) => r.access?.nodeId.startsWith('section-'))
    .forEach((road) => {
      const port = scene.ports.find((p) => p.portId === road.access.portId);
      const points = lanes
        .filter((l) => l.roadId === road.id)
        .map((lane) => {
          const wire = wires.find((w) => w.id === lane.wireId);
          const crossings = wire.segments
            .filter((s) => s.corridorId === road.id)
            .flatMap((s) => gateHit(s, port, road));
          assert(crossings.length, `${wire.id} missing owned gate crossing`);
          crossings.forEach((p) => {
            assert(containsPoint(p, road.bounds));
            assert.equal(p[across(road)], port.point[across(road)] + lane.offset);
          });
          return JSON.stringify(crossings[0]);
        });
      assert.equal(new Set(points).size, points.length);
    });
});
function straightInterval(wire, segment, point, axis) {
  if (scene.junctions.some((j) => containsPoint(point, j.bounds))) return;
  const road = roads.get(segment.corridorId);
  if (road.access?.nodeId.startsWith('node-')) return;
  const lane = lanes.find((l) => l.wireId === wire.id && l.roadId === road.id);
  assert(lane, `unassigned nonjunction interval ${wire.id}/${road.id}`);
  assert.equal(along(road), axis);
  assert.equal(
    point[across(road)],
    road.bounds[across(road)] + road.bounds[breadth(road)] / 2 + lane.offset,
  );
}
function scopeSegment(wire, segment) {
  const axis = segment.from.x === segment.to.x ? 'y' : 'x';
  const size = axis === 'x' ? 'width' : 'height';
  const [lo, hi] = [segment.from[axis], segment.to[axis]].sort((a, b) => a - b);
  const cuts = [
    ...new Set([
      lo,
      hi,
      ...scene.junctions.flatMap((j) => [j.bounds[axis], j.bounds[axis] + j.bounds[size]]),
    ]),
  ]
    .filter((v) => lo <= v && v <= hi)
    .sort((a, b) => a - b);
  cuts
    .slice(1)
    .forEach((value, i) =>
      straightInterval(wire, segment, { ...segment.from, [axis]: (value + cuts[i]) / 2 }, axis),
    );
}
check(
  'turns confined to registered junctions and terminal fans; remaining intervals on assigned lanes',
  () => {
    wires.forEach((w) => w.segments.forEach((s) => scopeSegment(w, s)));
  },
);
