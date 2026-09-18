import type {
  NestedWire,
  NestedWireLane,
  NestedWireSegment,
} from '../contract/records/nested-wires.js';
import type { PrototypeRoad } from '../contract/records/road-prototype.js';
import { axes } from './prototype-road-geometry.js';
import { roadLanePitch } from './nested-terminal-pins.js';
import { laneOrder } from './nested-lane-order.js';

export interface Travel {
  readonly road: PrototypeRoad;
  readonly wireId: string;
  readonly first: number;
  readonly last: number;
  readonly direction: 1 | -1;
}
export interface AssignedTravel extends Travel {
  readonly lane: NestedWireLane;
  readonly at: number;
  readonly count: number;
}
function travel(
  wireId: string,
  segment: NestedWireSegment,
  first: number,
  road: PrototypeRoad,
): readonly Travel[] {
  const a = axes[road.axis].along;
  if (segment.from[a] === segment.to[a]) return [];
  const direction = segment.to[a] > segment.from[a] ? 1 : -1;
  return [{ road, wireId, first, last: first, direction }];
}
function append(parts: readonly Travel[], next: Travel): readonly Travel[] {
  const last = parts.at(-1);
  if (last?.road.id !== next.road.id) return [...parts, next];
  return [...parts.slice(0, -1), { ...next, first: last.first }];
}
function wireTravels(
  wire: NestedWire,
  roads: ReadonlyMap<string, PrototypeRoad>,
): readonly Travel[] {
  return wire.segments
    .flatMap((s, i) => knownTravel(wire.id, s, i, roads.get(s.corridorId)))
    .reduce(append, []);
}
function knownTravel(
  wire: string,
  segment: NestedWireSegment,
  first: number,
  road: PrototypeRoad | undefined,
): readonly Travel[] {
  if (road === undefined) return [];
  return travel(wire, segment, first, road);
}
function rightHand(road: PrototypeRoad): number {
  return road.axis === 'horizontal' ? 1 : -1;
}
function assign(t: Travel, index: number, count: number): AssignedTravel {
  const offset = (index + 0.5) * roadLanePitch(t.road) * t.direction * rightHand(t.road);
  const a = axes[t.road.axis],
    b = t.road.bounds;
  return {
    ...t,
    count,
    at: b[a.across] + b[a.breadth] / 2 + offset,
    lane: {
      id: `${t.wireId}:${t.first}`,
      wireId: t.wireId,
      roadId: t.road.id,
      direction: t.direction,
      index,
      offset,
    },
  };
}
function assignedRoad(
  travels: readonly Travel[],
  compare: (a: Travel, b: Travel) => number,
): readonly AssignedTravel[] {
  return [1, -1].flatMap((direction) => {
    const group = travels.filter((t) => t.direction === direction).toSorted(compare);
    return group.map((t, index) => assign(t, index, group.length));
  });
}
/** Compiles retained law assignments once. Fresh indexes make caller-owned reconstruction safe. */
export function allocateNestedLanes(
  wires: readonly NestedWire[],
  roads: ReadonlyMap<string, PrototypeRoad>,
) {
  const travels = wires.flatMap((wire) => wireTravels(wire, roads));
  const byRoad = new Map<string, Travel[]>();
  travels.forEach((t) => addTo(byRoad, t.road.id, t));
  const compare = laneOrder(wires);
  const assigned = [...byRoad.values()].flatMap((group) => assignedRoad(group, compare));
  const byWire = new Map<string, AssignedTravel[]>();
  assigned.forEach((t) => addTo(byWire, t.wireId, t));
  byWire.forEach((ts, id) =>
    byWire.set(
      id,
      ts.toSorted((a, b) => a.first - b.first),
    ),
  );
  return {
    byWire,
    demand: new Map([...byRoad].map(([id, ts]) => [id, ts.length])),
    lanes: assigned.map((t) => t.lane),
  };
}

/** Buckets are invocation-local; append avoids copying a growing road population. */
function addTo<T>(index: Map<string, T[]>, id: string, value: T): void {
  const bucket = index.get(id) ?? [];
  bucket.push(value);
  index.set(id, bucket);
}
