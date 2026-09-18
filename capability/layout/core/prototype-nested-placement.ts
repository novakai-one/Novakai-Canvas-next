/** Content-first sizing, then one top-down placement pass. No road or DOM feedback. */
import type {
  PrototypeBlock,
  PrototypeBounds,
  PrototypeNode,
  PrototypeNodePort,
} from '../contract/records/road-prototype.js';
import { placePrototypeNode, measuredNode } from './prototype-road-nodes.js';

export const nestedSpacing = { road: 48, driveway: 24, clearance: 72, side: 64, top: 112 } as const;
export const nestedLanePitch = 6;
/** Symmetric capacity reserves both traffic sides; reconstruction is pure and retry-safe. */
export function nestedLaneWidth(lanes: number, pitch = nestedLanePitch): number {
  return pitch * 2 + lanes * pitch * 2;
}
const clearancePair = nestedSpacing.clearance * 2;
import type {
  NestedNodeSpec as NodeSpec,
  NestedSectionSpec as SectionSpec,
} from '../contract/records/nested-scene-spec.js';
export interface SizedSection {
  readonly id: string;
  readonly measured?: SectionSpec['measured'];
  readonly label: string;
  readonly count: number;
  readonly nodes: readonly NodeSpec[];
  readonly total: number;
  readonly columns: number;
  readonly rows: number;
  readonly ownWidth: number;
  readonly pitch: { readonly x: number; readonly y: number };
  readonly columnWidths: readonly number[];
  readonly rowHeights: readonly number[];
  readonly width: number;
  readonly height: number;
  readonly children: readonly SizedSection[];
}
export interface SectionPlacement {
  readonly section: PrototypeBlock;
  readonly size: SizedSection;
  readonly interior: PrototypeBounds;
  readonly surrounding: PrototypeBounds;
  readonly nodes: readonly PrototypeNode[];
}
interface Row {
  readonly items: readonly SizedSection[];
  readonly width: number;
  readonly height: number;
}
function sizeSection(spec: SectionSpec): SizedSection {
  // Empty leaves retain the section header and padding without synthesizing content.
  const count = spec.nodes.length;
  const measured = spec.measured;
  if (measured === undefined) throw new Error('Presentation must supply a section envelope');
  const columns = measured.columns;
  const rows = count === 0 ? 0 : Math.ceil(count / columns);
  const children = spec.children.map(sizeSection);
  const pitch = measured.pitch;
  const ownWidth = measured.columnWidths.reduce((sum, width) => sum + width, 0);
  return {
    measured,
    id: `section-${spec.number}`,
    label: `Section ${spec.number}`,
    count,
    nodes: spec.nodes,
    total: count + children.reduce((sum, child) => sum + child.total, 0),
    columns,
    rows,
    ownWidth,
    pitch,
    columnWidths: measured.columnWidths,
    rowHeights: measured.rowHeights,
    children,
    width: measured.width,
    height: measured.height,
  };
}
function appendRow(rows: readonly Row[], size: SizedSection, limit: number): readonly Row[] {
  const cellWidth = size.width + clearancePair;
  const last = rows.at(-1);
  if (last === undefined)
    return [{ items: [size], width: cellWidth, height: size.height + clearancePair }];
  if (last.width + cellWidth > limit)
    return [...rows, { items: [size], width: cellWidth, height: size.height + clearancePair }];
  return [
    ...rows.slice(0, -1),
    {
      items: [...last.items, size],
      width: last.width + cellWidth,
      height: Math.max(last.height, size.height + clearancePair),
    },
  ];
}
/** Empty leaves use header/padding bounds; pure reconstruction is caller-owned and retry-safe. */
export function sizeNestedSections(specs: readonly SectionSpec[]): readonly Row[] {
  const sizes = specs.map(sizeSection);
  const area = sizes.reduce(
    (sum, s) => sum + (s.width + clearancePair) * (s.height + clearancePair),
    0,
  );
  const limit = Math.max(Math.sqrt(area * 1.5), ...sizes.map((s) => s.width + clearancePair));
  return sizes.reduce<readonly Row[]>((rows, size) => appendRow(rows, size, limit), []);
}
function sectionPorts(id: string, bounds: PrototypeBounds, inPortsLeft: boolean) {
  const current = [
    { side: 'top' as const, role: 'entry' as const, offset: { x: bounds.width / 2, y: 0 } },
    { side: 'left' as const, role: 'entry' as const, offset: { x: 0, y: bounds.height / 2 } },
    {
      side: 'bottom' as const,
      role: 'exit' as const,
      offset: { x: bounds.width / 2, y: bounds.height },
    },
    {
      side: 'right' as const,
      role: 'exit' as const,
      offset: { x: bounds.width, y: bounds.height / 2 },
    },
  ].map((port) => ({ ...port, id: `${id}:${port.role}-${port.side}` }));
  return inPortsLeft ? current.map((port) => leftEntrance(port, bounds)) : current;
}
/** Two separate mouths preserve both entrance identities in the evaluation variant. */
function leftEntrance(port: PrototypeNodePort, bounds: PrototypeBounds): PrototypeNodePort {
  if (port.role !== 'entry') return port;
  const fraction = port.side === 'top' ? 1 / 3 : 2 / 3;
  return { ...port, side: 'left', offset: { x: 0, y: bounds.height * fraction } };
}
function gridNodes(size: SizedSection, interior: PrototypeBounds) {
  if (size.count === 0) return [];
  const xEdges = gridEdges(size.columnWidths);
  const yEdges = gridEdges(size.rowHeights);
  return size.nodes.map((node, i) => {
    const measured = measuredNode(node);
    const column = i % size.columns,
      row = Math.floor(i / size.columns);
    const cellWidth = size.columnWidths[column]!,
      rowHeight = size.rowHeights[row]!;
    return {
      ...placePrototypeNode(
        size.id,
        node.number - 1,
        {
          x:
            interior.x +
            xEdges[column]! +
            (size.measured?.columnCenters[column] ?? cellWidth / 2) -
            measured.width / 2,
          y:
            interior.y +
            yEdges[row]! +
            (size.measured?.rowCenters[row] ?? rowHeight / 2) -
            measured.height / 2,
        },
        measured,
      ),
      label: node.label,
    };
  });
}
function positionSection(
  size: SizedSection,
  surrounding: PrototypeBounds,
  parentSectionId: string | null,
  inPortsLeft: boolean,
): readonly SectionPlacement[] {
  const bounds = {
    x: surrounding.x + (surrounding.width - size.width) / 2,
    y: surrounding.y + (surrounding.height - size.height) / 2,
    width: size.width,
    height: size.height,
  };
  const interior = {
    x: bounds.x + (size.measured?.gap ?? 0) / 2,
    y: bounds.y + (size.measured?.header ?? 0),
    width: bounds.width - (size.measured?.gap ?? 0),
    height: bounds.height - (size.measured?.header ?? 0) - (size.measured?.gap ?? 0) / 2,
  };
  const section = {
    id: size.id,
    label: size.label,
    bounds,
    parentSectionId,
    description: sectionDescription(size),
    ports: sectionPorts(size.id, bounds, inPortsLeft),
  };
  const nodes = gridNodes(size, interior).map((node, i) => {
    const position = size.nodes[i]?.position;
    return position === undefined
      ? node
      : { ...node, bounds: { ...node.bounds, x: bounds.x + position.x, y: bounds.y + position.y } };
  });
  const own = { section, size, surrounding, interior, nodes };
  const columns = size.measured?.childColumns ?? 1;
  const gap = size.measured?.gap ?? 0;
  const rows = Array.from({ length: Math.ceil(size.children.length / columns) }, (_, i) =>
    size.children.slice(i * columns, (i + 1) * columns),
  );
  let y = interior.y;
  const children = rows.flatMap((row) => {
    const height = Math.max(...row.map((child) => child.height + gap));
    let x = interior.x + size.ownWidth;
    const placed = row.flatMap((child) => {
      const width = child.width + gap;
      const result = positionSection(child, { x, y, width, height }, size.id, inPortsLeft);
      x += width;
      return result;
    });
    y += height;
    return placed;
  });
  return [own, ...children];
}
function sectionDescription(size: SizedSection): string {
  if (size.children.length === 0)
    return `${size.count} nodes · ${size.columns} × ${size.rows} grid`;
  return `${size.count} direct + ${size.total - size.count} nested = ${size.total} nodes`;
}
export function positionNestedSections(
  original: readonly Row[],
  copies = 1,
  inPortsLeft = false,
): readonly SectionPlacement[] {
  if (original.length === 1 && original[0]?.items.length === 1 && copies === 1) {
    const size = original[0].items[0]!;
    return positionSection(
      size,
      { x: 0, y: 0, width: size.width, height: size.height },
      null,
      inPortsLeft,
    );
  }
  const nodeStride = Math.max(...original.flatMap((row) => row.items.flatMap(nodeNumbers)));
  const sectionStride = Math.max(...original.flatMap((row) => row.items.flatMap(sectionNumbers)));
  const rows = Array.from({ length: copies }, (_, copy) =>
    original.map((row) => ({
      ...row,
      items: row.items.map((s) => numbered(s, copy * nodeStride, copy * sectionStride)),
    })),
  ).flat();
  const width = Math.max(...rows.map((row) => row.width));
  let y: number = nestedSpacing.side;
  return rows.flatMap((row) => {
    let x: number = nestedSpacing.side;
    const extra = (width - row.width) / row.items.length;
    const result = row.items.flatMap((size) => {
      const box = { x, y, width: size.width + clearancePair + extra, height: row.height };
      const placed = positionSection(size, box, null, inPortsLeft);
      x += box.width;
      return placed;
    });
    y += row.height;
    return result;
  });
}

function numbered(size: SizedSection, nodeOffset: number, sectionOffset: number): SizedSection {
  const number = Number(size.id.slice('section-'.length)) + sectionOffset;
  return {
    ...size,
    id: `section-${number}`,
    label: `Section ${number}`,
    nodes: size.nodes.map((node) => ({ ...node, number: node.number + nodeOffset })),
    children: size.children.map((child) => numbered(child, nodeOffset, sectionOffset)),
  };
}

function nodeNumbers(size: SizedSection): readonly number[] {
  return [...size.nodes.map((node) => node.number), ...size.children.flatMap(nodeNumbers)];
}
function sectionNumbers(size: SizedSection): readonly number[] {
  return [Number(size.id.slice('section-'.length)), ...size.children.flatMap(sectionNumbers)];
}

/** Cumulative owner-supplied cells define placement and the exact shared street axes. */
export function gridEdges(sizes: readonly number[]): readonly number[] {
  return sizes.reduce<readonly number[]>((edges, size) => [...edges, edges.at(-1)! + size], [0]);
}
