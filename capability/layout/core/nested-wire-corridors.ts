import type { PrototypePoint, PrototypeRoad } from '../contract/records/road-prototype.js';
import type { NestedWireSegment } from '../contract/records/nested-wires.js';

export interface OwnedLine {
  readonly from: PrototypePoint;
  readonly to: PrototypePoint;
  readonly roadId: string;
}
function segment(
  line: OwnedLine,
  roads: ReadonlyMap<string, PrototypeRoad>,
): readonly NestedWireSegment[] | null {
  const road = roads.get(line.roadId);
  if (road === undefined) return null;
  if (equal(line.from, line.to)) return [];
  return [{ from: line.from, to: line.to, corridorId: road.id }];
}
/** Junctions and mouths certify endpoint ownership at construction; each segment reads its own road.
 * Callers may join only registered crossings and must stay within the reserved street track width.
 */
export function coverPath(
  lines: readonly OwnedLine[],
  roads: ReadonlyMap<string, PrototypeRoad>,
): readonly NestedWireSegment[] | null {
  const segments = lines.map((line) => segment(line, roads));
  if (segments.includes(null)) return null;
  return segments.flatMap((part) => part ?? []);
}

function equal(a: PrototypePoint, b: PrototypePoint): boolean {
  return a.x === b.x && a.y === b.y;
}
