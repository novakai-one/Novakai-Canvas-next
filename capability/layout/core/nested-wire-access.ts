import type {
  PrototypeBlock,
  PrototypePoint,
  PrototypePortSide,
  PrototypeRoad,
} from '../contract/records/road-prototype.js';
import type { WireRegistry } from './nested-wire-registry.js';
export interface Access {
  readonly portId: string;
  readonly side: PrototypePortSide;
  readonly port: PrototypePoint;
  readonly mouth: PrototypePoint;
  readonly join: PrototypePoint;
  readonly roadId: string;
  readonly drive: PrototypeRoad;
}
export interface Terminal {
  readonly point: PrototypePoint;
  readonly accesses: readonly Access[];
}
export function center(block: PrototypeBlock): PrototypePoint {
  return {
    x: block.bounds.x + block.bounds.width / 2,
    y: block.bounds.y + block.bounds.height / 2,
  };
}

export function access(
  registry: WireRegistry,
  portId: string,
  owner: string | null,
): Access | undefined {
  return registry.accesses.get(`${portId}:${owner}`);
}
export function nodeTerminal(
  registry: WireRegistry,
  id: string,
  role: 'entry' | 'exit',
): Terminal | undefined {
  return registry.terminals.get(`${id}:${role}`);
}
export function gateTerminal(value: Access): Terminal {
  return { point: value.port, accesses: [value] };
}
