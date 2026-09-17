/** Content-first sizing, then one top-down placement pass. No road or DOM feedback. */
import type {
  PrototypeBlock,
  PrototypeBounds,
  PrototypeNode,
} from '../contract/records/road-prototype.js';
import { placePrototypeNode, prototypeNodeSize } from './prototype-road-nodes.js';

export const nestedSpacing = { road: 48, driveway: 24, clearance: 72, side: 64, top: 112 } as const;
export const nestedLanePitch = 6;
/** Symmetric capacity reserves both traffic sides; reconstruction is pure and retry-safe. */
export function nestedLaneWidth(lanes: number): number {
  return nestedLanePitch * 2 + lanes * nestedLanePitch * 2;
}
const clearancePair = nestedSpacing.clearance * 2;
const horizontalPadding = nestedSpacing.side * 2;
const verticalPadding = nestedSpacing.top + nestedSpacing.side;
const pitch = {
  x: prototypeNodeSize.width + clearancePair,
  y: prototypeNodeSize.height + clearancePair,
};
import type {
  NestedNodeSpec as NodeSpec,
  NestedSectionSpec as SectionSpec,
} from '../contract/records/nested-scene-spec.js';
export interface SizedSection {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly nodes: readonly NodeSpec[];
  readonly total: number;
  readonly columns: number;
  readonly rows: number;
  readonly ownWidth: number;
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
  // A degenerate spec has no content to size; the caller owns correction and reconstruction.
  if (spec.nodes.length + spec.children.length === 0)
    throw new RangeError('Nested sections require at least one node or child section');
  const count = spec.nodes.length;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = count === 0 ? 0 : Math.ceil(count / columns);
  const children = spec.children.map(sizeSection);
  const ownWidth = columns * pitch.x;
  return {
    id: `section-${spec.number}`,
    label: `Section ${spec.number}`,
    count,
    nodes: spec.nodes,
    total: count + children.reduce((sum, child) => sum + child.total, 0),
    columns,
    rows,
    ownWidth,
    children,
    width:
      ownWidth +
      children.reduce((sum, child) => sum + child.width + clearancePair, 0) +
      horizontalPadding,
    height:
      Math.max(rows * pitch.y, ...children.map((child) => child.height + clearancePair)) +
      verticalPadding,
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
/** Reject content-free sections with RangeError; callers correct the semantic spec and rebuild. */
export function sizeNestedSections(specs: readonly SectionSpec[]): readonly Row[] {
  const sizes = specs.map(sizeSection);
  const area = sizes.reduce(
    (sum, s) => sum + (s.width + clearancePair) * (s.height + clearancePair),
    0,
  );
  const limit = Math.max(Math.sqrt(area * 1.5), ...sizes.map((s) => s.width + clearancePair));
  return sizes.reduce<readonly Row[]>((rows, size) => appendRow(rows, size, limit), []);
}
function sectionPorts(id: string, bounds: PrototypeBounds) {
  return [
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
}
function gridNodes(size: SizedSection, interior: PrototypeBounds) {
  if (size.count === 0) return [];
  const rowHeight = interior.height / size.rows;
  return size.nodes.map((node, i) => ({
    ...placePrototypeNode(size.id, node.number - 1, {
      x: interior.x + (i % size.columns) * pitch.x + (pitch.x - prototypeNodeSize.width) / 2,
      y:
        interior.y +
        Math.floor(i / size.columns) * rowHeight +
        (rowHeight - prototypeNodeSize.height) / 2,
    }),
    label: node.label,
  }));
}
function positionSection(
  size: SizedSection,
  surrounding: PrototypeBounds,
  parentSectionId: string | null,
): readonly SectionPlacement[] {
  const bounds = {
    x: surrounding.x + (surrounding.width - size.width) / 2,
    y: surrounding.y + (surrounding.height - size.height) / 2,
    width: size.width,
    height: size.height,
  };
  const interior = {
    x: bounds.x + nestedSpacing.side,
    y: bounds.y + nestedSpacing.top,
    width: bounds.width - horizontalPadding,
    height: bounds.height - verticalPadding,
  };
  const section = {
    id: size.id,
    label: size.label,
    bounds,
    parentSectionId,
    description: sectionDescription(size),
    ports: sectionPorts(size.id, bounds),
  };
  const own = { section, size, surrounding, interior, nodes: gridNodes(size, interior) };
  let x = interior.x + size.ownWidth;
  const children = size.children.flatMap((child) => {
    const box = { x, y: interior.y, width: child.width + clearancePair, height: interior.height };
    x += box.width;
    const placed = positionSection(child, box, size.id);
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
): readonly SectionPlacement[] {
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
      const placed = positionSection(size, box, null);
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
