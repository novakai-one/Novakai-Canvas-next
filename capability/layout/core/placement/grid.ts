import type { LayoutIntent } from '../../contract/records/input.js';
import type { PlacementNode, PlacementValue } from '../../contract/records/problem.js';
interface Cell {
  readonly column: number;
  readonly row: number;
}
interface Tracks {
  readonly widths: readonly number[];
  readonly heights: readonly number[];
}
/** Each row and column reserves its own largest member; one tall diagram cannot inflate every row in a collection. */
export function gridPlacement(
  nodes: readonly PlacementNode[],
  columns: number,
  gap: number,
  direction: LayoutIntent['direction'],
): readonly PlacementValue[] {
  const cells = nodes.map((_, index) => cell(index, columns, direction));
  const tracks = measureTracks(nodes, cells);
  return nodes.map((node, index) =>
    place(node, cells[index] ?? { column: 0, row: 0 }, tracks, gap, direction),
  );
}
/** Down/up transpose row-major reading order; reverse directions preserve negative logical coordinates. */
function cell(index: number, columns: number, direction: LayoutIntent['direction']): Cell {
  const column = index % columns;
  const row = Math.floor(index / columns);
  if (direction === 'down' || direction === 'up') return { column: row, row: column };
  return { column, row };
}
/** Track extents are derived only from measured members assigned to that track. */
function measureTracks(nodes: readonly PlacementNode[], cells: readonly Cell[]): Tracks {
  return {
    widths: trackSizes(nodes, cells, 'column', 'width'),
    heights: trackSizes(nodes, cells, 'row', 'height'),
  };
}
/** Empty input yields no tracks; no invented cell dimensions enter the scene. */
function trackSizes(
  nodes: readonly PlacementNode[],
  cells: readonly Cell[],
  axis: keyof Cell,
  size: 'width' | 'height',
): readonly number[] {
  const count = Math.max(-1, ...cells.map((item) => item[axis])) + 1;
  return Array.from({ length: count }, (_, track) =>
    Math.max(
      0,
      ...nodes.filter((_, index) => cells[index]?.[axis] === track).map((node) => node[size]),
    ),
  );
}
/** A track begins after the preceding measured extents and the explicit gap between them. */
function offset(sizes: readonly number[], index: number, gap: number): number {
  return sizes.slice(0, index).reduce((sum, size) => sum + size, 0) + index * gap;
}
/** Reverse tracks align their trailing edge at the same origin; unequal boxes remain nonoverlapping. */
function place(
  node: PlacementNode,
  cell: Cell,
  tracks: Tracks,
  gap: number,
  direction: LayoutIntent['direction'],
): PlacementValue {
  const x = offset(tracks.widths, cell.column, gap);
  const y = offset(tracks.heights, cell.row, gap);
  return {
    id: node.id,
    box: {
      x: direction === 'left' ? -x - node.width : x,
      y: direction === 'up' ? -y - node.height : y,
      width: node.width,
      height: node.height,
    },
  };
}
