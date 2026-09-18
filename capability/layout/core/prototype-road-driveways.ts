import type {
  PrototypePortLocation,
  PrototypeRoad,
  PrototypeBounds,
} from '../contract/records/road-prototype.js';

const geometry = {
  top: { axis: 'vertical', direction: 'down', bounds: vertical },
  bottom: { axis: 'vertical', direction: 'down', bounds: vertical },
  left: { axis: 'horizontal', direction: 'right', bounds: horizontal },
  right: { axis: 'horizontal', direction: 'right', bounds: horizontal },
} as const;
const streetForSide = {
  top: 'horizontal-0',
  bottom: 'horizontal-1',
  left: 'vertical-0',
  right: 'vertical-1',
};
function vertical(
  port: PrototypePortLocation,
  street: PrototypeRoad,
  width: number,
): PrototypeBounds {
  const edge = port.side === 'top' ? street.bounds.y + street.bounds.height : street.bounds.y;
  return {
    x: port.point.x - width / 2,
    y: Math.min(edge, port.point.y),
    width,
    height: Math.abs(port.point.y - edge),
  };
}
function horizontal(
  port: PrototypePortLocation,
  street: PrototypeRoad,
  width: number,
): PrototypeBounds {
  const edge = port.side === 'left' ? street.bounds.x + street.bounds.width : street.bounds.x;
  return {
    x: Math.min(edge, port.point.x),
    y: port.point.y - width / 2,
    width: Math.abs(port.point.x - edge),
    height: width,
  };
}
/** A driveway reads a node-owned port and a finished street edge; it never moves either owner. */
function driveway(
  port: PrototypePortLocation,
  roads: readonly PrototypeRoad[],
  width: number,
): PrototypeRoad {
  const street = roads.find(
    (road) => road.id === `${port.sectionId}-street-${streetForSide[port.side]}`,
  );
  if (street === undefined) throw new Error(`Missing street for port ${port.portId}`);
  const adapter = geometry[port.side];
  return {
    id: `${port.sectionId}-${port.role}-${port.side}`,
    sectionId: port.sectionId,
    kind: 'driveway',
    axis: adapter.axis,
    directions: [adapter.direction],
    access: { nodeId: port.nodeId, portId: port.portId, role: port.role, side: port.side },
    bounds: adapter.bounds(port, street, width),
  };
}
export function attachPrototypeDriveways(
  ports: readonly PrototypePortLocation[],
  roads: readonly PrototypeRoad[],
  width: number,
): readonly PrototypeRoad[] {
  return ports.map((port) => driveway(port, roads, width));
}
