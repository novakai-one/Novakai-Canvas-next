import type {
  PrototypeNode,
  PrototypePoint,
  PrototypePortLocation,
} from '../contract/records/road-prototype.js';
import type { NestedNodeSpec } from '../contract/records/nested-scene-spec.js';

/** Measurements belong to Presentation. Routing may translate, never resize, a node. */
export function measuredNode(spec: { readonly measured?: NestedNodeSpec['measured'] }) {
  const measured = spec.measured;
  if (measured === undefined) throw new Error('Node measurements are required');
  if (![measured.width, measured.height].every((size) => Number.isFinite(size) && size > 0))
    throw new RangeError('Node measurements must be finite and positive');
  return measured;
}
export function placePrototypeNode(
  sectionId: string,
  index: number,
  position: PrototypePoint,
  input?: NestedNodeSpec['measured'],
): PrototypeNode {
  const measured = measuredNode({ measured: input });
  return {
    id: `node-${index + 1}`,
    sectionId,
    label: `Node ${index + 1}`,
    bounds: { ...position, width: measured.width, height: measured.height },
    ports: measured.ports,
  };
}
/** Read world-space attachment points without changing owner-supplied offsets. */
export function readPrototypeNodePorts(node: PrototypeNode): readonly PrototypePortLocation[] {
  return node.ports.map((port) => ({
    nodeId: node.id,
    sectionId: node.sectionId,
    portId: port.id,
    role: port.role,
    side: port.side,
    ...(port.fixed === undefined ? {} : { fixed: port.fixed }),
    ...(port.advance === undefined ? {} : { advance: port.advance }),
    point: { x: node.bounds.x + port.offset.x, y: node.bounds.y + port.offset.y },
  }));
}
