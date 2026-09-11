import type { VisualWire } from '../../contract/records/input.js';
import type { PlacedNode, Point } from '../../contract/records/geometry.js';
import { point } from '../../contract/records/geometry.js';
import type { Connection, RouteValue, Obstacle } from '../../contract/records/problem.js';
import type { SupplementalMeasurements } from '../../contract/types.js';
import type { RoutingContext } from '../../contract/types.js';
import type { Attachments } from './endpoints.js';
import { approach, endpoints } from './endpoints.js';
import { validRoute } from './checks.js';
import { union } from '../geometry/bounds.js';
import { samePoint } from '../geometry/intersections.js';
import { reject, requireValue } from '../validation/outcomes.js';
export interface RoutePlan {
  readonly wire: VisualWire;
  readonly attachments: Attachments;
  readonly connection: Connection;
  readonly manual: readonly Point[] | null;
}
/** Parallel connections get separate approach lengths without altering the actual row/side attachment. */
export function plan(
  wire: VisualWire,
  nodes: readonly PlacedNode[],
  metrics: SupplementalMeasurements,
  context: RoutingContext,
  parallel: number,
): RoutePlan {
  const resolved = endpoints(wire, nodes);
  const clearance = context.options.routeClearance * 2;
  const source = approach(resolved.source, clearance + metrics.markers[wire.sourceMarker].advance);
  const target = approach(resolved.target, clearance + metrics.markers[wire.targetMarker].advance);
  return {
    wire,
    attachments: resolved,
    manual: wire.route.manual ?? null,
    connection: {
      id: wire.id,
      source: resolved.source.point,
      target: resolved.target.point,
      sourceSide: resolved.source.side,
      targetSide: resolved.target.side,
      checkpoints: parallelCheckpoints(
        source,
        target,
        resolved.source.side,
        nodes,
        parallel,
        clearance,
        wire.label.height,
      ),
    },
  };
}
/** Parallel wires reserve distinct outside lanes while keeping the same exact semantic endpoints. */
function parallelCheckpoints(
  source: Point,
  target: Point,
  side: Connection['sourceSide'],
  nodes: readonly PlacedNode[],
  parallel: number,
  gap: number,
  labelHeight: number,
): readonly Point[] {
  if (parallel === 0) return [source, target];
  const bounds = union(nodes.map((node) => node.box));
  const distance = (parallel + 1) * (gap + labelHeight);
  return laneCheckpoints(source, target, side, bounds.x - distance, bounds.y - distance);
}
/** Outside checkpoint pairs create a visible lane along the endpoint's perpendicular axis. */
function laneCheckpoints(
  source: Point,
  target: Point,
  side: Connection['sourceSide'],
  x: number,
  y: number,
): readonly Point[] {
  if (side === 'left' || side === 'right')
    return [source, { x: source.x, y }, { x: target.x, y }, target];
  return [source, { x, y: source.y }, { x, y: target.y }, target];
}
/** Locked authored routes are accepted only if every original point remains valid. */
export function manual(
  plan: RoutePlan,
  obstacles: readonly Obstacle[],
  metrics: SupplementalMeasurements,
): RouteValue | null {
  if (plan.manual === null) return null;
  const valid = validRoute(
    plan.manual,
    plan.attachments.source,
    plan.attachments.target,
    obstacles.map((item) => item.box),
    plan.wire,
    metrics,
  );
  if (valid) return { id: plan.wire.id, points: plan.manual };
  return invalidManual(plan);
}
/** Soft invalid geometry requests native rerouting; a hard lock instead produces a named conflict. */
function invalidManual(plan: RoutePlan): RouteValue | null {
  if (plan.wire.route.locked)
    return reject(
      'constraint-conflict',
      plan.wire.id,
      'Locked manual route no longer matches ports or clear content',
      [plan.wire.id],
    );
  return null;
}
/** Remove only consecutive duplicate points from native output; authored manual vertices are untouched. */
function checkedRoute(value: RouteValue): RouteValue {
  value.points.forEach(checkPoint);
  return {
    ...value,
    points: value.points.filter((item, index) => distinct(item, value.points[index - 1])),
  };
}
/** A missing predecessor identifies the first native point. */
function distinct(point: Point, previous: Point | undefined): boolean {
  if (previous === undefined) return true;
  return !samePoint(point, previous);
}
/** Native nonfinite/oversized coordinates cannot reach path generation. */
function checkPoint(value: Point): void {
  if (!point.safeParse(value).success)
    reject('engine-failed', 'routing', 'Native route contains invalid coordinates');
}
/** Batched native routing is bracketed by cancellation and exact identity checks. */
export async function routeNative(
  connections: readonly Connection[],
  obstacles: readonly Obstacle[],
  context: RoutingContext,
): Promise<readonly RouteValue[]> {
  if (connections.length === 0) return [];
  requireValue(await context.dependencies.jobs.checkpoint(context.job));
  const values = requireValue(
    await context.dependencies.routing.route({
      connections,
      obstacles,
      clearance: context.options.routeClearance,
    }),
  );
  requireValue(await context.dependencies.jobs.checkpoint(context.job));
  const expected = connections.map((item) => item.id).toSorted();
  const actual = values.map((item) => item.id).toSorted();
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    reject('engine-failed', 'routing', 'Native route set differs from requested connections');
  return values.map(checkedRoute);
}
