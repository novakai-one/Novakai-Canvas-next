/** Rectangular corridors connect owner-provided ports; only gate roads cross section boundaries. */
import type {
  PrototypeBounds,
  PrototypePortLocation,
  PrototypeRoad,
} from '../contract/records/road-prototype.js';
import type { SectionPlacement } from './prototype-nested-placement.js';
import { gridEdges } from './prototype-nested-placement.js';
import { reject } from './nested-support-graph.js';
import { axes } from './prototype-road-geometry.js';
import { readPrototypeNodePorts } from './prototype-road-nodes.js';
export type RoadPitches = Readonly<Record<PrototypeRoad['axis'], number>>;
interface StreetSpan {
  readonly owner: string | null;
  readonly axis: PrototypeRoad['axis'];
  readonly at: number;
  readonly start: number;
  readonly end: number;
  readonly origins: readonly string[];
}
function frame(owner: string | null, b: PrototypeBounds, origin: string): StreetSpan[] {
  return [
    ...[b.y, b.y + b.height].map((at, ordinal) => ({
      owner,
      axis: 'horizontal' as const,
      at,
      start: b.x,
      end: b.x + b.width,
      origins: [`${origin}:horizontal:${ordinal}`],
    })),
    ...[b.x, b.x + b.width].map((at, ordinal) => ({
      owner,
      axis: 'vertical' as const,
      at,
      start: b.y,
      end: b.y + b.height,
      origins: [`${origin}:vertical:${ordinal}`],
    })),
  ];
}
function internalStreets(p: SectionPlacement): StreetSpan[] {
  const { size, interior: b } = p;
  const xEdges = gridEdges(size.columnWidths),
    yEdges = gridEdges(size.rowHeights);
  const ownHeight = yEdges.at(-1)!;
  return [
    ...frame(size.id, b, `${size.id}:frame`),
    ...yEdges.slice(1, -1).map((at, i) => ({
      owner: size.id,
      axis: 'horizontal' as const,
      at: b.y + at,
      start: b.x,
      end: b.x + size.ownWidth,
      origins: [`${size.id}:row:${i}`],
    })),
    ...xEdges.slice(1).map((at, i) => ({
      owner: size.id,
      axis: 'vertical' as const,
      at: b.x + at,
      start: b.y,
      end: b.y + ownHeight,
      origins: [`${size.id}:column:${i}`],
    })),
  ];
}
function mergeSpan(spans: readonly StreetSpan[], next: StreetSpan): readonly StreetSpan[] {
  const last = spans.at(-1);
  if (last === undefined) return [next];
  if (next.start > last.end) return [...spans, next];
  return [
    ...spans.slice(0, -1),
    {
      ...last,
      end: Math.max(last.end, next.end),
      origins: [...last.origins, ...next.origins],
    },
  ];
}
function street(s: StreetSpan, pitches: RoadPitches): PrototypeRoad {
  const half = pitches[s.axis];
  const bounds =
    s.axis === 'horizontal'
      ? { x: s.start - half, y: s.at - half, width: s.end - s.start + 2 * half, height: 2 * half }
      : { x: s.at - half, y: s.start - half, width: 2 * half, height: s.end - s.start + 2 * half };
  return {
    id: `${s.owner ?? 'world'}:${s.axis}:${s.at}:${s.start}`,
    sectionId: s.owner,
    axis: s.axis,
    kind: 'street',
    access: null,
    bounds,
    directions: s.axis === 'horizontal' ? ['left', 'right'] : ['down', 'up'],
  };
}
export function nestedMainRoads(
  placements: readonly SectionPlacement[],
  pitches: RoadPitches,
  retain?: (road: PrototypeRoad, origins: readonly string[]) => void,
): readonly PrototypeRoad[] {
  const spans = [
    ...placements.flatMap((p) =>
      frame(p.section.parentSectionId ?? null, p.surrounding, `${p.section.id}:surrounding`),
    ),
    ...placements.flatMap(internalStreets),
  ];
  const groups = new Map<string, StreetSpan[]>();
  spans.forEach((s) => {
    const key = `${s.owner}:${s.axis}:${s.at}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  });
  return [...groups.values()].flatMap((group) =>
    group
      .toSorted((a, b) => a.start - b.start)
      .reduce<readonly StreetSpan[]>(mergeSpan, [])
      .map((span) => {
        const road = street(span, pitches);
        retain?.(road, span.origins);
        return road;
      }),
  );
}
export function nestedSectionPorts(p: SectionPlacement): readonly PrototypePortLocation[] {
  return readPrototypeNodePorts({
    ...p.section,
    sectionId: p.section.id,
    ports: p.section.ports ?? [],
  });
}
function accessRoad(
  port: PrototypePortLocation,
  start: number,
  end: number,
  pitches: RoadPitches,
): PrototypeRoad {
  const vertical = ['top', 'bottom'].includes(port.side);
  const width = 2 * pitches[vertical ? 'vertical' : 'horizontal'];
  const bounds = vertical
    ? {
        x: port.point.x - width / 2,
        y: start,
        width: width,
        height: end - start,
      }
    : {
        x: start,
        y: port.point.y - width / 2,
        width: end - start,
        height: width,
      };
  return {
    id: `drive:${port.portId}`,
    sectionId: port.sectionId,
    kind: 'driveway',
    bounds,
    ...accessDirection(port),
    access: {
      nodeId: port.nodeId,
      portId: port.portId,
      side: port.side,
      role: port.role,
      ...(port.fixed === undefined ? {} : { fixed: port.fixed }),
      ...(port.advance === undefined ? {} : { advance: port.advance }),
    },
  };
}
/** A moved node connects to the nearest admitted road on its authored side. */
function nodeDrive(
  port: PrototypePortLocation,
  roads: readonly PrototypeRoad[],
  pitches: RoadPitches,
): PrototypeRoad {
  const vertical = ['top', 'bottom'].includes(port.side);
  const a = axes[vertical ? 'vertical' : 'horizontal'];
  const sign = ['top', 'left'].includes(port.side) ? -1 : 1;
  const candidates = roads.filter((road) => {
    const b = road.bounds;
    return (
      road.sectionId === port.sectionId &&
      road.axis !== (vertical ? 'vertical' : 'horizontal') &&
      port.point[a.across] >= b[a.across] &&
      port.point[a.across] <= b[a.across] + b[a.breadth] &&
      sign * (b[a.along] + b[a.length] / 2 - port.point[a.along]) > b[a.length] / 2
    );
  });
  const street = candidates.toSorted(
    (left, right) =>
      Math.abs(left.bounds[a.along] + left.bounds[a.length] / 2 - port.point[a.along]) -
      Math.abs(right.bounds[a.along] + right.bounds[a.length] / 2 - port.point[a.along]),
  )[0];
  if (street === undefined) return reject('missing-contact', [port.nodeId, port.portId]);
  const edge = street.bounds[a.along] + (sign < 0 ? street.bounds[a.length] : 0);
  return accessRoad(
    port,
    Math.min(port.point[a.along], edge),
    Math.max(port.point[a.along], edge),
    pitches,
  );
}
function sectionDrive(
  port: PrototypePortLocation,
  p: SectionPlacement,
  pitches: RoadPitches,
): PrototypeRoad {
  const half = pitches[['top', 'bottom'].includes(port.side) ? 'horizontal' : 'vertical'];
  const a = p.surrounding,
    b = p.interior;
  const intervals = {
    top: [a.y + half, b.y - half],
    left: [a.x + half, b.x - half],
    bottom: [b.y + b.height + half, a.y + a.height - half],
    right: [b.x + b.width + half, a.x + a.width - half],
  };
  const [start = 0, end = 0] = intervals[port.side];
  return accessRoad(port, start, end, pitches);
}
export function nestedDriveways(
  p: SectionPlacement,
  roads: readonly PrototypeRoad[],
  pitches: RoadPitches,
): readonly PrototypeRoad[] {
  return [
    ...p.nodes.flatMap((node) =>
      readPrototypeNodePorts(node).map((port) => nodeDrive(port, roads, pitches)),
    ),
    ...nestedSectionPorts(p).map((port) => sectionDrive(port, p, pitches)),
  ];
}

function accessDirection(port: PrototypePortLocation): Pick<PrototypeRoad, 'axis' | 'directions'> {
  const outward = { top: 'up', bottom: 'down', left: 'left', right: 'right' } as const;
  const inward = { top: 'down', bottom: 'up', left: 'right', right: 'left' } as const;
  const direction = port.role === 'exit' ? outward[port.side] : inward[port.side];
  const axis = ['top', 'bottom'].includes(port.side) ? 'vertical' : 'horizontal';
  return { axis, directions: [direction] };
}

/** Interior grid crossings are emitted with the grid, not discovered by pairing roads. */
export function nestedCrossings(placements: readonly SectionPlacement[]) {
  return placements.flatMap((p) =>
    gridEdges(p.size.rowHeights)
      .slice(1, -1)
      .flatMap((y) =>
        gridEdges(p.size.columnWidths).map((x) => ({ x: p.interior.x + x, y: p.interior.y + y })),
      ),
  );
}
