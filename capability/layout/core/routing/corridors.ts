import type { Box, Point } from '../../contract/records/geometry.js';
import type { Connection } from '../../contract/records/problem.js';
import type { RoutePlan } from './native.js';
import { union, pointBounds } from '../geometry/bounds.js';

/** A bounded corridor is only a proposal; native routing and independent checks decide feasibility. */
export interface Corridor {
  readonly connection: Connection;
  readonly index: number;
}
/** Four endpoint-local sides at two measured distances give exactly eight local alternatives. Pure replay is safe; Layout owns retry and Authoring retains the scene on failure. */
export function localCorridors(plan: RoutePlan, gap: number): readonly Corridor[] {
  const bounds = pointBounds([plan.connection.source, plan.connection.target]);
  return [1, 2].flatMap((scale): readonly Corridor[] =>
    around(plan, bounds, gap * scale, (scale - 1) * 4),
  );
}
/** The final fallback alone may depend on whole-scene bounds; it consumes exactly one attempt. Pure replay is safe; Layout owns retry and Authoring retains the scene on failure. */
export function outsideCorridor(plan: RoutePlan, occupied: readonly Box[], gap: number): Corridor {
  const bounds = union(occupied);
  return corridor(
    plan,
    [
      { x: bounds.x - gap - plan.wire.label.width, y: bounds.y - gap - plan.wire.label.height },
      { x: bounds.x + bounds.width + gap, y: bounds.y - gap - plan.wire.label.height },
    ],
    8,
  );
}
/** Measured label dimensions reserve readable space on either side of the endpoint envelope. */
function around(plan: RoutePlan, bounds: Box, gap: number, offset: number): readonly Corridor[] {
  const left = bounds.x - gap - plan.wire.label.width;
  const right = bounds.x + bounds.width + gap + plan.wire.label.width;
  const top = bounds.y - gap - plan.wire.label.height;
  const bottom = bounds.y + bounds.height + gap + plan.wire.label.height;
  return [
    corridor(
      plan,
      [
        { x: bounds.x, y: top },
        { x: bounds.x + bounds.width, y: top },
      ],
      offset,
    ),
    corridor(
      plan,
      [
        { x: bounds.x, y: bottom },
        { x: bounds.x + bounds.width, y: bottom },
      ],
      offset + 1,
    ),
    corridor(
      plan,
      [
        { x: left, y: bounds.y },
        { x: left, y: bounds.y + bounds.height },
      ],
      offset + 2,
    ),
    corridor(
      plan,
      [
        { x: right, y: bounds.y },
        { x: right, y: bounds.y + bounds.height },
      ],
      offset + 3,
    ),
  ];
}
/** Preserve only the approach checkpoints around each alternative, never an old outside detour. */
function corridor(plan: RoutePlan, middle: readonly Point[], index: number): Corridor {
  return {
    index,
    connection: {
      ...plan.connection,
      checkpoints: [
        ...plan.connection.checkpoints.slice(0, 1),
        ...middle,
        ...plan.connection.checkpoints.slice(-1),
      ],
    },
  };
}
/** Manhattan length, bend count and stable proposal index order only independently valid candidates. Pure replay is safe; Layout owns retry and Authoring retains the scene on failure. */
export function compareRoutes(
  a: { readonly points: readonly Point[]; readonly index: number },
  b: { readonly points: readonly Point[]; readonly index: number },
): number {
  const lengthDifference = routeLength(a.points) - routeLength(b.points);
  if (lengthDifference !== 0) return lengthDifference;
  const bendDifference = bends(a.points) - bends(b.points);
  if (bendDifference !== 0) return bendDifference;
  return a.index - b.index;
}
/** Sum actual segment travel, including any reversal produced by the native engine. */
function routeLength(points: readonly Point[]): number {
  return points.slice(1).reduce((total, point, index): number => {
    const previous = points[index];
    if (previous === undefined) return total;
    return total + Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y);
  }, 0);
}
/** Collinear checkpoints do not count as bends; native paths may retain them for direction constraints. */
function bends(points: readonly Point[]): number {
  return points
    .slice(1, -1)
    .filter((point, index): boolean => turns(points[index], point, points[index + 2])).length;
}
/** Missing neighbours cannot contribute a direction change. */
function turns(a: Point | undefined, b: Point, c: Point | undefined): boolean {
  if (a === undefined || c === undefined) return false;
  return (a.x === b.x) !== (b.x === c.x);
}
