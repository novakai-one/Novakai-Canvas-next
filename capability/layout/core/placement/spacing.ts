import type {
  LayoutIntent,
  VisualNode,
  VisualSection,
  VisualWire,
} from '../../contract/records/input.js';
import type { LinearConstraint, PlacementProblem } from '../../contract/records/problem.js';
import type { SupplementalMeasurements, LayoutOptions } from '../../contract/types.js';

import { relative } from '../constraints/relative.js';
import { scopeEdges } from './scope-edges.js';

/** Automatic seeds reserve the measured label and both marker approaches between connected branches.
 * Semantic gap is a minimum; explicit positions and hard constraints remain authoritative afterward.
 * Pure replay is safe; Layout reports invalid input and Authoring retains the scene on failure.
 */
export function routingGap(
  section: VisualSection,
  edges: PlacementProblem['edges'],
  direction: VisualSection['layout']['direction'],
  measurements: SupplementalMeasurements,
  options: LayoutOptions,
): number {
  const wires = localWires(section, edges);
  return Math.max(0, ...wires.map((wire) => corridorWidth(wire, direction, measurements, options)));
}

/** Flow-axis reservation does not inflate the independent cross-axis sibling minimum. */
function corridorWidth(
  wire: VisualWire,
  direction: VisualSection['layout']['direction'],
  measurements: SupplementalMeasurements,
  options: LayoutOptions,
): number {
  const source = measurements.markers[wire.sourceMarker].advance;
  const target = measurements.markers[wire.targetMarker].advance;
  const label =
    direction === 'right' || direction === 'left' ? wire.label.width : wire.label.height;
  return source + target + options.routeClearance * 4 + label + options.labelGap * 2;
}

/** Current native checkpoints extend 2c + advance; another c keeps them outside adjacent obstacles.
 * Only wires joining this scope's branches contribute; labels never affect this cross-axis floor.
 * Pure replay has no recovery state; Layout's facade owns failures from invalid measurements.
 */
export function crossingGap(
  section: VisualSection,
  edges: PlacementProblem['edges'],
  measurements: SupplementalMeasurements,
  options: LayoutOptions,
): number {
  const advances = localWires(section, edges).flatMap((wire) => [
    measurements.markers[wire.sourceMarker].advance,
    measurements.markers[wire.targetMarker].advance,
  ]);
  if (advances.length === 0) return 0;
  return options.routeClearance * 3 + Math.max(...advances);
}
/** Local wire membership is independent of the parent-only graph used for tree ranking. */
function localWires(
  section: VisualSection,
  edges: PlacementProblem['edges'],
): readonly VisualWire[] {
  const connected = new Set(edges.map((edge) => edge.id));
  return section.wires.filter((wire) => connected.has(wire.id));
}

/** Preserve measured corridors when authored rank alignment moves automatic seeds.
 * Preferences are soft: locks and semantic equations remain authoritative. Layout returns
 * typed arrangement failures; Authoring retains the prior scene and owns recovery.
 */
export function routingPreferences(
  section: VisualSection,
  measurements: SupplementalMeasurements,
  options: LayoutOptions,
): readonly LinearConstraint[] {
  const scopes = [
    { id: section.id, layout: section.layout, parent: null },
    ...section.groups.map((group) => ({
      id: group.id,
      layout: group.layout,
      parent: section.nodes.find((node) => node.groupId === group.id)?.id ?? null,
    })),
  ];
  return scopes.flatMap((scope) => preferredScope(section, scope, measurements, options));
}
/** Cross-boundary descendants reserve room between their owning sibling branches; internal edges stay local. */
function preferredScope(
  section: VisualSection,
  scope: { readonly id: string; readonly layout: LayoutIntent; readonly parent: string | null },
  measurements: SupplementalMeasurements,
  options: LayoutOptions,
): readonly LinearConstraint[] {
  const nodes = section.nodes.filter((node) => node.parent === scope.parent);
  const edges = scopeEdges(
    nodes.map((node): string => node.id),
    section,
  );
  const gap = routingGap(section, edges, scope.layout.direction, measurements, options);
  if (gap <= options.gap[scope.layout.gap]) return [];
  const layout = {
    ...scope.layout,
    constraints: scope.layout.constraints.filter(
      (constraint) => constraint.kind === 'rank' || constraint.kind === 'before',
    ),
  };
  return relative(layout, section.nodes, gap, `${scope.id}:routing-preference`).map(
    (constraint): LinearConstraint => ({ ...constraint, strength: 'strong' }),
  );
}

/** Container trailing padding leaves a measured caption beside a straight child connection,
 * including its gap from the painted border. This is a seed preference, never a changed lock.
 * Pure replay is safe; Layout's arrangement boundary reports failure and Authoring owns recovery.
 */
export function labelPadding(
  group: VisualNode,
  section: VisualSection,
  options: LayoutOptions,
): { readonly width: number; readonly height: number } {
  const children = section.nodes.filter((node) => node.parent === group.id);
  const ids = new Set(children.map((node) => node.id));
  const wires = section.wires.filter(
    (wire) => ids.has(wire.source.node) && ids.has(wire.target.node),
  );
  const direction = section.groups.find((item) => item.id === group.groupId)?.layout.direction;
  const horizontal = direction === 'left' || direction === 'right';
  const extent = horizontal ? 'height' : 'width';
  const reserve = Math.max(
    options.padding,
    ...wires.map((wire) => wire.label[extent] + options.labelGap * 2 + group.strokeWidth / 2),
  );
  const halfNode = Math.min(Infinity, ...children.map((node) => node[extent] / 2));
  const padding = Math.max(options.padding, reserve - halfNode);
  if (horizontal) return { width: options.padding, height: padding };
  return { width: padding, height: options.padding };
}
