import type { PlacedNode, Box } from '../../contract/records/geometry.js';
import type { Obstacle } from '../../contract/records/problem.js';
/** Container interiors are available to their children; only their measured title/content footprint blocks connections. */
export function nodeObstacle(node: PlacedNode): Obstacle {
  if (node.measured.groupId === null) return { id: node.id, box: node.box };
  return {
    id: node.id,
    box: {
      ...node.box,
      width: Math.min(node.box.width, node.measured.width),
      height: node.measured.headerHeight,
    },
  };
}
/** Wire routing treats complete ordinary content and container headers as obstacles. */
export function obstacles(nodes: readonly PlacedNode[]): readonly Obstacle[] {
  return nodes.map(nodeObstacle);
}
/** Content footprints exclude group borders so legitimate entering/exiting wires remain routable. */
export function contentBoxes(nodes: readonly PlacedNode[]): readonly Box[] {
  return obstacles(nodes).map((item): Box => item.box);
}

/** Labels avoid all painted group borders at every depth; interiors remain free.
 * Placement and independent inspection consume these boxes; Layout retains the prior scene on rejection. */
export function labelObstacles(nodes: readonly PlacedNode[]): readonly Box[] {
  return [...contentBoxes(nodes), ...nodes.flatMap(groupBorders)];
}
/** Four stroke-width strips cover the complete border, including its outward painted half. */
function groupBorders(node: PlacedNode): readonly Box[] {
  if (node.measured.groupId === null || node.measured.frame === 'none') return [];
  const { x, y, width, height } = node.box;
  const stroke = node.measured.strokeWidth;
  const half = stroke / 2;
  return [
    { x: x - half, y: y - half, width: width + stroke, height: stroke },
    { x: x - half, y: y + height - half, width: width + stroke, height: stroke },
    { x: x - half, y: y - half, width: stroke, height: height + stroke },
    { x: x + width - half, y: y - half, width: stroke, height: height + stroke },
  ];
}
