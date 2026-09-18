import type {
  PrototypeNode,
  PrototypePoint,
  PrototypeNodePort,
  PrototypePortLocation,
} from '../contract/records/road-prototype.js';

/** Node-owned footprint and port offsets. No road geometry is accepted by this module. */
export const prototypeNodeSize = { width: 192, height: 96 } as const;
const portDefinitions: readonly Omit<PrototypeNodePort, 'id'>[] = [
  { side: 'top', role: 'entry', offset: { x: 96, y: 0 } },
  { side: 'left', role: 'entry', offset: { x: 0, y: 48 } },
  { side: 'bottom', role: 'exit', offset: { x: 96, y: 96 } },
  { side: 'right', role: 'exit', offset: { x: 192, y: 48 } },
];
export function placePrototypeNode(
  sectionId: string,
  index: number,
  position: PrototypePoint,
): PrototypeNode {
  const id = `node-${index + 1}`;
  return {
    id,
    sectionId,
    label: `Node ${index + 1}`,
    bounds: { ...position, ...prototypeNodeSize },
    ports: portDefinitions.map((port) => ({
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
