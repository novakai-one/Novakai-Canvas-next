import type { VisualSection, VisualWire } from '../../contract/records/input.js';
import type { PlacementProblem } from '../../contract/records/problem.js';
import type { SupplementalMeasurements, LayoutOptions } from '../../contract/types.js';

/** Automatic seeds reserve the measured label and both marker approaches between connected branches.
 * Semantic gap is a minimum; explicit positions and hard constraints remain authoritative afterward.
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
