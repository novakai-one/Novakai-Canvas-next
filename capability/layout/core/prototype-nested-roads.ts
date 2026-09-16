/** Rectangular corridors connect owner-provided ports; only gate roads cross section boundaries. */
import type {
  PrototypeBounds,
  PrototypePortLocation,
  PrototypeRoad,
} from '../contract/records/road-prototype.js';
import type { SectionPlacement } from './prototype-nested-placement.js';
import { nestedSpacing } from './prototype-nested-placement.js';
import { readPrototypeNodePorts } from './prototype-road-nodes.js';
const half = nestedSpacing.road / 2;
interface StreetSpan {
  readonly owner: string | null;
  readonly axis: PrototypeRoad['axis'];
  readonly at: number;
  readonly start: number;
  readonly end: number;
}
function frame(owner: string | null, b: PrototypeBounds): StreetSpan[] {
  return [
    ...[b.y, b.y + b.height].map((at) => ({
      owner,
      axis: 'horizontal' as const,
      at,
      start: b.x,
      end: b.x + b.width,
    })),
    ...[b.x, b.x + b.width].map((at) => ({
      owner,
      axis: 'vertical' as const,
      at,
      start: b.y,
      end: b.y + b.height,
    })),
  ];
}
function internalStreets(p: SectionPlacement): StreetSpan[] {
  const { size, interior: b } = p;
  return [
    ...frame(size.id, b),
    ...Array.from({ length: size.rows - 1 }, (_, i) => ({
      owner: size.id,
      axis: 'horizontal' as const,
      at: b.y + ((i + 1) * b.height) / size.rows,
      start: b.x,
      end: b.x + size.ownWidth,
    })),
    ...Array.from({ length: size.columns }, (_, i) => ({
      owner: size.id,
      axis: 'vertical' as const,
      at: b.x + ((i + 1) * size.ownWidth) / size.columns,
      start: b.y,
      end: b.y + b.height,
    })),
    ...childBoundaries(p),
  ];
}
function childBoundaries(p: SectionPlacement): StreetSpan[] {
  let x = p.interior.x + p.size.ownWidth;
  return p.size.children.map((child) => {
    x += child.width + nestedSpacing.clearance * 2;
    return {
      owner: p.size.id,
      axis: 'vertical',
      at: x,
      start: p.interior.y,
      end: p.interior.y + p.interior.height,
    };
  });
}
function mergeSpan(spans: readonly StreetSpan[], next: StreetSpan): readonly StreetSpan[] {
  const last = spans.at(-1);
  if (last === undefined) return [next];
  if (next.start > last.end) return [...spans, next];
  return [...spans.slice(0, -1), { ...last, end: Math.max(last.end, next.end) }];
}
function street(s: StreetSpan): PrototypeRoad {
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
export function nestedMainRoads(placements: readonly SectionPlacement[]): readonly PrototypeRoad[] {
  const spans = [
    ...placements
      .filter((p) => p.section.parentSectionId === null)
      .flatMap((p) => frame(null, p.surrounding)),
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
      .map(street),
  );
}
export function nestedSectionPorts(p: SectionPlacement): readonly PrototypePortLocation[] {
  return readPrototypeNodePorts({
    ...p.section,
    sectionId: p.section.id,
    ports: p.section.ports ?? [],
  });
}
function accessRoad(port: PrototypePortLocation, start: number, end: number): PrototypeRoad {
  const vertical = ['top', 'bottom'].includes(port.side);
  const bounds = vertical
    ? {
        x: port.point.x - nestedSpacing.driveway / 2,
        y: start,
        width: nestedSpacing.driveway,
        height: end - start,
      }
    : {
        x: start,
        y: port.point.y - nestedSpacing.driveway / 2,
        width: end - start,
        height: nestedSpacing.driveway,
      };
  return {
    id: `drive:${port.portId}`,
    sectionId: port.sectionId,
    kind: 'driveway',
    bounds,
    ...accessDirection(vertical),
    access: { nodeId: port.nodeId, portId: port.portId, side: port.side, role: port.role },
  };
}
function nodeDrive(port: PrototypePortLocation, cell: PrototypeBounds): PrototypeRoad {
  const intervals = {
    top: [cell.y + half, port.point.y],
    left: [cell.x + half, port.point.x],
    bottom: [port.point.y, cell.y + cell.height - half],
    right: [port.point.x, cell.x + cell.width - half],
  };
  const [start = 0, end = 0] = intervals[port.side];
  return accessRoad(port, start, end);
}
function sectionDrive(port: PrototypePortLocation, p: SectionPlacement): PrototypeRoad {
  const a = p.surrounding,
    b = p.interior;
  const intervals = {
    top: [a.y + half, b.y - half],
    left: [a.x + half, b.x - half],
    bottom: [b.y + b.height + half, a.y + a.height - half],
    right: [b.x + b.width + half, a.x + a.width - half],
  };
  const [start = 0, end = 0] = intervals[port.side];
  return accessRoad(port, start, end);
}
export function nestedDriveways(p: SectionPlacement): readonly PrototypeRoad[] {
  const width = p.size.ownWidth / p.size.columns,
    height = p.interior.height / p.size.rows;
  return [
    ...p.nodes.flatMap((node, i) => {
      const cell = {
        x: p.interior.x + (i % p.size.columns) * width,
        y: p.interior.y + Math.floor(i / p.size.columns) * height,
        width,
        height,
      };
      return readPrototypeNodePorts(node).map((port) => nodeDrive(port, cell));
    }),
    ...nestedSectionPorts(p).map((port) => sectionDrive(port, p)),
  ];
}

function accessDirection(vertical: boolean): Pick<PrototypeRoad, 'axis' | 'directions'> {
  if (vertical) return { axis: 'vertical', directions: ['down'] };
  return { axis: 'horizontal', directions: ['right'] };
}

/** Interior grid crossings are emitted with the grid, not discovered by pairing roads. */
export function nestedCrossings(placements: readonly SectionPlacement[]) {
  return placements.flatMap((p) =>
    Array.from({ length: p.size.rows - 1 }, (_, row) =>
      Array.from({ length: p.size.columns + 1 }, (_, column) => ({
        x: p.interior.x + (column * p.size.ownWidth) / p.size.columns,
        y: p.interior.y + ((row + 1) * p.interior.height) / p.size.rows,
      })),
    ).flat(),
  );
}
