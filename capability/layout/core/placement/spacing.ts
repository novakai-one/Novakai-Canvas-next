import type { VisualSection, VisualWire } from '../../contract/records/input.js';
import type { PlacementProblem } from '../../contract/records/problem.js';
import type { SupplementalMeasurements, LayoutOptions } from '../../contract/types.js';

/** Automatic seeds reserve the measured label and both marker approaches between connected branches.
 * Semantic gap is a minimum; explicit positions and hard constraints remain authoritative afterward.
 */
export function routingGap(
  section: VisualSection,
  edges: PlacementProblem['edges'],
  measurements: SupplementalMeasurements,
  options: LayoutOptions,
): number {
  const connected = new Set(edges.map((edge) => edge.id));
  const wires = section.wires.filter((wire) => connected.has(wire.id));
  return Math.max(0, ...wires.map((wire) => corridorWidth(wire, measurements, options)));
}

/** Reserving the larger label axis also supports nested scopes whose reading direction differs. */
function corridorWidth(
  wire: VisualWire,
  measurements: SupplementalMeasurements,
  options: LayoutOptions,
): number {
  const source = measurements.markers[wire.sourceMarker].advance;
  const target = measurements.markers[wire.targetMarker].advance;
  const label = Math.max(wire.label.width, wire.label.height);
  return source + target + options.routeClearance * 4 + label + options.labelGap * 2;
}
