import type { PrototypePoint, PrototypePortSide } from '../contract/records/road-prototype.js';
import type { NestedWireSegment } from '../contract/records/nested-wires.js';
import type { Access, Terminal } from './nested-wire-access.js';
import type { WireRegistry, Crossing } from './nested-wire-registry.js';
import { coverPath } from './nested-wire-corridors.js';
import type { OwnedLine } from './nested-wire-corridors.js';
type Pair = readonly [PrototypePortSide, PrototypePortSide];
export interface Leg {
  readonly source: Access;
  readonly target: Access;
  readonly segments: readonly NestedWireSegment[];
}
function sameRoad(
  s: Terminal,
  t: Terminal,
  out: PrototypePortSide,
  input: PrototypePortSide,
): boolean {
  const a = s.accesses.find((p) => p.side === out),
    b = t.accesses.find((p) => p.side === input);
  return a !== undefined && a.roadId === b?.roadId;
}
/** Band law, then shared-road law, then the quadrant corner. There is no path search. */
function pair(s: Terminal, t: Terminal): Pair {
  const bands: readonly { readonly matches: boolean; readonly value: Pair }[] = [
    { matches: s.point.y === t.point.y, value: ['right', 'left'] },
    { matches: s.point.x === t.point.x, value: ['bottom', 'top'] },
    { matches: sameRoad(s, t, 'right', 'left'), value: ['right', 'left'] },
    { matches: sameRoad(s, t, 'bottom', 'top'), value: ['bottom', 'top'] },
  ];
  return bands.find((rule) => rule.matches)?.value ?? quadrant(s, t);
}
function quadrant(s: Terminal, t: Terminal): Pair {
  return s.point.x < t.point.x ? ['right', 'top'] : ['bottom', 'left'];
}

function shifted(a: Access, offset: number): PrototypePoint {
  return a.drive.axis === 'horizontal'
    ? { x: a.join.x + offset, y: a.join.y }
    : { x: a.join.x, y: a.join.y + offset };
}
function line(from: PrototypePoint, to: PrototypePoint, roadId: string): OwnedLine {
  return { from, to, roadId };
}
function highway(a: Access, b: Access, registry: WireRegistry): Crossing | undefined {
  const destination = new Set((registry.crossings.get(b.roadId) ?? []).map((c) => c.roadId));
  const coordinate = a.drive.axis === 'horizontal' ? 'y' : 'x';
  const candidates = (registry.crossings.get(a.roadId) ?? []).filter((c) =>
    destination.has(c.roadId),
  );
  // Every candidate is an actual shared crossing. Minimum Manhattan detour preserves the pair law.
  return candidates
    .map((c) => ({
      crossing: c,
      length: Math.abs(c.at - a.join[coordinate]) + Math.abs(c.at - b.join[coordinate]),
    }))
    .toSorted((x, y) => x.length - y.length)[0]?.crossing;
}
function trunk(
  a: Access,
  b: Access,
  registry: WireRegistry,
  offset: number,
): readonly OwnedLine[] | null {
  const p = shifted(a, offset),
    q = shifted(b, offset);
  if (a.roadId === b.roadId)
    return [line(a.mouth, p, a.roadId), line(p, q, a.roadId), line(q, b.mouth, b.roadId)];
  return turns(a, b, p, q, registry, offset);
}
function turns(
  a: Access,
  b: Access,
  p: PrototypePoint,
  q: PrototypePoint,
  registry: WireRegistry,
  offset: number,
): readonly OwnedLine[] | null {
  if (a.drive.axis !== b.drive.axis) return corner(a, b, p, q, registry);
  const crossing = highway(a, b, registry);
  if (crossing === undefined) return null;
  return crossingLines(a, b, p, q, crossing, offset);
}
function crossingLines(
  a: Access,
  b: Access,
  p: PrototypePoint,
  q: PrototypePoint,
  crossing: Crossing,
  offset: number,
): readonly OwnedLine[] {
  const at = crossing.at + offset;
  const first = a.drive.axis === 'horizontal' ? { x: p.x, y: at } : { x: at, y: p.y };
  const last = a.drive.axis === 'horizontal' ? { x: q.x, y: at } : { x: at, y: q.y };
  return [
    line(a.mouth, p, a.roadId),
    line(p, first, a.roadId),
    line(first, last, crossing.roadId),
    line(last, q, b.roadId),
    line(q, b.mouth, b.roadId),
  ];
}
function corner(
  a: Access,
  b: Access,
  p: PrototypePoint,
  q: PrototypePoint,
  registry: WireRegistry,
): readonly OwnedLine[] | null {
  if (!(registry.crossings.get(a.roadId) ?? []).some((c) => c.roadId === b.roadId)) return null;
  const point = a.side === 'right' ? { x: p.x, y: q.y } : { x: q.x, y: p.y };
  return [
    line(a.mouth, p, a.roadId),
    line(p, point, a.roadId),
    line(point, q, b.roadId),
    line(q, b.mouth, b.roadId),
  ];
}
/** Fixed gate accesses obey the unchanged band → shared road → quadrant law. */
export function lawLeg(
  s: Terminal,
  t: Terminal,
  registry: WireRegistry,
  offset: number,
): Leg | null {
  const [out, input] = pair(s, t);
  const source = s.accesses.find((p) => p.side === out),
    target = t.accesses.find((p) => p.side === input);
  if (source === undefined || target === undefined) return null;
  return completeLeg(source, target, registry, offset);
}
function completeLeg(
  source: Access,
  target: Access,
  registry: WireRegistry,
  offset: number,
): Leg | null {
  const middle = trunk(source, target, registry, offset);
  if (middle === null) return null;
  const segments = coverPath(
    [
      line(source.port, source.mouth, source.drive.id),
      ...middle,
      line(target.mouth, target.port, target.drive.id),
    ],
    registry.roads,
  );
  if (segments === null) return null;
  return { source, target, segments };
}
