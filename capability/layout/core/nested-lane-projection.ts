import type { NestedWire, NestedWireSegment } from '../contract/records/nested-wires.js';
import type { PrototypePoint, PrototypeRoad } from '../contract/records/road-prototype.js';
import type { AssignedTravel } from './nested-wire-lanes.js';
import { axes, samePoint } from './prototype-road-geometry.js';
import { nestedLanePitch } from './prototype-nested-placement.js';
import { terminalPin } from './nested-terminal-pins.js';

interface Connection {
  readonly from: PrototypePoint;
  readonly to: PrototypePoint;
  readonly roadId: string;
  readonly via?: readonly PrototypePoint[];
}
function line(
  from: PrototypePoint,
  to: PrototypePoint,
  corridorId: string,
  laneId?: string,
): readonly NestedWireSegment[] {
  if (samePoint(from, to)) return [];
  return [{ from, to, corridorId, ...laneProperty(laneId) }];
}
function laneProperty(laneId: string | undefined) {
  return laneId === undefined ? {} : { laneId };
}
function point(t: AssignedTravel, along: number): PrototypePoint {
  return t.road.axis === 'horizontal' ? { x: along, y: t.at } : { x: t.at, y: along };
}
function corner(
  t: AssignedTravel,
  next: AssignedTravel,
  roads: ReadonlyMap<string, PrototypeRoad>,
  turns: ReadonlySet<string>,
): Connection {
  if (turnDirection(t, next) < 0) return leftConnection(t, next, roads, turns);
  const p = t.road.axis === 'horizontal' ? { x: next.at, y: t.at } : { x: t.at, y: next.at };
  return { from: p, to: p, roadId: next.road.id };
}
function center(road: PrototypeRoad): number {
  const a = axes[road.axis];
  return road.bounds[a.across] + road.bounds[a.breadth] / 2;
}
function turnKey(t: AssignedTravel, next: AssignedTravel, direction: number): string {
  return `${t.road.axis}/${center(t.road)}/${center(next.road)}/${direction}`;
}
/** Separate coincident corner legs by a quarter pitch inside the junction. */
function leftConnection(
  t: AssignedTravel,
  next: AssignedTravel,
  roads: ReadonlyMap<string, PrototypeRoad>,
  turns: ReadonlySet<string>,
): Connection {
  if (turns.has(turnKey(t, next, -t.direction))) return leftCorner(t, next, roads);
  const road = roads.get(next.road.id) ?? next.road;
  const a = axes[t.road.axis];
  const from = point(t, edge(road, t, 0.5));
  const to = point(next, t.at + (next.direction * nestedLanePitch) / 4);
  return {
    from,
    to,
    roadId: road.kind === 'driveway' ? t.road.id : road.id,
    via: [{ ...from, [a.across]: to[a.across] }],
  };
}
/** Opposing left turns use nested outer channels. Entry/exit depths differ
 * by half a pitch so adjacent approach arms cannot share a turn segment.
 */
function leftCorner(
  t: AssignedTravel,
  next: AssignedTravel,
  roads: ReadonlyMap<string, PrototypeRoad>,
): Connection {
  const incoming = roads.get(t.road.id) ?? t.road,
    outgoing = roads.get(next.road.id) ?? next.road;
  const from = point(t, edge(outgoing, t, t.lane.index + 0.25));
  const to = point(
    next,
    edge(incoming, { ...next, direction: next.direction === 1 ? -1 : 1 }, next.lane.index + 0.75),
  );
  const a = axes[t.road.axis];
  return {
    from,
    to,
    roadId: outgoing.kind === 'driveway' ? incoming.id : outgoing.id,
    via: [{ ...from, [a.across]: to[a.across] }],
  };
}
function edge(
  road: PrototypeRoad,
  travel: Pick<AssignedTravel, 'road' | 'direction'>,
  rank: number,
): number {
  const a = axes[travel.road.axis],
    b = road.bounds;
  return (
    b[a.along] + b[a.length] / 2 - travel.direction * (b[a.length] / 2 - rank * nestedLanePitch)
  );
}
function crossing(
  t: AssignedTravel,
  next: AssignedTravel,
  wire: NestedWire,
  roads: ReadonlyMap<string, PrototypeRoad>,
): PrototypeRoad | undefined {
  return wire.segments
    .slice(t.last + 1, next.first)
    .map((s) => roads.get(s.corridorId))
    .find((r) => r?.axis !== t.road.axis);
}
function bridge(
  t: AssignedTravel,
  next: AssignedTravel,
  wire: NestedWire,
  roads: ReadonlyMap<string, PrototypeRoad>,
): Connection {
  const road = crossing(t, next, wire, roads);
  if (road === undefined) return gateJoin(t, next, wire);
  return streetBridge(t, next, road);
}
function streetBridge(t: AssignedTravel, next: AssignedTravel, road: PrototypeRoad): Connection {
  const a = axes[t.road.axis],
    b = road.bounds;
  if (occupiedRank(t, next)) return medianBridge(t, next, road);
  const turn = Math.sign(next.at - t.at) * (t.road.axis === 'horizontal' ? -1 : 1);
  const at = b[a.along] + b[a.length] / 2 + turn * (b[a.length] / 2 - nestedLanePitch / 2);
  return { from: point(t, at), to: point(next, at), roadId: road.id };
}
/** An inward change across an occupied destination rank needs two separate turn columns.
 * Allocation ranks choose this fixed median dogleg; no intersection probing or retries.
 */
