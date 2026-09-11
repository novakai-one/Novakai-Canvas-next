import type { PlacedNode, Box } from '../../contract/records/geometry.js';
import type { Obstacle } from '../../contract/records/problem.js';
/** Container interiors are available to their children; only their measured headers block connections. */
export function nodeObstacle(node: PlacedNode): Obstacle {
  if (node.measured.groupId === null) return { id: node.id, box: node.box };
  return { id: node.id, box: { ...node.box, height: node.measured.headerHeight } };
}
/** Wire routing treats complete ordinary content and container headers as obstacles. */
export function obstacles(nodes: readonly PlacedNode[]): readonly Obstacle[] {
  return nodes.map(nodeObstacle);
}
/** Labels must also avoid container headers but may sit in free group interiors. */
export function contentBoxes(nodes: readonly PlacedNode[]): readonly Box[] {
  return obstacles(nodes).map((item) => item.box);
}
