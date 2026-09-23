import type { Box, PlacedNode, RoutedWire } from '../../contract/records/geometry.js';
import { labelBox } from './labels.js';
import { contentBoxes, labelObstacles } from './obstacles.js';
/** Clear spot first; then clear of nodes only; then the plain midpoint rather than dropping the label. */
function place(
  wire: RoutedWire,
  taken: readonly Box[],
  nodes: readonly Box[],
  gap: number,
): Box | null {
  return (
    labelBox(wire.points, wire.measuredLabel, taken, gap) ??
    labelBox(wire.points, wire.measuredLabel, nodes, gap) ??
    labelBox(wire.points, wire.measuredLabel, [], gap)
  );
}
/** Hidden labels reserve no space during routing; this finds where each would read clearly if shown. */
export function hiddenLabelBoxes(
  wires: readonly RoutedWire[],
  nodes: readonly PlacedNode[],
  gap = 4,
): ReadonlyMap<string, Box> {
  const bodies = contentBoxes(nodes);
  const taken: Box[] = [
    ...labelObstacles(nodes),
    ...wires.filter((wire) => wire.labelVisible !== false).map((wire) => wire.labelBox),
  ];
  const placed = new Map<string, Box>();
  wires
    .filter((wire) => wire.labelVisible === false)
    .forEach((wire) => {
      const box = place(wire, taken, bodies, gap);
      if (box === null) return;
      placed.set(wire.id, box);
      taken.push(box);
    });
  return placed;
}