function occupiedRank(t: AssignedTravel, next: AssignedTravel): boolean {
  return [
    t.lane.index < next.count,
    t.lane.index > next.lane.index,
    t.direction === next.direction,
  ].every(Boolean);
}
function medianBridge(t: AssignedTravel, next: AssignedTravel, road: PrototypeRoad): Connection {
  const a = axes[t.road.axis],
    b = road.bounds;
  const middle = b[a.along] + b[a.length] / 2;
  const radius = (b[a.length] - nestedLanePitch) / 2;
  const near = middle - t.direction * radius,
    far = middle + t.direction * radius;
  const median = (t.at + next.at) / 2;
  return {
    from: point(t, near),
    to: point(next, far),
    roadId: road.id,
    via: [point(t, near), point(t, far)].map((p) => ({ ...p, [a.across]: median })),
  };
}
function gateJoin(t: AssignedTravel, next: AssignedTravel, wire: NestedWire): Connection {
  const at = wire.segments[t.last]?.to[axes[t.road.axis].along] ?? 0;
  return { from: point(t, at), to: point(next, at), roadId: t.road.id };
}
function connect(
  t: AssignedTravel,
  next: AssignedTravel,
  wire: NestedWire,
  roads: ReadonlyMap<string, PrototypeRoad>,
  turns: ReadonlySet<string>,
): Connection {
  if (t.road.axis !== next.road.axis) return corner(t, next, roads, turns);
  return bridge(t, next, wire, roads);
}
function fan(t: AssignedTravel, endpoint: PrototypePoint, sign: number) {
  const a = axes[t.road.axis];
  const pin = terminalPin(endpoint, a.across, t.lane, t.count);
  const along =
    endpoint[a.along] + sign * t.direction * (t.count - t.lane.index - 1) * nestedLanePitch;
  return { pin, bend: { ...pin, [a.along]: along }, end: point(t, along) };
}
function clipped(p: PrototypePoint, road: PrototypeRoad): PrototypePoint {
  const a = axes[road.axis],
    b = road.bounds;
  return { ...p, [a.along]: Math.max(b[a.along], Math.min(b[a.along] + b[a.length], p[a.along])) };
}
function owned(
  t: AssignedTravel,
  road: PrototypeRoad,
  from: PrototypePoint,
  to: PrototypePoint,
  before: string,
  after: string,
): readonly NestedWireSegment[] {
  const p = clipped(from, road),
    q = clipped(to, road);
  return [...line(from, p, before), ...line(p, q, road.id, t.lane.id), ...line(q, to, after)];
}
function piece(
  t: AssignedTravel,
  index: number,
  joins: readonly Connection[],
  travels: readonly AssignedTravel[],
  ends: readonly PrototypePoint[],
  roads: ReadonlyMap<string, PrototypeRoad>,
): readonly NestedWireSegment[] {
  const previous = joins[index - 1],
    next = joins[index];
  const start = previous?.to ?? ends[0],
    end = next?.from ?? ends[1];
  const road = roads.get(t.road.id);
  if (road === undefined || start === undefined || end === undefined) return [];
  const before = previous?.roadId ?? t.road.id;
  const after = nextOwner(t, travels[index + 1], next);
  return [
    ...owned(t, road, start, end, beforeOwner(t, travels[index - 1], before), after),
    ...connectionLine(next),
  ];
}
function beforeOwner(
  t: AssignedTravel,
  previous: AssignedTravel | undefined,
  bridgeId: string,
): string {
  if (previous?.road.axis !== t.road.axis) return previous?.road.id ?? t.road.id;
  return bridgeId;
}
function nextOwner(
  t: AssignedTravel,
  next: AssignedTravel | undefined,
  connection: Connection | undefined,
): string {
  if (next?.road.axis !== t.road.axis) return next?.road.id ?? t.road.id;
  return connection?.roadId ?? t.road.id;
}
function connectionLine(c: Connection | undefined): readonly NestedWireSegment[] {
  if (c === undefined) return [];
  const points = [c.from, ...(c.via ?? []), c.to];
  return points.slice(1).flatMap((p, i) => line(points[i] ?? p, p, c.roadId));
}
function joinsFor(
  travels: readonly AssignedTravel[],
  wire: NestedWire,
  roads: ReadonlyMap<string, PrototypeRoad>,
  turns: ReadonlySet<string>,
): readonly Connection[] {
  return travels.slice(0, -1).reduce<Connection[]>((joins, t, i) => {
    const next = joined(t, travels[i + 1], wire, roads, turns);
    return [...joins, ...next.map((c) => forwardConnection(c, t, joins.at(-1)))];
  }, []);
}
/** A widened neighboring mouth may consume the approach: retain a positive
 * stem before the turn instead of backtracking to the nominal entry column.
 */
