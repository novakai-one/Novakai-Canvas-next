import type {
  PrototypeRoad,
  PrototypeLane,
  PrototypeJunction,
} from '../contract/records/road-prototype.js';
import { axes, intersection } from './prototype-road-geometry.js';

/** Road ownership supplies the index: no lane has to rediscover every junction geometrically. */
export function roadJunctionIndex(junctions: readonly PrototypeJunction[]) {
  const index = new Map<string, PrototypeJunction[]>();
  junctions.forEach((j) => j.roadIds.forEach((id) => index.set(id, [...(index.get(id) ?? []), j])));
  return index;
}
function endpointIndex(roads: readonly PrototypeRoad[], junctions: readonly PrototypeJunction[]) {
  const roadById = new Map(roads.map((r) => [r.id, r]));
  const index = new Map<string, string>();
  junctions.forEach((j) =>
    j.roadIds.forEach((id) => {
      const road = roadById.get(id);
      if (road === undefined) return;
      const a = axes[road.axis],
        box = intersection(road.bounds, j.bounds);
      index.set(`${id}:${box[a.along]}`, j.id);
      index.set(`${id}:${box[a.along] + box[a.length]}`, j.id);
    }),
  );
  return index;
}
function attach(index: Map<string, PrototypeLane[]>, id: string | undefined, lane: PrototypeLane) {
  if (id === undefined) return;
  index.set(id, [...(index.get(id) ?? []), lane]);
}
export function laneAdjacency(
  roads: readonly PrototypeRoad[],
  junctions: readonly PrototypeJunction[],
  lanes: readonly PrototypeLane[],
) {
  const ends = endpointIndex(roads, junctions),
    incoming = new Map<string, PrototypeLane[]>(),
    outgoing = new Map<string, PrototypeLane[]>();
  const axisByRoad = new Map(roads.map((r) => [r.id, axes[r.axis].along]));
  lanes.forEach((l) => {
    const axis = axisByRoad.get(l.roadId) ?? 'x';
    attach(incoming, ends.get(`${l.roadId}:${l.exit[axis]}`), l);
    attach(outgoing, ends.get(`${l.roadId}:${l.entry[axis]}`), l);
  });
  return { incoming, outgoing };
}
