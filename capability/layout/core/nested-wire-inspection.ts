import type { NestedWire, NestedWireSegment } from '../contract/records/nested-wires.js';
import type {
  PrototypeBounds,
  PrototypePoint,
  PrototypeRoad,
  RoadPrototypeScene,
} from '../contract/records/road-prototype.js';

/** Independent invariant observations, not the router's own feasibility predicates. */
export interface NestedWireInspection {
  readonly corridors: readonly string[];
  readonly nodeBodies: readonly string[];
  readonly boundaries: readonly string[];
  readonly continuity: readonly string[];
}
function containsPoint(b: PrototypeBounds, p: PrototypePoint): boolean {
  return [b.x <= p.x, p.x <= b.x + b.width, b.y <= p.y, p.y <= b.y + b.height].every(Boolean);
}
function covered(s: NestedWireSegment, roads: ReadonlyMap<string, PrototypeRoad>): boolean {
  const road = roads.get(s.corridorId);
  if (road === undefined) return false;
  return [
    orthogonal(s),
    containsPoint(road.bounds, s.from),
    containsPoint(road.bounds, s.to),
  ].every(Boolean);
}
function orthogonal(s: NestedWireSegment): boolean {
  return s.from.x === s.to.x || s.from.y === s.to.y;
}
function openOverlap(a: number, b: number, c: number, d: number): boolean {
  return Math.max(Math.min(a, b), c) < Math.min(Math.max(a, b), d);
}
function bodyIntersection(s: NestedWireSegment, b: PrototypeBounds): boolean {
  const horizontal = [
    s.from.y > b.y,
    s.from.y < b.y + b.height,
    openOverlap(s.from.x, s.to.x, b.x, b.x + b.width),
  ].every(Boolean);
  const vertical = [
    s.from.x > b.x,
    s.from.x < b.x + b.width,
    openOverlap(s.from.y, s.to.y, b.y, b.y + b.height),
  ].every(Boolean);
  return horizontal || vertical;
}
function within(n: number, a: number, b: number): boolean {
  return n >= Math.min(a, b) && n <= Math.max(a, b);
}
const perpendicular = { x: 'y', y: 'x' } as const;
function intersection(
  s: NestedWireSegment,
  axis: 'x' | 'y',
  at: number,
  low: number,
  high: number,
): readonly PrototypePoint[] {
  const other = perpendicular[axis];
  if (s.from[axis] === s.to[axis]) return [];
  if (![within(at, s.from[axis], s.to[axis]), within(s.from[other], low, high)].every(Boolean))
    return [];
  return [{ ...s.from, [axis]: at }];
}
function touches(s: NestedWireSegment, b: PrototypeBounds): readonly PrototypePoint[] {
  return [
    ...[b.x, b.x + b.width].flatMap((x) => intersection(s, 'x', x, b.y, b.y + b.height)),
    ...[b.y, b.y + b.height].flatMap((y) => intersection(s, 'y', y, b.x, b.x + b.width)),
  ];
}
function same(a: PrototypePoint, b: PrototypePoint): boolean {
  return a.x === b.x && a.y === b.y;
}
function nongate(s: NestedWireSegment, scene: RoadPrototypeScene): boolean {
  return scene.sections.some((section) =>
    touches(s, section.bounds).some(
      (p) => !scene.ports.some((g) => g.nodeId === section.id && same(g.point, p)),
    ),
  );
}
function disconnected(w: NestedWire): boolean {
  return w.segments.slice(1).some((s, i) => !same(w.segments[i]?.to ?? s.from, s.from));
}
/** Read-only rectangle checks. All failures are returned as segment identities; retries have no effects. */
export function inspectNestedWires(
  scene: RoadPrototypeScene,
  wires: readonly NestedWire[],
): NestedWireInspection {
  const roads = new Map(scene.roads.map((r) => [r.id, r]));
  const all = wires.flatMap((w) =>
    w.segments.map((segment, i) => ({ id: `${w.id}:${i + 1}`, segment })),
  );
  return {
    corridors: all.filter((s) => !covered(s.segment, roads)).map((s) => s.id),
    nodeBodies: all
      .filter((s) => scene.nodes.some((n) => bodyIntersection(s.segment, n.bounds)))
      .map((s) => s.id),
    boundaries: all.filter((s) => nongate(s.segment, scene)).map((s) => s.id),
    continuity: wires.filter(disconnected).map((w) => w.id),
  };
}
