/** Standalone M3 geometry acceptance. Node owns assertion failures; no scene mutation or test files.
 * Run: node --import tsx output/playwright/nested-wires/verify-lanes.mjs
 */
import assert from 'node:assert/strict';
import { register } from 'tsx/esm/api';
register();
const { createNestedRoadScene, inspectNestedWires } =
  await import('../../../capability/layout/contract/index.ts');
await import('./verify-m3-topology.mjs');
const scene = createNestedRoadScene();
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
function sharedTerminal(a, b, hit) {
  const common = [a.sourcePortId, a.targetPortId].filter((id) =>
    [b.sourcePortId, b.targetPortId].includes(id),
  );
  return common.some((id) => {
    const port = scene.ports.find((p) => p.portId === id);
    return port.nodeId.startsWith('node-') && port.point.x === hit.x && port.point.y === hit.y;
  });
}
function collision(a, b, sa, sb) {
  const hit = intersection(sa, sb);
  if (hit === null) return [];
  assert.equal(hit.length, 0, `${a.id}/${b.id} overlap ${JSON.stringify(hit)}`);
  if (sharedTerminal(a, b, hit)) return [hit];
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
  '3a global segment audit: zero same-axis overlap or parallel touch; perpendicular junction crossings and exact common node-port terminals only',
  () => {
    pairs(wires).forEach(([a, b]) => collisions(a, b));
  },
);
check(
  '3f no shared positive-length segments or nonjunction crossings; w12/w18 share only the exact node-12 terminal inside its driveway',
  () => {
    const shared = ['w12', 'w18'].map((id) => wires.find((w) => w.id === id));
    const driveway = 'drive:node-12:exit-bottom';
    const first = shared[0].segments.filter((s) => s.corridorId === driveway),
      second = shared[1].segments.filter((s) => s.corridorId === driveway);
    const hits = first.flatMap((a) => second.map((b) => intersection(a, b)).filter(Boolean));
    const port = scene.ports.find((p) => p.portId === 'node-12:exit-bottom');
    assert(hits.length > 0);
    hits.forEach((p) => assert.deepEqual(p, { ...port.point, length: 0 }));
  },
);
check('3g two complete scene JSON serialisations are byte-identical', () =>
  assert.equal(JSON.stringify(scene), JSON.stringify(createNestedRoadScene())),
);
