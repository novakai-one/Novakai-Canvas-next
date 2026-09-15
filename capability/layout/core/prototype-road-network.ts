import type {
  PrototypeBounds,
  PrototypeRoad,
  PrototypeLane,
  PrototypeJunction,
  PrototypeDivider,
  PrototypeLaneConnection,
} from '../contract/records/road-prototype.js';
import {
  axes,
  directionVector,
  intersection,
  hasArea,
  contains,
  samePoint,
} from './prototype-road-geometry.js';

interface Span {
  readonly start: number;
  readonly end: number;
}

/** A driveway touching a perpendicular street opens a turn area across that street's full width. */
function mouth(
  a: PrototypeRoad,
  b: PrototypeRoad,
  overlap: PrototypeBounds,
): PrototypeBounds | null {
  if (![overlap.width >= 0, overlap.height >= 0].every(Boolean)) return null;
  const driveway = [a, b].find((road) => road.kind === 'driveway');
  if (driveway === undefined) return null;
  return mouthBounds(
    [a, b].find((road) => road.kind === 'street'),
    overlap,
  );
}
function mouthBounds(
  street: PrototypeRoad | undefined,
  overlap: PrototypeBounds,
): PrototypeBounds | null {
  if (street === undefined) return null;
  const axis = axes[street.axis];
  return {
    ...overlap,
    [axis.across]: street.bounds[axis.across],
    [axis.breadth]: street.bounds[axis.breadth],
  };
}

/** Intersections derive from positioned roads; the renderer does not guess where to hide paint. */
function junction(a: PrototypeRoad, b: PrototypeRoad): readonly PrototypeJunction[] {
  if (a.axis === b.axis) return [];
  const overlap = intersection(a.bounds, b.bounds);
  const bounds = hasArea(overlap) ? overlap : mouth(a, b, overlap);
  return junctionRecord(`junction:${a.id}:${b.id}`, bounds);
}
function junctionRecord(id: string, bounds: PrototypeBounds | null): readonly PrototypeJunction[] {
  if (bounds === null) return [];
  return [{ id, bounds }];
}

function merge(spans: readonly Span[], next: Span): readonly Span[] {
  const last = spans.at(-1);
  if (last === undefined) return [next];
  if (next.start > last.end) return [...spans, next];
  return [...spans.slice(0, -1), { start: last.start, end: Math.max(last.end, next.end) }];
}

/** Remove all junction intervals before allocating straight lanes or their dividers. */
function clearSpans(road: PrototypeRoad, junctions: readonly PrototypeJunction[]): readonly Span[] {
  const axis = axes[road.axis];
  const start = road.bounds[axis.along],
    end = start + road.bounds[axis.length];
  const cuts = junctions
    .map((item) => intersection(road.bounds, item.bounds))
    .filter(hasArea)
    .map((box) => ({ start: box[axis.along], end: box[axis.along] + box[axis.length] }))
    .toSorted((a, b) => a.start - b.start)
    .reduce<readonly Span[]>(merge, []);
  const starts = [start, ...cuts.map((cut) => cut.end)];
  const ends = [...cuts.map((cut) => cut.start), end];
  return starts
    .map((start, index) => ({ start, end: ends[index] ?? start }))
    .filter((span) => span.end > span.start);
}

function lane(
  road: PrototypeRoad,
  span: Span,
  part: number,
  direction: PrototypeLane['direction'],
  index: number,
): PrototypeLane {
  const axis = axes[road.axis];
  const breadth = road.bounds[axis.breadth] / road.directions.length;
  const bounds = {
    ...road.bounds,
    [axis.along]: span.start,
    [axis.length]: span.end - span.start,
    [axis.across]: road.bounds[axis.across] + index * breadth,
    [axis.breadth]: breadth,
  };
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const vector = directionVector[direction];
  const half = (span.end - span.start) / 2;
  return {
    id: `${road.id}:part-${part}:${direction}`,
    roadId: road.id,
    direction,
    bounds,
    entry: { x: center.x - vector.x * half, y: center.y - vector.y * half },
    exit: { x: center.x + vector.x * half, y: center.y + vector.y * half },
  };
}

function divider(road: PrototypeRoad, span: Span, index: number): PrototypeDivider {
  const axis = axes[road.axis];
  return {
    id: `${road.id}:divider-${index}`,
    roadId: road.id,
    bounds: {
      ...road.bounds,
      [axis.along]: span.start,
      [axis.length]: span.end - span.start,
      [axis.across]: road.bounds[axis.across] + road.bounds[axis.breadth] / 2,
      [axis.breadth]: 0,
    },
  };
}

function dividers(road: PrototypeRoad, spans: readonly Span[]): readonly PrototypeDivider[] {
  if (road.directions.length !== 2) return [];
  return spans.map((span, index) => divider(road, span, index));
}

function roadParts(road: PrototypeRoad, junctions: readonly PrototypeJunction[]) {
  const spans = clearSpans(road, junctions);
  return {
    lanes: spans.flatMap((span, part) =>
      road.directions.map((direction, index) => lane(road, span, part, direction, index)),
    ),
    dividers: dividers(road, spans),
  };
}

function connection(
  from: PrototypeLane,
  to: PrototypeLane,
  junctions: readonly PrototypeJunction[],
): readonly PrototypeLaneConnection[] {
  if (from.id === to.id) return [];
  const shared = junctions.find(
    (item) => contains(item.bounds, from.exit) && contains(item.bounds, to.entry),
  );
  if (shared !== undefined)
    return [
      { id: `${from.id}>${to.id}`, fromLaneId: from.id, toLaneId: to.id, junctionId: shared.id },
    ];
  return straightConnection(from, to);
}

function straightConnection(
  from: PrototypeLane,
  to: PrototypeLane,
): readonly PrototypeLaneConnection[] {
  if (!samePoint(from.exit, to.entry)) return [];
  if (from.direction !== to.direction) return [];
  return [{ id: `${from.id}>${to.id}`, fromLaneId: from.id, toLaneId: to.id, junctionId: null }];
}

/** Pure, repeatable compilation of this prototype's roads into enforceable lanes and turn areas. */
export function roadNetwork(roads: readonly PrototypeRoad[]) {
  const junctions = roads.flatMap((a, index) =>
    roads.slice(index + 1).flatMap((b) => junction(a, b)),
  );
  const parts = roads.map((road) => roadParts(road, junctions));
  const lanes = parts.flatMap((part) => part.lanes);
  return {
    junctions,
    lanes,
    dividers: parts.flatMap((part) => part.dividers),
    connections: lanes.flatMap((from) => lanes.flatMap((to) => connection(from, to, junctions))),
  };
}
