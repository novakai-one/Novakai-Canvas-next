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
  readonly pitch: number;
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
function assign(
  t: Travel,
  index: number,
  count: number,
  distance: number,
  pitch: number,
): AssignedTravel {
  const offset = distance * t.direction * rightHand(t.road);
  const a = axes[t.road.axis],
    b = t.road.bounds;
  return {
    ...t,
    count,
    pitch,
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
export interface LaneAnnotation {
  readonly roadId: string;
  readonly pitch: number;
  readonly verticalPitch?: number;
}
function assignedRoad(
  travels: readonly Travel[],
  compare: (a: Travel, b: Travel) => number,
  annotations?: ReadonlyMap<string, LaneAnnotation>,
): readonly AssignedTravel[] {
  return [1, -1].flatMap((direction) => {
    const group = travels.filter((t) => t.direction === direction).toSorted(compare);
    const pitches = group.map((travel) => annotationPitch(travel, annotations?.get(travel.wireId)));
    let distance = 0;
    return group.map((t, index) => {
      const pitch = pitches[index]!;
      distance += index === 0 ? pitch / 2 : Math.max(pitches[index - 1]!, pitch);
      return assign(t, index, group.length, distance, pitch);
    });
  });
}
/** Compiles retained law assignments once. Fresh indexes make caller-owned reconstruction safe. */
export function allocateNestedLanes(
  wires: readonly NestedWire[],
  roads: ReadonlyMap<string, PrototypeRoad>,
  annotations?: ReadonlyMap<string, LaneAnnotation>,
) {
  const travels = wires.flatMap((wire) => wireTravels(wire, roads));
  const byRoad = new Map<string, Travel[]>();
  travels.forEach((t) => addTo(byRoad, t.road.id, t));
  const compare = laneOrder(wires);
  const assigned = [...byRoad.values()].flatMap((group) =>
    assignedRoad(group, compare, annotations),
  );
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
    widths: measuredWidths(assigned),
    lanes: assigned.map((t) => t.lane),
  };
}

/** Buckets are invocation-local; append avoids copying a growing road population. */
function addTo<T>(index: Map<string, T[]>, id: string, value: T): void {
  const bucket = index.get(id) ?? [];
  bucket.push(value);
  index.set(id, bucket);
}

/** Only the chosen endpoint lane receives measured annotation spacing. */
function annotationPitch(travel: Travel, annotation?: LaneAnnotation): number {
  if (annotation?.roadId !== travel.road.id) return roadLanePitch(travel.road);
  const pitch =
    travel.road.axis === 'vertical'
      ? (annotation.verticalPitch ?? annotation.pitch)
      : annotation.pitch;
  return Math.max(roadLanePitch(travel.road), pitch);
}
/** Keep the complete outer annotation band inside the driveway, with one base-pitch border. */
function measuredWidths(travels: readonly AssignedTravel[]): ReadonlyMap<string, number> {
  const widths = new Map<string, number>();
  travels.forEach((travel) => {
    const width =
      2 * (Math.abs(travel.lane.offset) + travel.pitch / 2 + roadLanePitch(travel.road));
    widths.set(travel.road.id, Math.max(widths.get(travel.road.id) ?? 0, width));
  });
  return widths;
}
