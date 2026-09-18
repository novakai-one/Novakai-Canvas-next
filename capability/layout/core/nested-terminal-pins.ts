import type { NestedWireLane } from '../contract/records/nested-wires.js';
import type { PrototypePoint } from '../contract/records/road-prototype.js';
import { nestedLanePitch } from './prototype-nested-placement.js';

/** Center a side's pins in lane order. Pure reconstruction; callers own capacity admission. */
export function terminalPin(
  legacy: PrototypePoint,
  across: 'x' | 'y',
  lane: NestedWireLane,
  count: number,
): PrototypePoint {
  const offset = (lane.index - (count - 1) / 2) * nestedLanePitch * Math.sign(lane.offset);
  return { ...legacy, [across]: legacy[across] + offset };
}
