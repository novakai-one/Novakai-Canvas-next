import type {
  PrototypeBounds,
  PrototypeNode,
  PrototypeNodePort,
  PrototypePortLocation,
} from '../contract/records/road-prototype.js';

/** Caller-measured node dimensions; the engine never decides node size. */
export type PrototypeNodeSize = Pick<PrototypeBounds, 'width' | 'height'>;
/** Node-owned footprint and port offsets. No road geometry is accepted by this module. */
function portDefinitions(bounds: PrototypeBounds): readonly Omit<PrototypeNodePort, 'id'>[] {
  return [
    { side: 'top', role: 'entry', offset: { x: bounds.width / 2, y: 0 } },
    { side: 'left', role: 'entry', offset: { x: 0, y: bounds.height / 2 } },
    { side: 'bottom', role: 'exit', offset: { x: bounds.width / 2, y: bounds.height } },
    { side: 'right', role: 'exit', offset: { x: bounds.width, y: bounds.height / 2 } },
  ];
}
export function placePrototypeNode(
  sectionId: string,
  index: number,
  bounds: PrototypeBounds,
): PrototypeNode {
  const id = `node-${index + 1}`;
  return {
    id,
    sectionId,
    label: `Node ${index + 1}`,
    bounds: { ...bounds },
    ports: portDefinitions(bounds).map((port) => ({
      ...port,
      offset: { ...port.offset },
      id: `${id}:${port.role}-${port.side}`,
    })),
  };
}
/** Read world-space attachment points from the node; callers cannot prescribe port positions. */
export function readPrototypeNodePorts(node: PrototypeNode): readonly PrototypePortLocation[] {
  return node.ports.map((port) => ({
    nodeId: node.id,
    sectionId: node.sectionId,
    portId: port.id,
    role: port.role,
    side: port.side,
    point: { x: node.bounds.x + port.offset.x, y: node.bounds.y + port.offset.y },
  }));
}
