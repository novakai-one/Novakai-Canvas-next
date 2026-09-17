/** Standalone M4 geometry acceptance. Node owns assertion failures; no scene mutation or test files.
 * Run: node --import tsx output/playwright/nested-wires/verify-lanes.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { register } from 'tsx/esm/api';
register();
const { createNestedRoadScene, inspectNestedWires, fanInHubSceneSpec } =
  await import('../../../capability/layout/contract/index.ts');
await import('./verify-m3-topology.mjs');
await import('./verify-m4-pin-preservation.mjs');
const scene = createNestedRoadScene({ spec: fanInHubSceneSpec });
assert(scene.wiring?.ok);
const wires = scene.wiring.value;
const roads = new Map(scene.roads.map((r) => [r.id, r]));
const lanes = scene.wireLanes;
function check(name, run) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}
const across = (road) => (road.axis === 'horizontal' ? 'y' : 'x');
const along = (road) => (road.axis === 'horizontal' ? 'x' : 'y');
const width = (road) => road.bounds[road.axis === 'horizontal' ? 'height' : 'width'];
const contains = (p, b) =>
  p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
function laneGeometry(lane) {
  const road = roads.get(lane.roadId),
    c = across(road),
    a = along(road);
  const at = road.bounds[c] + width(road) / 2 + lane.offset;
  const wire = wires.find((w) => w.id === lane.wireId);
  const segments = wire.segments.filter((s) => s.laneId === lane.id);
  assert(segments.length > 0, lane.id);
  segments.forEach((s) => {
    assert.equal(s.from[c], at, lane.id);
    assert.equal(s.to[c], at, lane.id);
    assert.equal(Math.sign(s.to[a] - s.from[a]), lane.direction, lane.id);
  });
}
function roadLanes(road) {
  return lanes.filter((l) => l.roadId === road.id);
}
function pairs(items) {
  return items.flatMap((a, i) => items.slice(i + 1).map((b) => [a, b]));
}
function crossing(segment, port, road) {
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
check(
  '3a every assigned road/driveway lane distinct; actual centrelines match the assignment; shared gate positions distinct inside mouths',
  () => {
    scene.roads.forEach((road) =>
      assert.equal(
        new Set(roadLanes(road).map((l) => l.offset)).size,
        roadLanes(road).length,
        road.id,
      ),
    );
    lanes.forEach(laneGeometry);
    const gates = scene.roads.filter((r) => r.access?.nodeId.startsWith('section-'));
    gates.forEach((road) => {
      const port = scene.ports.find((p) => p.portId === road.access.portId);
      const hits = roadLanes(road).map((lane) => {
        const wire = wires.find((w) => w.id === lane.wireId);
        const points = wire.segments
          .filter((s) => s.corridorId === road.id)
          .flatMap((s) => crossing(s, port, road));
        assert(points.length > 0, lane.id);
        points.forEach((p) => {
          assert(contains(p, road.bounds));
          assert.equal(p[across(road)], port.point[across(road)] + lane.offset);
        });
        return JSON.stringify(points[0]);
      });
      assert.equal(new Set(hits).size, hits.length, road.id);
    });
  },
);
check(
  '3b opposite directions occupy opposite sides; same-direction lanes stack outward in wire-ID order at pitch 6',
  () => {
    scene.roads.forEach((road) => {
      pairs(roadLanes(road))
        .filter(([a, b]) => a.direction !== b.direction)
        .forEach(([a, b]) => assert(a.offset * b.offset < 0, road.id));
      [1, -1].forEach((direction) => {
        const group = roadLanes(road)
          .filter((l) => l.direction === direction)
          .sort((a, b) => a.wireId.localeCompare(b.wireId));
        group.forEach((lane, index) =>
          assert.equal(
            lane.offset,
            (index + 0.5) * 6 * direction * (road.axis === 'horizontal' ? 1 : -1),
          ),
        );
      });
    });
  },
);
check('3d every road and every node/gate driveway width = 12 + 12 × lane count', () => {
  scene.roads.forEach((road) => {
    assert.equal(road.wireLaneCount, roadLanes(road).length, road.id);
    assert.equal(width(road), 12 + 12 * road.wireLaneCount, road.id);
  });
});
function overlap(a, b) {
  const left = Math.max(a.x, b.x),
    right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y),
    bottom = Math.min(a.y + a.height, b.y + b.height);
  return left < right && top < bottom;
}
function crossesEdge(low, high, edge) {
  return low < edge && high > edge;
}
function axisBoundary(b, s, axis, size, other, extent) {
  const crosses = [s[axis], s[axis] + s[size]].some((edge) =>
    crossesEdge(b[axis], b[axis] + b[size], edge),
  );
  return crosses && b[other] < s[other] + s[extent] && b[other] + b[extent] > s[other];
}
function boundary(road, section) {
  return (
    axisBoundary(road.bounds, section.bounds, 'x', 'width', 'y', 'height') ||
    axisBoundary(road.bounds, section.bounds, 'y', 'height', 'x', 'width')
  );
}
check(
  '3e no road/driveway node overlap; streets respect boundaries; only registered junctions overlap; all wire containment, terminal and gate-lane invariants',
  () => {
    scene.roads.forEach((r) =>
      scene.nodes.forEach((n) => assert(!overlap(r.bounds, n.bounds), `${r.id}/${n.id}`)),
    );
    scene.roads.forEach((r) =>
      scene.sections
        .filter((s) => boundary(r, s))
        .forEach((s) => assert.equal(r.access?.nodeId, s.id, r.id)),
    );
    pairs(scene.roads)
      .filter(([a, b]) => overlap(a.bounds, b.bounds))
      .forEach(([a, b]) => {
        assert.notEqual(a.axis, b.axis, `${a.id}/${b.id}`);
        assert(
          scene.junctions.some((j) => j.roadIds.includes(a.id) && j.roadIds.includes(b.id)),
          `${a.id}/${b.id}`,
        );
      });
    assert.deepEqual(inspectNestedWires(scene, wires), {
      corridors: [],
      nodeBodies: [],
      boundaries: [],
      continuity: [],
    });
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
function collision(a, b, sa, sb) {
  const hit = intersection(sa, sb);
  if (hit === null) return [];
  assert.equal(hit.length, 0, `${a.id}/${b.id} overlap ${JSON.stringify(hit)}`);
  assert.notEqual(
    sa.from.x === sa.to.x,
    sb.from.x === sb.to.x,
    `${a.id}/${b.id} parallel touch ${JSON.stringify(hit)}`,
  );
  assert(
    scene.junctions.some((j) => contains(hit, j.bounds)),
    `${a.id}/${b.id} nonjunction crossing ${JSON.stringify(hit)}`,
  );
  return [hit];
}
function collisions(a, b) {
  return a.segments.flatMap((sa) => b.segments.flatMap((sb) => collision(a, b, sa, sb)));
}
check(
  '3a global segment audit: zero same-axis overlap or parallel touch; perpendicular junction crossings only; NO shared terminal exemption',
  () => {
    pairs(wires).forEach(([a, b]) => collisions(a, b));
  },
);
check('3g two complete scene JSON serialisations are byte-identical', () =>
  assert.equal(
    JSON.stringify(scene),
    JSON.stringify(createNestedRoadScene({ spec: fanInHubSceneSpec })),
  ),
);

check('M4 exactly 24 nodes / 26 wires; six hub imports and two api exports', () => {
  assert.equal(scene.nodes.length, 24);
  assert.equal(wires.length, 26);
  assert.deepEqual(
    wires.filter((w) => w.to === 'node-23').map((w) => [w.id, w.from]),
    [
      [19, 2],
      [20, 4],
      [21, 7],
      [22, 10],
      [23, 13],
      [24, 19],
    ].map(([id, from]) => [`w${id}`, `node-${from}`]),
  );
  assert.deepEqual(
    wires.filter((w) => w.from === 'node-24').map((w) => [w.id, w.to]),
    [
      ['w25', 'node-8'],
      ['w26', 'node-20'],
    ],
  );
  assert.equal(scene.nodes.find((n) => n.id === 'node-23').ports.length, 4);
});
check('M4 hub driveway >=3 lanes, width = 12 + 12*lanes, arrival lane order ascending', () => {
  const drives = scene.roads.filter((r) => r.access?.nodeId === 'node-23' && r.wireLaneCount >= 3);
  assert(drives.length > 0);
  for (const road of drives) {
    assert.equal(width(road), 12 + 12 * road.wireLaneCount);
    const arrivals = roadLanes(road)
      .toSorted((a, b) => a.index - b.index)
      .map((l) => l.wireId);
    assert.deepEqual(arrivals, arrivals.toSorted());
    console.log(
      `PASS hub capacity: ${road.id}; lanes=${road.wireLaneCount}; width=${width(road)}; order=${arrivals}`,
    );
  }
});
function ownNodeDriveway(wire, segment) {
  const owner = roads.get(segment.corridorId).access?.nodeId;
  if (owner?.startsWith('node-')) assert([wire.from, wire.to].includes(owner));
}
function ownTerminals(wire) {
  const source = scene.ports.find((p) => p.portId === wire.sourcePortId);
  const target = scene.ports.find((p) => p.portId === wire.targetPortId);
  assert.equal(source.nodeId, wire.from);
  assert.equal(target.nodeId, wire.to);
  assert.deepEqual(wire.segments[0].from, expectedPin(wire, source));
  assert.deepEqual(wire.segments.at(-1).to, expectedPin(wire, target));
  wire.segments.forEach((segment) => ownNodeDriveway(wire, segment));
}
check('M4 every terminal and node driveway belongs to its own source/target', () =>
  wires.forEach(ownTerminals),
);
function hubSegments(wire) {
  return wire.segments.filter((s) => roads.get(s.corridorId).access?.nodeId === 'node-23');
}
function hubCollision([a, b]) {
  hubSegments(a).forEach((sa) => hubSegments(b).forEach((sb) => collision(a, b, sa, sb)));
}
check('M4 hub entry driveways never merge and form planar fans to distinct pins', () => {
  pairs(wires.filter((w) => w.to === 'node-23')).forEach(hubCollision);
});
check('M4 hub final stems have no positive-length overlap', () => {
  const a = wires.find((w) => w.id === 'w20');
  const b = wires.find((w) => w.id === 'w21');
  const hit = intersection(a.segments.at(-1), b.segments.at(-1));
  console.log(`WITNESS w20/w21 final stems: ${JSON.stringify(hit)}`);
  assert.equal(hit?.length ?? 0, 0);
});
function expectedPin(wire, port) {
  const group = wires
    .filter((w) => [w.sourcePortId, w.targetPortId].includes(port.portId))
    .toSorted((a, b) => a.id.localeCompare(b.id));
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
    .toSorted((a, b) => a.id.localeCompare(b.id));
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
if (process.argv.includes('--oracle'))
  check('3e all eight hub oracle measurements reported; >10% flagged', () => {
    const report = JSON.parse(readFileSync(new URL('./oracle.json', import.meta.url)));
    const hub = report.wires.filter((w) => Number(w.wire.slice(1)) >= 19);
    assert.equal(hub.length, 8);
    hub.forEach(reportOracle);
  });

function reportOracle(row) {
  const wire = wires.find((w) => w.id === row.wire);
  const length = wire.segments.reduce(
    (sum, s) => sum + Math.abs(s.to.x - s.from.x) + Math.abs(s.to.y - s.from.y),
    0,
  );
  assert.equal(length, row.length);
  assert(row.oracle > 0 && row.oracle <= length);
  const flag = row.detourPercent > 10 ? ' FLAG >10%: orchestrator visual review' : '';
  console.log(
    `PASS ${row.wire}: length=${length}; oracle=${row.oracle}; detour=${row.detourPercent.toFixed(4)}%${flag}`,
  );
}

check('DoD 9 canonical scene matches full regenerated M4 serialization', () => {
  assert.equal(readFileSync(new URL('./scene.json', import.meta.url), 'utf8'), JSON.stringify(scene, null, 2) + '\n');
});
check('DoD 3f amended visual crossing budget', () => {
  const output = execFileSync('python3', ['output/playwright/nested-wires/verify-m4-visual-budget.py'], { encoding: 'utf8' });
  console.log(output.split('\n').filter((line) => line.startsWith('MEASURE') || line.startsWith('PASS')).join('\n'));
});
