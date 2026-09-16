import type {
  PrototypeLane,
  PrototypePoint,
  PrototypeJunction,
  PrototypeLaneConnection,
  PrototypeRoad,
  PrototypeCrossingExample,
} from '../contract/records/road-prototype.js';
import { directionVector, samePoint } from './prototype-road-geometry.js';

/** A perpendicular turn follows the two lane axes to their intersection; parallel lanes use the junction centre. */
export function connectionPoints(
  from: PrototypeLane,
  to: PrototypeLane,
  junction: PrototypeJunction | undefined,
): readonly PrototypePoint[] {
  if (junction === undefined) return [from.exit, to.entry];
  const a = directionVector[from.direction],
    b = directionVector[to.direction];
  if (a.x * b.x + a.y * b.y === 0) return [from.exit, corner(from, to), to.entry];
  return parallelPath(from, to, junction);
}
function corner(from: PrototypeLane, to: PrototypeLane): PrototypePoint {
  if (directionVector[from.direction].x === 0) return { x: from.exit.x, y: to.entry.y };
  return { x: to.entry.x, y: from.exit.y };
}
function parallelPath(
  from: PrototypeLane,
  to: PrototypeLane,
  junction: PrototypeJunction,
): readonly PrototypePoint[] {
  if (alignedForward(from, to)) return [from.exit, to.entry];
  const center = {
    x: junction.bounds.x + junction.bounds.width / 2,
    y: junction.bounds.y + junction.bounds.height / 2,
  };
  if (directionVector[from.direction].x === 0)
    return [from.exit, { x: from.exit.x, y: center.y }, { x: to.entry.x, y: center.y }, to.entry];
  return [from.exit, { x: center.x, y: from.exit.y }, { x: center.x, y: to.entry.y }, to.entry];
}

interface Segment {
  readonly a: PrototypePoint;
  readonly b: PrototypePoint;
}
function segments(points: readonly PrototypePoint[]): readonly Segment[] {
  return points
    .slice(1)
    .map((b, index) => ({ a: points[index] ?? b, b }))
    .filter(({ a, b }) => !samePoint(a, b));
}
function between(value: number, a: number, b: number): boolean {
  return value > Math.min(a, b) && value < Math.max(a, b);
}
function cross(a: Segment, b: Segment): readonly PrototypePoint[] {
  const horizontal = [a, b].find((s) => s.a.y === s.b.y);
  const vertical = [a, b].find((s) => s.a.x === s.b.x);
  if (horizontal === undefined || vertical === undefined) return [];
  const point = { x: vertical.a.x, y: horizontal.a.y };
  if (
    ![
      between(point.x, horizontal.a.x, horizontal.b.x),
      between(point.y, vertical.a.y, vertical.b.y),
    ].every(Boolean)
  )
    return [];
  return [point];
}

function example(
  junction: PrototypeJunction,
  roads: readonly PrototypeRoad[],
  lanes: readonly PrototypeLane[],
  connections: readonly PrototypeLaneConnection[],
): readonly PrototypeCrossingExample[] {
  const access = roads.find((road) => road.access !== null && junction.roadIds.includes(road.id));
  if (access?.access === null || access === undefined) return [];
  const driveway = lanes.find((lane) => lane.roadId === access.id);
  if (driveway === undefined) return [];
  return pairedPaths(junction, access.access.role, driveway, lanes, connections);
}
function pairedPaths(
  junction: PrototypeJunction,
  role: 'entry' | 'exit',
  driveway: PrototypeLane,
  lanes: readonly PrototypeLane[],
  connections: readonly PrototypeLaneConnection[],
): readonly PrototypeCrossingExample[] {
  const turns = connections.filter((link) => link.junctionId === junction.id);
  const primary = turns.filter((link) => [link.fromLaneId, link.toLaneId].includes(driveway.id));
  const through = turns.filter(
    (link) =>
      lanes.find((l) => l.id === link.fromLaneId)?.direction ===
      lanes.find((l) => l.id === link.toLaneId)?.direction,
  );
  const pairs = primary.flatMap((a) =>
    through.flatMap((b) => crossingPair(junction.id, role, a, b)),
  );
  return pairs.slice(0, 1);
}
function crossingPair(
  junctionId: string,
  role: 'entry' | 'exit',
  a: PrototypeLaneConnection,
  b: PrototypeLaneConnection,
): readonly PrototypeCrossingExample[] {
  const crossings = segments(a.points).flatMap((x) =>
    segments(b.points).flatMap((y) => cross(x, y)),
  );
  if (crossings.length === 0) return [];
  return [{ junctionId, role, primaryConnectionId: a.id, throughConnectionId: b.id, crossings }];
}
/** Each driveway gets an actual crossing example selected from the permitted connection graph. */
export function crossingExamples(
  junctions: readonly PrototypeJunction[],
  roads: readonly PrototypeRoad[],
  lanes: readonly PrototypeLane[],
  connections: readonly PrototypeLaneConnection[],
): readonly PrototypeCrossingExample[] {
  return junctions.flatMap((junction) => example(junction, roads, lanes, connections));
}

function alignedForward(from: PrototypeLane, to: PrototypeLane): boolean {
  const across = directionVector[from.direction].x === 0 ? 'x' : 'y';
  return from.direction === to.direction && from.exit[across] === to.entry[across];
}
