import type { PrototypeJunction, PrototypeBounds } from '../contract/records/road-prototype.js';
import { intersection, hasArea } from './prototype-road-geometry.js';

function union(a: PrototypeBounds, b: PrototypeBounds): PrototypeBounds {
  const x = Math.min(a.x, b.x),
    y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}
function joined(a: PrototypeJunction, b: PrototypeJunction): PrototypeJunction {
  return {
    ...a,
    id: `${a.id}|${b.id}`,
    bounds: union(a.bounds, b.bounds),
    roadIds: [...new Set([...a.roadIds, ...b.roadIds])],
  };
}
function insert(
  items: readonly PrototypeJunction[],
  next: PrototypeJunction,
): readonly PrototypeJunction[] {
  const match = items.find((item) => hasArea(intersection(item.bounds, next.bounds)));
  if (match === undefined) return [...items, next];
  return insert(
    items.filter((item) => item !== match),
    joined(match, next),
  );
}
/** A shared driveway mouth is one junction. Coverage auditing rejects any non-rectangular expansion. */
export function mergePrototypeJunctions(
  items: readonly PrototypeJunction[],
): readonly PrototypeJunction[] {
  return items.reduce<readonly PrototypeJunction[]>(insert, []);
}
