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
import { union, pointBounds } from '../geometry/bounds.js';
import { accumulate } from '../arrangement/sequential.js';
import { reject } from '../validation/outcomes.js';
interface WireContext {
  readonly placement: RoutingContext;
  readonly metrics: SupplementalMeasurements;
  readonly obstacles: readonly Obstacle[];
}
/** Marker and accepted label regions are reserved for subsequent labels. */
function reserved(plans: readonly RoutePlan[], context: WireContext): readonly Box[] {
  return plans.flatMap((item) => [
    markerBox(item.attachments.source, context.metrics.markers[item.wire.sourceMarker]),
    markerBox(item.attachments.target, context.metrics.markers[item.wire.targetMarker]),
  ]);
}
/** Native geometry must still satisfy all required attachment and obstacle facts. */
function checkedPoints(
  plan: RoutePlan,
  values: readonly RouteValue[],
  context: WireContext,
): readonly Point[] {
  const value = values.find((item) => item.id === plan.wire.id);
  if (!value) return reject('engine-failed', plan.wire.id, 'Routing omitted a wire');
  if (
    !validRoute(
      value.points,
      plan.attachments.source,
      plan.attachments.target,
      context.obstacles.map((item) => item.box),
      plan.wire,
      context.metrics,
    )
  )
    return reject(
      'engine-failed',
      plan.wire.id,
      'Native route violates required ports, marker clearance or obstacles',
    );
  return value.points;
}
/** Wire rendering retains authoritative label/marker/style data and derives only path geometry. */
function wire(
  plan: RoutePlan,
  points: readonly Point[],
  labelBox: Box,
  context: WireContext,
): RoutedWire {
  const obstacles = context.obstacles.map((item) => item.box);
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
/** If the first corridor has no room for its label, ask the router for a measured outside lane. */
async function labelled(
  plan: RoutePlan,
  points: readonly Point[],
  occupied: readonly Box[],
  context: WireContext,
): Promise<RoutedWire> {
  const label = labelBox(points, plan.wire.label, occupied, context.placement.options.labelGap);
  if (label !== null) return wire(plan, points, label, context);
  if (plan.wire.route.locked)
    return reject(
      'constraint-conflict',
      plan.wire.id,
      'Locked route has no clear space for its measured label',
      [plan.wire.id],
    );
  return outsideLane(plan, occupied, context);
}
/** A bounded deterministic outside lane adds space while maintaining named departure/arrival checkpoints. */
async function outsideLane(
  plan: RoutePlan,
  occupied: readonly Box[],
  context: WireContext,
): Promise<RoutedWire> {
  const bounds = union(occupied);
  const gap = context.placement.options.labelGap + context.placement.options.routeClearance;
  const y = bounds.y - plan.wire.label.height - gap * 2;
  const left = { x: bounds.x - plan.wire.label.width - gap * 2, y };
  const right = { x: bounds.x + bounds.width + gap * 2, y };
  const checkpoints = [
    ...plan.connection.checkpoints.slice(0, 1),
    left,
    right,
    ...plan.connection.checkpoints.slice(1),
  ];
  const values = await routeNative(
    [{ ...plan.connection, checkpoints }],
    context.obstacles,
    context.placement,
  );
  const points = checkedPoints(plan, values, context);
  const label = labelBox(points, plan.wire.label, occupied, context.placement.options.labelGap);
  if (label === null)
    return reject('engine-failed', plan.wire.id, 'No clear measured label corridor found');
  return wire(plan, points, label, context);
}
/** Label placement is sequential because accepted rectangles constrain later wires. */
async function labelAll(
  plans: readonly RoutePlan[],
  values: readonly RouteValue[],
  occupied: readonly Box[],
  context: WireContext,
): Promise<readonly RoutedWire[]> {
  return accumulate<RoutePlan, readonly RoutedWire[]>(plans, [], async (result, plan) => {
    const current = withPriorLabels(context, result);
    const points = await avoidPriorLabels(plan, values, current);
    const corridors = [...result.flatMap((item) => routeBoxes(item.points)), ...routeBoxes(points)];
    const prior = result.map((item) => item.labelBox);
    const occupiedSpace = [
      ...occupied,
      ...prior,
      ...corridors,
      ...values.flatMap((item) => routeBoxes(item.points)),
    ];
    const next = await labelled(plan, points, occupiedSpace, current);
    return [...result, next];
  });
}
/** Accepted labels become real routing obstacles for subsequent connections. */
function withPriorLabels(context: WireContext, wires: readonly RoutedWire[]): WireContext {
  const labels = wires.map((wire) => ({ id: `label:${wire.id}`, box: wire.labelBox }));
  return { ...context, obstacles: [...context.obstacles, ...labels] };
}
/** Thin route footprints stop new labels from obscuring already accepted wire segments. */
function routeBoxes(points: readonly Point[]): readonly Box[] {
  return segments(points).map((segment) => pointBounds([segment.a, segment.b]));
}
/** A precomputed batch corridor may need rerouting after earlier measured labels claim free space. */
async function avoidPriorLabels(
  plan: RoutePlan,
  values: readonly RouteValue[],
  context: WireContext,
): Promise<readonly Point[]> {
  const found = values.find((value) => value.id === plan.wire.id);
  if (
    found &&
    validRoute(
      found.points,
      plan.attachments.source,
      plan.attachments.target,
      context.obstacles.map((item) => item.box),
      plan.wire,
      context.metrics,
    )
  )
    return found.points;
  return rerouteLabelCollision(plan, context);
}
/** Manual locks remain hard even when the collision is with another wire's label. */
async function rerouteLabelCollision(
  plan: RoutePlan,
  context: WireContext,
): Promise<readonly Point[]> {
  if (plan.wire.route.locked)
    return reject('constraint-conflict', plan.wire.id, 'Locked route crosses a reserved label', [
      plan.wire.id,
    ]);
  const values = await routeNative([plan.connection], context.obstacles, context.placement);
  return checkedPoints(plan, values, context);
}
/** Final rounded paths account for all label rectangles, including ones added later in source order. */
function finalPaths(
  wires: readonly RoutedWire[],
  section: VisualSection,
  context: WireContext,
): readonly RoutedWire[] {
  const occupied = [
    ...context.obstacles.map((item) => item.box),
    ...wires.map((item) => item.labelBox),
  ];
  return wires.map((wire) =>
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
  const source = section.wires.find((item) => item.id === wire.id);
  if (source?.route.route !== 'curve') return wire;
  return { ...wire, path: curvePath(wire.points, radius, occupied) };
}
/** Parallel ordinal is local to the same ordered visible endpoints and stable in source order. */
function parallel(section: VisualSection, index: number): number {
  const current = section.wires[index];
  return section.wires
    .slice(0, index)
    .filter(
      (item) =>
        item.source.node === current?.source.node && item.target.node === current?.target.node,
    ).length;
}
/** Arrange no boxes: route fixed section nodes, retaining valid manual geometry and reserving every label. */
export async function routeWires(
  section: VisualSection,
  nodes: readonly PlacedNode[],
  metrics: SupplementalMeasurements,
  placement: RoutingContext,
): Promise<readonly RoutedWire[]> {
  const context: WireContext = { metrics, placement, obstacles: obstacles(nodes) };
  const plans = section.wires.map((item, index) =>
    plan(item, nodes, metrics, placement, parallel(section, index)),
  );
  const saved = plans.flatMap((item) => manual(item, context.obstacles, metrics) ?? []);
  const automatic = plans.filter((item) => !saved.some((route) => route.id === item.wire.id));
  const routed = await routeNative(
    automatic.map((item) => item.connection),
    context.obstacles,
    placement,
  );
  const labelled = await labelAll(
    plans,
    [...saved, ...routed],
    [...contentBoxes(nodes), ...reserved(plans, context)],
    context,
  );
  return finalPaths(labelled, section, context);
}