function forwardConnection(
  c: Connection,
  t: AssignedTravel,
  previous: Connection | undefined,
): Connection {
  if (!previous || !c.via) return c;
  const axis = axes[t.road.axis].along;
  const start = previous.to[axis] + (t.direction * nestedLanePitch) / 4;
  if (t.direction * (c.from[axis] - start) >= 0) return c;
  return {
    ...c,
    from: { ...c.from, [axis]: start },
    via: c.via.map((p) => ({ ...p, [axis]: start })),
  };
}
function joined(
  t: AssignedTravel,
  next: AssignedTravel | undefined,
  wire: NestedWire,
  roads: ReadonlyMap<string, PrototypeRoad>,
  turns: ReadonlySet<string>,
): readonly Connection[] {
  return next === undefined ? [] : [connect(t, next, wire, roads, turns)];
}
/** Materialize retained assignments, never reroute. Missing plans leave the original typed failure owner intact. */
function projectNestedWire(
  wire: NestedWire,
  travels: readonly AssignedTravel[],
  roads: ReadonlyMap<string, PrototypeRoad>,
  turns: ReadonlySet<string>,
): NestedWire {
  const first = travels[0],
    last = travels.at(-1),
    source = wire.segments[0]?.from,
    target = wire.segments.at(-1)?.to;
  if (first === undefined || last === undefined || source === undefined || target === undefined)
    return wire;
  const start = fan(first, source, 1),
    end = fan(last, target, -1);
  const joins = joinsFor(travels, wire, roads, turns);
  const middle = travels.flatMap((t, i) =>
    piece(t, i, joins, travels, [start.end, end.end], roads),
  );
  return {
    ...wire,
    segments: [
      ...line(start.pin, start.bend, first.road.id),
      ...line(start.bend, start.end, first.road.id),
      ...middle,
      ...line(end.end, end.bend, last.road.id),
      ...line(end.bend, end.pin, last.road.id),
    ],
  };
}

function turnDirection(t: AssignedTravel, next: AssignedTravel): number {
  return t.direction * next.direction * (t.road.axis === 'horizontal' ? 1 : -1);
}
function leftKey(t: AssignedTravel, next: AssignedTravel): readonly string[] {
  return turnDirection(t, next) < 0 ? [turnKey(t, next, t.direction)] : [];
}
function leftKeys(t: AssignedTravel, next: AssignedTravel | undefined): readonly string[] {
  if (!next || t.road.axis === next.road.axis) return [];
  return leftKey(t, next);
}
/** Coordinate opposing left turns from retained assignments, then project each wire once. */
export function projectNestedWires(
  wires: readonly NestedWire[],
  byWire: ReadonlyMap<string, readonly AssignedTravel[]>,
  roads: ReadonlyMap<string, PrototypeRoad>,
): readonly NestedWire[] {
  const turns = new Set(
    [...byWire.values()].flatMap((ts) => ts.flatMap((t, i) => leftKeys(t, ts[i + 1]))),
  );
  return wires.map((wire) => projectNestedWire(wire, byWire.get(wire.id) ?? [], roads, turns));
}
