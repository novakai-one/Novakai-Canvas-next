import type { NestedWireLane } from '../contract/records/nested-wires.js';
import type { PrototypePoint, PrototypeNodePort } from '../contract/records/road-prototype.js';
import { nestedLanePitch } from './prototype-nested-placement.js';

/** Center a side's pins in lane order. Pure reconstruction; callers own capacity admission. */
export function terminalPin(
  legacy: PrototypePoint,
  across: 'x' | 'y',
  lane: NestedWireLane,
  count: number,
  fixed = false,
): PrototypePoint {
  if (fixed) return legacy;
  const offset = (lane.index - (count - 1) / 2) * nestedLanePitch * Math.sign(lane.offset);
  return { ...legacy, [across]: legacy[across] + offset };
}

/** Measured markers reserve a normal stem before the first lane change. */
export function terminalStem(port?: Pick<PrototypeNodePort, 'fixed' | 'advance'>): number {
  return port?.fixed ? Math.max(nestedLanePitch, port.advance ?? 0) : 0;
}
export function terminalDepth(
  port: Pick<PrototypeNodePort, 'fixed' | 'advance'>,
  count: number,
): number {
  return terminalStem(port) + Math.max(0, count - 0.75) * nestedLanePitch;
}
