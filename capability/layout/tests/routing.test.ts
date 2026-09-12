import { describe, it, expect, assert } from 'vitest';
import type { Projection, Scene, Point, Box, VisualSection } from '../contract/index.js';
import {
  project,
  collection,
  object,
  section,
  edge,
  harness,
  request,
  value,
  node,
  metrics,
  settings,
  flow,
} from './fixtures.js';

describe('Layout routing acceptance', () => {
  it('7 — real Wasm avoids content, attaches measured members and exposes self/parallel wires', async () => {
    const source = routingProjection();
    const layout = await harness([source]);
    const scene = value(await layout.arrange(request(layout, source)));
    const wires = scene.sections[0]?.wires;
    assert(wires);
    expect(wires).toHaveLength(3);
    const first = wires[0];
    const second = wires[1];
    const self = wires[2];
    assert(first && second && self);
    const row = node(scene, 'a').measured.content.anchors.find((anchor) => anchor.member === 'out');
    assert(row);
    expect(first.source.side).toBe('right');
    expect(first.target.side).toBe('left');
    expect(first.source.point.y).toBeCloseTo(node(scene, 'a').box.y + row.y);
    expect(first.source.member).toBe('out');
    expect(first.points).not.toEqual(second.points);
    expect(self.source.node).toBe(self.target.node);
    expect(self.points.length).toBeGreaterThanOrEqual(4);
    expect(wires.every((wire) => !hits(wire.points, node(scene, 'obstacle').box))).toBe(true);
    expect(
      first.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
    ).toBe(true);
  });
  it('8 — manual locks preserve every point; endpoint movement rejects while soft routes adjust safely', async () => {
    const original = flow();
    const firstLayout = await harness([original]);
    const first = value(await firstLayout.arrange(request(firstLayout, original)));
    const points = first.sections[0]?.wires[0]?.points;
    assert(points);
    const locked = manualProjection(original, first, points, true, 0);
    const moved = manualProjection(original, first, points, true, 80);
    const soft = manualProjection(original, first, points, false, 80);
    const curved = manualProjection(original, first, points, false, 0, 'curve');
    const layout = await harness([locked, moved, soft, curved]);
    const retained = value(await layout.arrange(request(layout, locked)));
    expect(retained.sections[0]?.wires[0]?.points).toEqual(points);
    const conflict = await layout.arrange(request(layout, moved));
    assert(!conflict.ok);
    expect(conflict.error.code).toBe('constraint-conflict');
    expect(conflict.error.targets).toHaveLength(1);
    const adjusted = value(await layout.arrange(request(layout, soft)));
    expect(adjusted.sections[0]?.wires[0]?.points).not.toEqual(points);
    expect(adjusted.adjustments.some((item) => item.reason.includes('manual route'))).toBe(true);
    const curve = value(await layout.arrange(request(layout, curved)));
    expect(curve.sections[0]?.wires[0]?.points).toEqual(points);
    expect(
      value(
        layout.inspect({
          projection: curved,
          measurements: metrics(curved),
          options: settings,
          candidate: curve,
        }),
      ).valid,
    ).toBe(true);
    const obstacleSource = routingProjection();
    const rounded: Projection = {
      ...obstacleSource,
      sections: obstacleSource.sections.map((section) => ({
        ...section,
        wires: section.wires.map((wire) => ({ ...wire, route: { ...wire.route, route: 'curve' } })),
      })),
    };
    const roundedLayout = await harness([rounded]);
    const roundedScene = value(await roundedLayout.arrange(request(roundedLayout, rounded)));
    const roundedWires = roundedScene.sections[0]?.wires ?? [];
    expect(roundedWires.some((wire) => wire.path.includes(' Q '))).toBe(true);
    const obstacle = node(roundedScene, 'obstacle').box;
    roundedWires.forEach((wire) =>
      quadraticSamples(wire.path).forEach((point) =>
        expect(insideBox(point, obstacle)).toBe(false),
      ),
    );
    const fixedRequest = request(layout, soft, adjusted);
    const rerouted = value(
      await layout.route({
        projection: soft,
        measurements: fixedRequest.measurements,
        options: settings,
        fixed: adjusted,
        job: fixedRequest.job,
      }),
    );
    expect(rerouted.sections.map((section) => section.nodes)).toEqual(
      adjusted.sections.map((section) => section.nodes),
    );
    expect(rerouted.sections.map((section) => section.origin)).toEqual(
      adjusted.sections.map((section) => section.origin),
    );
  });
  it('9 — reserves measured ER labels and independent marker extents, and reports real crossings', async () => {
    const er = erProjection();
    const layout = await harness([er]);
    const scene = value(await layout.arrange(request(layout, er)));
    const wire = scene.sections[0]?.wires[0];
    assert(wire);
    expect(wire.sourceMarker).toBe('one');
    expect(wire.targetMarker).toBe('zero-many');
    expect(wire.labelBox.width).toBe(wire.measuredLabel.width);
    expect(wire.labelBox.height).toBe(wire.measuredLabel.height);
    expect(manhattan(wire.points[0], wire.points[1])).toBeGreaterThanOrEqual(
      metrics(er).markers.one.advance,
    );
    expect(manhattan(wire.points.at(-1), wire.points.at(-2))).toBeGreaterThanOrEqual(
      metrics(er).markers['zero-many'].advance,
    );
    expect(scene.sections[0]?.nodes.every((node) => !overlap(node.box, wire.labelBox))).toBe(true);
    // Different field rows must still connect inside the free corridor, without a backward outside loop.
    expect(
      wire.points.every(
        (point) => point.x >= wire.source.point.x && point.x <= wire.target.point.x,
      ),
    ).toBe(true);
    expect(wire.points.map((point) => point.x)).toEqual(
      wire.points.map((point) => point.x).toSorted((a, b) => a - b),
    );
    const crossing = crossingProjection();
    const other = await harness([crossing]);
    const crossed = value(await other.arrange(request(other, crossing)));
    expect(crossed.warnings).toHaveLength(1);
    expect(crossed.warnings[0]?.code).toBe('wire-crossing');
    expect(crossed.warnings[0]?.targets).toEqual(crossed.sections[0]?.wires.map((wire) => wire.id));
  });
});
/** Structured module ports force measured-row attachments; fixed boxes make the obstacle oracle independent of layout. */
function routingProjection(): Projection {
  return project(
    collection({
      objects: [
        object('a', 'module', {
          ports: [{ id: 'out', label: 'Send', type: 'Message', direction: 'out' }],
        }),
        object('b', 'module', {
          ports: [{ id: 'in', label: 'Receive', type: 'Message', direction: 'in' }],
        }),
        object('obstacle', 'module'),
      ],
      relationships: [
        edge('one', 'a', 'b', {
          kind: 'imports',
          source: { object: 'a', member: 'out' },
          target: { object: 'b', member: 'in' },
        }),
        edge('two', 'a', 'b', {
          kind: 'imports',
          source: { object: 'a', member: 'out' },
          target: { object: 'b', member: 'in' },
        }),
        edge('self', 'a', 'a', { kind: 'imports' }),
      ],
      sections: [
        section('modules', [], {
          mode: 'modules',
          layout: { algorithm: 'layered' },
          appearances: [
            { object: 'a', placement: { x: 0, y: 0, height: 160, locked: true } },
            { object: 'b', placement: { x: 600, y: 0, height: 160, locked: true } },
            { object: 'obstacle', placement: { x: 300, y: 0, height: 160, locked: true } },
          ],
          wires: [
            { relationship: 'one', sourceSide: 'right', targetSide: 'left' },
            { relationship: 'two', sourceSide: 'right', targetSide: 'left' },
            { relationship: 'self' },
          ],
        }),
      ],
    }),
  );
}
/** Test transformations retain owner-produced measured data; only explicit authored route/placement intent changes. */
function manualProjection(
  source: Projection,
  scene: Scene,
  points: readonly Point[],
  locked: boolean,
  movement: number,
  route: 'orthogonal' | 'curve' = 'orthogonal',
): Projection {
  return {
    ...source,
    revision: source.revision + 1,
    sections: source.sections.map((section) =>
      manualSection(section, scene, points, locked, movement, route),
    ),
  };
}
/** Public measured input supplies current locked positions so manual endpoint comparison is deterministic. */
function manualSection(
  section: VisualSection,
  scene: Scene,
  points: readonly Point[],
  locked: boolean,
  movement: number,
  route: 'orthogonal' | 'curve',
): VisualSection {
  return {
    ...section,
    nodes: section.nodes.map((source) => {
      const original = node(scene, source.objectId ?? '');
      const x = original.box.x + (source.objectId === 'beta' ? movement : 0);
      return { ...source, placement: { x, y: original.box.y, locked: true } };
    }),
    wires: section.wires.map((wire) => ({
      ...wire,
      route: { ...wire.route, manual: points, locked, route },
    })),
  };
}
/** Independent segment/rectangle test detects interior collisions without using Layout helpers. */
function hits(points: readonly Point[], box: Box): boolean {
  return points.slice(1).some((b, index) => segmentHit(points[index], b, box));
}
/** Test oracle uses axis intervals directly and excludes boundary tangency. */
function segmentHit(a: Point | undefined, b: Point, box: Box): boolean {
  assert(a);
  if (a.y === b.y)
    return (
      a.y > box.y &&
      a.y < box.y + box.height &&
      Math.min(a.x, b.x) < box.x + box.width &&
      Math.max(a.x, b.x) > box.x
    );
  return verticalHit(a, b, box);
}
/** Vertical interval oracle complements the independently expressed horizontal test. */
function verticalHit(a: Point, b: Point, box: Box): boolean {
  return (
    a.x > box.x &&
    a.x < box.x + box.width &&
    Math.min(a.y, b.y) < box.y + box.height &&
    Math.max(a.y, b.y) > box.y
  );
}
/** A route's first/last lengths must reserve different source and target marker extents. */
function manhattan(a: Point | undefined, b: Point | undefined): number {
  assert(a && b);
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
/** Rectangle oracle treats shared borders as clear, matching visible non-occlusion rather than coordinate equality. */
function overlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
/** ER cardinalities differ at each end so an accidental mirrored/default marker cannot pass. */
function erProjection(): Projection {
  return project(
    collection({
      objects: [
        object('user', 'entity', {
          content: [{ kind: 'field', id: 'id', label: 'id', type: 'UserId', key: 'primary' }],
        }),
        object('order', 'entity', {
          content: [
            { kind: 'field', id: 'id', label: 'id', type: 'OrderId', key: 'primary' },
            {
              kind: 'field',
              id: 'userId',
              label: 'userId',
              type: 'UserId',
              key: 'foreign',
              references: { object: 'user', member: 'id' },
            },
          ],
        }),
      ],
      relationships: [
        edge('places', 'user', 'order', {
          kind: 'association',
          from: '1',
          to: '0..many',
          source: { object: 'user', member: 'id' },
          target: { object: 'order', member: 'userId' },
        }),
      ],
      sections: [
        section('er', ['user', 'order'], {
          mode: 'er',
          layout: { algorithm: 'layered' },
          wires: [{ relationship: 'places' }],
        }),
      ],
    }),
  );
}
/** Two hard orthogonal paths cross in free space, away from all four fixed nodes and measured labels. */
function crossingProjection(): Projection {
  return project(
    collection({
      objects: ['left', 'right', 'top', 'bottom'].map((id) => object(id)),
      relationships: [edge('horizontal', 'left', 'right'), edge('vertical', 'top', 'bottom')],
      sections: [
        section('crossing', [], {
          appearances: [
            { object: 'left', placement: { x: 0, y: 300, height: 100, locked: true } },
            { object: 'right', placement: { x: 600, y: 300, height: 100, locked: true } },
            { object: 'top', placement: { x: 300, y: 0, height: 100, locked: true } },
            { object: 'bottom', placement: { x: 300, y: 600, height: 100, locked: true } },
          ],
          wires: [
            {
              relationship: 'horizontal',
              sourceSide: 'right',
              targetSide: 'left',
              manual: [
                { x: 136, y: 350 },
                { x: 600, y: 350 },
              ],
              locked: true,
            },
            {
              relationship: 'vertical',
              sourceSide: 'bottom',
              targetSide: 'top',
              manual: [
                { x: 368, y: 100 },
                { x: 368, y: 600 },
              ],
              locked: true,
            },
          ],
        }),
      ],
    }),
  );
}

/** Independent quadratic evaluation samples actual rendered bends, not only the orthogonal control corridor. */
function quadraticSamples(path: string): readonly Point[] {
  const number = '(-?[0-9]+(?:\\.[0-9]+)?)';
  const expression = new RegExp(
    `L ${number} ${number} Q ${number} ${number} ${number} ${number}`,
    'g',
  );
  const matches = [...path.matchAll(expression)];
  expect(matches.length).toBe((path.match(/ Q /g) ?? []).length);
  return matches.flatMap((match) => {
    const start = { x: Number(match[1]), y: Number(match[2]) };
    const control = { x: Number(match[3]), y: Number(match[4]) };
    const end = { x: Number(match[5]), y: Number(match[6]) };
    return [0.25, 0.5, 0.75].map((t) => quadratic(start, control, end, t));
  });
}
/** Standard quadratic Bezier equation is separate from Layout's corner construction. */
function quadratic(a: Point, control: Point, b: Point, t: number): Point {
  return {
    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * control.x + t ** 2 * b.x,
    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * control.y + t ** 2 * b.y,
  };
}
/** Strict rectangle interiors are the independently checked forbidden region. */
function insideBox(point: Point, box: Box): boolean {
  return (
    point.x > box.x &&
    point.x < box.x + box.width &&
    point.y > box.y &&
    point.y < box.y + box.height
  );
}
