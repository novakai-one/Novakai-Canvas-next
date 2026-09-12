import type { VisualSection } from '../../contract/records/input.js';
import type { PlacedNode, RoutedWire, Box, Point } from '../../contract/records/geometry.js';
import type { RouteValue, Obstacle } from '../../contract/records/problem.js';
import type { SupplementalMeasurements } from '../../contract/types.js';
import type { RoutingContext } from '../../contract/types.js';
import type { RoutePlan } from './native.js';
import { plan, manual, routeNative } from './native.js';
import { obstacles, contentBoxes } from './obstacles.js';
import { markerBox, validRoute } from './checks.js';
import { labelBox } from './labels.js';
import { curvePath, linePath, segments } from './paths.js';
import { accumulate } from '../arrangement/sequential.js';
import { localCorridors, outsideCorridor, compareRoutes } from './corridors.js';
import type { Corridor } from './corridors.js';
import { reject } from '../validation/outcomes.js';
interface WireContext {
  readonly placement: RoutingContext;
  readonly metrics: SupplementalMeasurements;
  readonly obstacles: readonly Obstacle[];
}
/** Ranking metadata stays private and must never enter the strict public scene record. */
interface RankedRoute {
  readonly wire: RoutedWire;
  readonly points: readonly Point[];
  readonly index: number;
}
/** Marker and accepted label regions are reserved for subsequent labels. */
function reserved(plans: readonly RoutePlan[], context: WireContext): readonly Box[] {
  return plans.flatMap((item): readonly Box[] => [
    markerBox(item.attachments.source, context.metrics.markers[item.wire.sourceMarker]),
    markerBox(item.attachments.target, context.metrics.markers[item.wire.targetMarker]),
    ...routeBoxes([
      item.connection.source,
      item.connection.sourceApproach ?? item.connection.source,
    ]),
    ...routeBoxes([
      item.connection.target,
      item.connection.targetApproach ?? item.connection.target,
    ]),
  ]);
}
/** Wire rendering retains authoritative label/marker/style data and derives only path geometry. */
function wire(
  plan: RoutePlan,
  points: readonly Point[],
  labelBox: Box,
  context: WireContext,
): RoutedWire {
  const obstacles = context.obstacles.map((item): Box => item.box);
  const path =
    plan.wire.route.route === 'curve'
      ? curvePath(points, context.placement.options.routeClearance / 2, obstacles)
      : linePath(points);
  return {
    id: plan.wire.id,
    ...plan.attachments,
    points,
    path,
    labelBox,
    measuredLabel: plan.wire.label,
    sourceMarker: plan.wire.sourceMarker,
    targetMarker: plan.wire.targetMarker,
    style: plan.wire.style,
  };
}
/** Candidate validation is independent of native success and reserves the candidate's own wire path. */
function candidate(
  plan: RoutePlan,
  points: readonly Point[],
  occupied: readonly Box[],
  context: WireContext,
): RoutedWire | null {
  if (
    !validRoute(
      points,
      plan.attachments.source,
      plan.attachments.target,
      context.obstacles.map((item): Box => item.box),
      plan.wire,
      context.metrics,
    )
  )
    return null;
  const label = labelBox(
    points,
    plan.wire.label,
    [...occupied, ...routeBoxes(points)],
    context.placement.options.labelGap,
  );
  if (label === null) return null;
  return wire(plan, points, label, context);
}
/** Candidate infeasibility consumes one attempt; operational and cancellation failures propagate immediately. */
async function attempt(
  plan: RoutePlan,
  corridor: Corridor,
  occupied: readonly Box[],
  context: WireContext,
): Promise<RoutedWire | null> {
  const placement = {
    ...context.placement,
    options: { ...context.placement.options, routeClearance: plan.clearance },
  };
  const values = await routeNative([corridor.connection], context.obstacles, placement);
  if (values.kind === 'candidate-infeasible') return null;
  const value = values.routes[0];
  if (value === undefined) return reject('engine-failed', plan.wire.id, 'Routing omitted a wire');
  return candidate(plan, value.points, occupied, context);
}
/** Eight local alternatives are inspected and ranked before the one permitted outside attempt. */
async function alternatives(
  plan: RoutePlan,
  occupied: readonly Box[],
  context: WireContext,
): Promise<RoutedWire> {
  const gap = context.placement.options.routeClearance * 2 + context.placement.options.labelGap;
  const candidates = await accumulate<Corridor, readonly RankedRoute[]>(
    localCorridors(plan, gap),
    [],
    async (accepted, corridor): Promise<readonly RankedRoute[]> => {
      const next = await attempt(plan, corridor, occupied, context);
      if (next === null) return accepted;
      return [...accepted, { wire: next, points: next.points, index: corridor.index }];
    },
  );
  const best = candidates.toSorted(compareRoutes)[0];
  if (best !== undefined) return best.wire;
  const outside = await attempt(plan, outsideCorridor(plan, occupied, gap), occupied, context);
  if (outside !== null) return outside;
  return reject(
    'constraint-conflict',
    plan.wire.id,
    'No valid labelled route within the initial, eight local and one outside candidate budget',
    [plan.wire.id],
  );
}
/** Valid manual geometry is retained exactly; label infeasibility never silently discards authored points. */
async function labelled(
  plan: RoutePlan,
  saved: RouteValue | null,
  occupied: readonly Box[],
  context: WireContext,
): Promise<RoutedWire> {
  if (saved !== null) return savedWire(plan, saved, occupied, context);
  const initial = await attempt(
    plan,
    { connection: plan.connection, index: -1 },
    occupied,
    context,
  );
  if (initial !== null) return initial;
  return alternatives(plan, occupied, context);
}
/** An authored route with no clear label or a collision with a prior label has a named correction path. */
function savedWire(
  plan: RoutePlan,
  saved: RouteValue,
  occupied: readonly Box[],
  context: WireContext,
): RoutedWire {
  const result = candidate(plan, saved.points, occupied, context);
  if (result !== null) return result;
  return reject(
    'constraint-conflict',
    plan.wire.id,
    'Manual route has no clear space for its measured label or crosses a reserved label',
    [plan.wire.id],
  );
}
/** Accepted labels constrain later routes; every retained manual path constrains label placement from the start. */
async function labelAll(
  plans: readonly RoutePlan[],
  saved: readonly RouteValue[],
  occupied: readonly Box[],
  context: WireContext,
): Promise<readonly RoutedWire[]> {
  return accumulate<RoutePlan, readonly RoutedWire[]>(
    plans,
    [],
    async (result, plan): Promise<readonly RoutedWire[]> => {
      const current = withPriorLabels(context, result);
      const occupiedSpace = [
        ...occupied,
        ...result.map((item): Box => item.labelBox),
        ...result.flatMap((item): readonly Box[] => routeBoxes(item.points)),
        ...saved.flatMap((item): readonly Box[] => routeBoxes(item.points)),
      ];
      const next = await labelled(
        plan,
        saved.find((item): boolean => item.id === plan.wire.id) ?? null,
        occupiedSpace,
        current,
      );
      return [...result, next];
    },
  );
}
/** Accepted labels become real routing obstacles for subsequent connections. */
function withPriorLabels(context: WireContext, wires: readonly RoutedWire[]): WireContext {
  const labels = wires.map((wire): Obstacle => ({ id: `label:${wire.id}`, box: wire.labelBox }));
  return { ...context, obstacles: [...context.obstacles, ...labels] };
}
/** Exact segment footprints let labelGap protect both sides equally; a positive one-sided box biases labels away from right/bottom. */
function routeBoxes(points: readonly Point[]): readonly Box[] {
  return segments(points).map((segment): Box => ({
    x: Math.min(segment.a.x, segment.b.x),
    y: Math.min(segment.a.y, segment.b.y),
    width: Math.abs(segment.a.x - segment.b.x),
    height: Math.abs(segment.a.y - segment.b.y),
  }));
}
/** Final rounded paths account for all label rectangles, including ones added later in source order. */
function finalPaths(
  wires: readonly RoutedWire[],
  section: VisualSection,
  context: WireContext,
): readonly RoutedWire[] {
  const occupied = [
    ...context.obstacles.map((item): Box => item.box),
    ...wires.map((item): Box => item.labelBox),
  ];
  return wires.map((wire): RoutedWire =>
    finalPath(wire, section, occupied, context.placement.options.routeClearance / 2),
  );
}
/** Orthogonal routes retain their exact polyline; curves round only corners with free labelled space. */
function finalPath(
  wire: RoutedWire,
  section: VisualSection,
  occupied: readonly Box[],
  radius: number,
): RoutedWire {
  const source = section.wires.find((item): boolean => item.id === wire.id);
  if (source?.route.route !== 'curve') return wire;
  return { ...wire, path: curvePath(wire.points, radius, occupied) };
}
/** Parallel ordinal is local to the same ordered visible endpoints and stable in source order. */
function parallel(section: VisualSection, index: number): number {
  const current = section.wires[index];
  return section.wires
    .slice(0, index)
    .filter(
      (item): boolean =>
        item.source.node === current?.source.node && item.target.node === current?.target.node,
    ).length;
}
/** Route fixed nodes and retain manual geometry. Public Layout arrange/route execute catches structured faults; Authoring retains the scene and draft on failure. */
export async function routeWires(
  section: VisualSection,
  nodes: readonly PlacedNode[],
  metrics: SupplementalMeasurements,
  placement: RoutingContext,
): Promise<readonly RoutedWire[]> {
  const context: WireContext = { metrics, placement, obstacles: obstacles(nodes) };
  const plans = section.wires.map((item, index): RoutePlan =>
    plan(item, nodes, metrics, placement, parallel(section, index)),
  );
  const saved = plans.flatMap(
    (item): RouteValue | readonly RouteValue[] => manual(item, context.obstacles, metrics) ?? [],
  );
  const labelled = await labelAll(
    plans,
    saved,
    [...contentBoxes(nodes), ...reserved(plans, context)],
    context,
  );
  return finalPaths(labelled, section, context);
}
