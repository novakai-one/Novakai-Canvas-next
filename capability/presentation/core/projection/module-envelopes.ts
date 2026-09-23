import { markerMeasurements } from '../notation/markers.js';
import type {
  VisualNode,
  VisualSection,
  VisualWire,
  ModuleEnvelope,
} from '../../contract/records/visual.js';
import type { ResolvedStyle } from '../../contract/records/style.js';
type EnvelopeContext = { readonly style: ResolvedStyle };

/** Presentation owns container footprints before any routing runs. Reserves are based on
 * measured content and connection density, never on a router's calculated geometry. */
export function moduleEnvelopes(section: VisualSection, context: EnvelopeContext): VisualSection {
  if (section.mode !== 'modules') return section;
  const annotated = { ...section, wires: annotationOwners(section.wires) };
  const measured = new Map<string, VisualNode>();
  const envelope = measure(null, annotated, context, measured);
  return {
    ...annotated,
    envelope,
    nodes: section.nodes.map((node) => measured.get(node.id) ?? node),
  };
}
/** Reserve at each immediate boundary only; a child's internal links consume its own space. */
function density(
  members: readonly VisualNode[],
  all: readonly VisualNode[],
  wires: readonly VisualWire[],
): { perimeter: number; local: number } {
  const owners = new Map<string, string>();
  members.forEach((member) =>
    descendants([member], all).forEach((node) => owners.set(node.id, member.id)),
  );
  const counts = new Map<string, number>();
  let perimeter = 0;
  wires.forEach((wire) => {
    const from = owners.get(wire.source.node),
      to = owners.get(wire.target.node);
    if (from === to) return;
    perimeter += 1;
    if (from !== undefined) counts.set(`${from}:out`, (counts.get(`${from}:out`) ?? 0) + 1);
    if (to !== undefined) counts.set(`${to}:in`, (counts.get(`${to}:in`) ?? 0) + 1);
  });
  return { perimeter, local: Math.max(0, ...counts.values()) };
}
function measure(
  parent: VisualNode | null,
  section: VisualSection,
  context: EnvelopeContext,
  measured: Map<string, VisualNode>,
): ModuleEnvelope {
  const members = section.nodes.filter((node) => node.parent === (parent?.id ?? null));
  const leaves = members.filter((node) => node.groupId === null);
  const groups = members.filter((node) => node.groupId !== null);
  const children = groups.map((node) => {
    const envelope = measure(node, section, context, measured);
    measured.set(node.id, { ...node, width: envelope.width, height: envelope.height, envelope });
    return envelope;
  });
  const padding = context.style.padding;
  const labels = section.wires
    .filter((wire) => wire.labelVisible !== false)
    .map((wire) => wire.label);
  // Parallel strokes need their own ink width as clearance; label whitespace stays independent.
  const stroke = Math.max(
    context.style.connection.width,
    ...section.wires.map((wire) => wire.appearance.width),
  );
  const lanePitch = Math.max(stroke * 2, context.style.gap / 2);
  const markers = markerMeasurements();
  const advance = Math.max(
    0,
    ...section.wires.flatMap((wire) => [
      markers[wire.sourceMarker].advance,
      markers[wire.targetMarker].advance,
    ]),
  );
  const annotationGap = context.style.gap;
  const terminalPitch = Math.max(
    lanePitch * 2,
    ...labels.map((label) => label.height + annotationGap * 2),
  );
  const traffic = density(members, section.nodes, section.wires);
  const gap = trafficGap(traffic.perimeter, lanePitch, padding);
  const header = Math.ceil((parent?.headerHeight ?? section.title.height + padding * 2) + gap / 2);
  const footprints = leaves.map((node) =>
    nodeFootprint(node, section.wires, lanePitch, annotationGap, advance),
  );
  const cellGap = trafficGap(traffic.local, lanePitch, padding);
  // Each child reserves its own boundary population. Shared-road feasibility is admitted by Layout.
  const childCells = children.map((child, index) => {
    const boundary = density([groups[index]!], section.nodes, section.wires);
    const clearance = trafficGap(boundary.local, lanePitch, padding);
    return {
      width: child.width + clearance,
      height: child.height + clearance,
    };
  });
  const own = section.groups.find((group) => group.id === parent?.groupId)?.layout;
  // A group follows its section's direction unless it names another one ('right' is the default).
  const intent =
    own === undefined
      ? section.layout
      : { ...own, direction: own.direction === 'right' ? section.layout.direction : own.direction };
  const leafGrid = dependencyGrid(leaves, section, intent);
  const nested = dependencyGrid(groups, section, intent);
  const columns = leafGrid.columns;
  const childColumns = nested.columns;
  const horizontal = tracks(leaves, footprints, leafGrid, 'x', cellGap, gap / 2);
  const vertical = tracks(leaves, footprints, leafGrid, 'y', cellGap, header);
  const columnWidths = horizontal.sizes;
  const rowHeights = vertical.sizes;
  const pitch = { x: Math.max(gap, ...columnWidths), y: Math.max(gap, ...rowHeights) };
  const column = (index: number) => (nested.cells[index] ?? index) % childColumns;
  const row = (index: number) => Math.floor((nested.cells[index] ?? index) / childColumns);
  const childColumnWidths = Array.from({ length: gridSize(nested).columns }, (_, track) =>
    Math.max(0, ...childCells.filter((_, index) => column(index) === track).map((c) => c.width)),
  );
  const childRowHeights = Array.from({ length: gridSize(nested).rows }, (_, track) =>
    Math.max(0, ...childCells.filter((_, index) => row(index) === track).map((c) => c.height)),
  );
  const childWidth = childColumnWidths.reduce((sum, width) => sum + width, 0);
  const childHeight = childRowHeights.reduce((sum, height) => sum + height, 0);
  const ownWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const ownHeight = rowHeights.reduce((sum, height) => sum + height, 0);
  const pinned = leaves.filter((node) => node.placement !== null);
  const manualWidth = Math.max(
    0,
    ...pinned.map(
      (node) => node.placement!.x + Math.max(node.width, node.placement!.width ?? 0) + gap,
    ),
  );
  const manualHeight = Math.max(
    0,
    ...pinned.map(
      (node) => node.placement!.y + Math.max(node.height, node.placement!.height ?? 0) + gap,
    ),
  );
  const childInsets = children.map((child, index) => ({
    x: Math.min(gap / 2, ((childColumnWidths[column(index)] ?? 0) - child.width) / 2),
    y: ((childRowHeights[row(index)] ?? 0) - child.height) / 2,
  }));
  const childX = edges(childColumnWidths);
  const childY = edges(childRowHeights);
  const rects = groups.map((node, index) => ({
    node,
    pinned: node.placement !== null,
    x:
      node.placement?.x ??
      gap / 2 + ownWidth + (childX[column(index)] ?? 0) + (childInsets[index]?.x ?? 0),
    y: node.placement?.y ?? header + (childY[row(index)] ?? 0) + (childInsets[index]?.y ?? 0),
    width: children[index]?.width ?? 0,
    height: children[index]?.height ?? 0,
  }));
  const cells: ChildGrid = {
    column,
    row,
    starts: { x: childX, y: childY },
    sizes: { x: childColumnWidths, y: childRowHeights },
    insets: childInsets,
    ownWidth,
    header,
    gap,
  };
  const settled = allPlaced(members);
  const bounded = settled
    ? settledFloors(rects, gap)
    : rects.map((rect, index) => ({ ...rect, ...gridFloor(cells, index) }));
  const reach = pushPinned(bounded, measured);
  const authored = parent === null ? section.placement : parent.placement;
  const need = settled
    ? {
        manual: settledReach(authored, placedReach(leaves, footprints, (cellGap + gap) / 2), {
          width: manualWidth,
          height: manualHeight,
        }),
        grid: {
          width: farEdge(bounded, cells, 'x'),
          height: farEdge(bounded, cells, 'y') + gap / 2,
        },
      }
    : {
        manual: { width: manualWidth, height: manualHeight },
        grid: {
          width: ownWidth + childWidth,
          height: Math.max(ownHeight, childHeight) + header + gap / 2,
        },
      };
  // An authored size still grows to hold a child moved past its right or bottom edge.
  return {
    width: Math.max(
      need.manual.width,
      reach.right + gap / 2,
      authored?.width ??
        Math.max(parent?.content.width ?? section.title.width, need.grid.width) + gap,
    ),
    height: Math.max(
      need.manual.height,
      reach.bottom + gap / 2,
      authored?.height ?? need.grid.height,
    ),
    header,
    gap,
    lanePitch,
    annotationGap,
    terminalPitch,
    columns,
    childColumns,
    cells: leafGrid.cells,
    childCells: nested.cells,
    childColumnWidths,
    childRowHeights,
    // Start-align columns within the parent reserve while preserving shared row centres.
    childInsets,
    pitch,
    columnWidths,
    rowHeights,
    columnCenters: horizontal.centers,
    rowCenters: vertical.centers,
  };
}

interface Grid {
  readonly columns: number;
  /** Row-major cell of each member, in member order. */
  readonly cells: readonly number[];
}
function gridSize(grid: Grid): { readonly columns: number; readonly rows: number } {
  const used = Math.max(0, ...grid.cells.map((cell) => cell + 1));
  return { columns: Math.min(grid.columns, used), rows: Math.ceil(used / grid.columns) };
}

type Link = readonly [number, number];
/** Members that depend on each other line up with the section direction: each wire's source sits
 * before its target (left of it for right, above it for down). Otherwise members fill a
 * near-square grid in their own order. */
function dependencyGrid(
  members: readonly VisualNode[],
  section: VisualSection,
  intent: VisualSection['layout'],
): Grid {
  const square = Math.ceil(Math.sqrt(members.length));
  const plain = {
    columns: Math.max(1, Math.min(members.length || 1, intent.columns ?? square)),
    cells: members.map((_, index) => index),
  };
  if (allPlaced(members)) return placedGrid(members);
  if (keepsOrder(members, section, intent)) return plain;
  const links = memberLinks(members, section);
  return links.length === 0 ? plain : layeredGrid(layerOf(members.length, links), intent.direction);
}
/** Every member placed by hand: columns and rows follow where the members stand, so roads run between them. */
function placedGrid(members: readonly VisualNode[]): Grid {
  const column = bands(members, 'x');
  const row = bands(members, 'y');
  const columns = Math.max(0, ...column) + 1;
  return {
    columns,
    cells: members.map((_, index) => (row[index] ?? 0) * columns + (column[index] ?? 0)),
  };
}
/** Band of each member along an axis: members whose spans overlap share a band. */
function bands(members: readonly VisualNode[], axis: 'x' | 'y'): readonly number[] {
  const size = SPAN[axis].size;
  const spans = members
    .map((node, index) => {
      const start = node.placement?.[axis] ?? 0;
      return { index, start, end: start + Math.max(node[size], node.placement?.[size] ?? 0) };
    })
    .toSorted((a, b) => a.start - b.start);
  const band = members.map(() => 0);
  spans.reduce(
    (open, span) => {
      const next = joined(open, span);
      band[span.index] = next.band;
      return next;
    },
    { band: -1, end: -Infinity },
  );
  return band;
}
/** A span that starts past the open band's end opens the next band; otherwise it widens this one. */
function joined(
  open: { readonly band: number; readonly end: number },
  span: { readonly start: number; readonly end: number },
): { readonly band: number; readonly end: number } {
  return span.start >= open.end
    ? { band: open.band + 1, end: span.end }
    : { band: open.band, end: Math.max(open.end, span.end) };
}
/** Authored columns or a hand-placed member: keep the human's arrangement, don't reshuffle. */
function keepsOrder(
  members: readonly VisualNode[],
  section: VisualSection,
  intent: VisualSection['layout'],
): boolean {
  const placed = descendants(members, section.nodes).some((node) => node.placement !== null);
  return placed || intent.columns !== undefined;
}
/** Wires between different members, as member indexes; a wire inside one member is ignored. */
function memberLinks(members: readonly VisualNode[], section: VisualSection): readonly Link[] {
  const owner = new Map<string, number>();
  members.forEach((member, index) =>
    descendants([member], section.nodes).forEach((node) => owner.set(node.id, index)),
  );
  return section.wires.flatMap((wire) =>
    link(owner.get(wire.source.node), owner.get(wire.target.node)),
  );
}
function link(from: number | undefined, to: number | undefined): readonly Link[] {
  return from === undefined || to === undefined || from === to ? [] : [[from, to]];
}
const STACKED = new Set(['down', 'up']);
const REVERSED = new Set(['left', 'up']);
/** Layer runs along the direction; members of one layer sit side by side across it. */
function layeredGrid(layers: readonly number[], direction: string): Grid {
  const depth = Math.max(...layers) + 1;
  const order = layers.map((_, index) => index);
  const across = Array.from({ length: depth }, (_, layer) =>
    order.filter((index) => layers[index] === layer),
  );
  const position = (index: number) => across[layers[index] ?? 0]?.indexOf(index) ?? 0;
  const flip = REVERSED.has(direction) ? depth - 1 : 0;
  const step = (index: number) => Math.abs(flip - (layers[index] ?? 0));
  const width = Math.max(...across.map((layer) => layer.length));
  return STACKED.has(direction)
    ? { columns: width, cells: order.map((index) => step(index) * width + position(index)) }
    : { columns: depth, cells: order.map((index) => position(index) * depth + step(index)) };
}
/** Longest path from members nothing points at. A cycle is broken at its first member. */
function layerOf(count: number, links: readonly Link[]): readonly number[] {
  const layers = Array.from({ length: count }, () => 0);
  const placed = new Set<number>();
  layers.forEach(() => placeNext(layers, placed, links));
  return layers;
}
/** Place every member whose sources are all placed; with none ready, place the first open one. */
function placeNext(layers: number[], placed: Set<number>, links: readonly Link[]): void {
  const open = layers.map((_, index) => index).filter((index) => !placed.has(index));
  const ready = open.filter((index) => links.every((l) => waitsOn(l, index, placed)));
  const next = ready.length > 0 ? ready : open.slice(0, 1);
  next.forEach((index) => {
    const before = links.filter(([from, to]) => to === index && placed.has(from));
    layers[index] = Math.max(0, ...before.map(([from]) => (layers[from] ?? 0) + 1));
  });
  next.forEach((index) => placed.add(index));
}
function waitsOn([from, to]: Link, index: number, placed: ReadonlySet<number>): boolean {
  return to !== index || from === index || placed.has(from);
}

/** Running totals: where each grid column (row) starts. */
function edges(sizes: readonly number[]): readonly number[] {
  return sizes.reduce<readonly number[]>((all, size) => [...all, (all.at(-1) ?? 0) + size], [0]);
}

/** A pinned group left of (or above) the road beside its grid cell moves past it.
 * Returns the far edges of pinned groups so the parent grows to hold them. */
function pushPinned(
  rects: readonly {
    readonly node: VisualNode;
    readonly pinned: boolean;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly minX: number;
    readonly minY: number;
  }[],
  measured: Map<string, VisualNode>,
): { readonly right: number; readonly bottom: number } {
  const pinned = rects
    .filter((rect) => rect.pinned)
    .map((rect) => ({ ...rect, x: Math.max(rect.x, rect.minX), y: Math.max(rect.y, rect.minY) }));
  pinned.forEach((rect) => {
    const node = measured.get(rect.node.id) ?? rect.node;
    const placement = node.placement;
    if (placement === null || (rect.x === placement.x && rect.y === placement.y)) return;
    measured.set(rect.node.id, { ...node, placement: { ...placement, x: rect.x, y: rect.y } });
  });
  return {
    right: Math.max(0, ...pinned.map((rect) => rect.x + rect.width)),
    bottom: Math.max(0, ...pinned.map((rect) => rect.y + rect.height)),
  };
}

interface ChildGrid {
  readonly column: (index: number) => number;
  readonly row: (index: number) => number;
  readonly starts: Readonly<Record<'x' | 'y', readonly number[]>>;
  readonly sizes: Readonly<Record<'x' | 'y', readonly number[]>>;
  readonly insets: readonly { readonly x: number; readonly y: number }[];
  readonly ownWidth: number;
  readonly header: number;
  readonly gap: number;
}
/** Once every member is hand-placed the grid no longer positions anything: members stay where
 * they were put and the frame fits them, so a drag never shifts or pushes its neighbours. */
function allPlaced(members: readonly VisualNode[]): boolean {
  return members.length > 0 && members.every((node) => node.placement !== null);
}
interface GroupRect {
  readonly node: VisualNode;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
const SPAN = {
  x: { size: 'width', cross: 'y', crossSize: 'height' },
  y: { size: 'height', cross: 'x', crossSize: 'width' },
} as const;
/** A settled group sits where it was put. Only a group before it that grew into the road between
 * them moves it on, by just enough to keep that road. */
function settledFloors<T extends GroupRect>(
  rects: readonly T[],
  gap: number,
): readonly (T & { readonly minX: number; readonly minY: number })[] {
  const xs = pushedStarts(rects, 'x', gap);
  const ys = pushedStarts(rects, 'y', gap);
  return rects.map((rect) => ({
    ...rect,
    minX: xs.get(rect) ?? rect.x,
    minY: ys.get(rect) ?? rect.y,
  }));
}
function pushedStarts(
  rects: readonly GroupRect[],
  axis: 'x' | 'y',
  gap: number,
): ReadonlyMap<GroupRect, number> {
  const pushed = new Map<GroupRect, number>();
  rects
    .toSorted((a, b) => a[axis] - b[axis])
    .forEach((rect) => {
      const pushes = [...pushed].map(([earlier, start]) =>
        before(earlier, rect, axis, gap) ? pushFrom(earlier, start, rect, axis, gap) : 0,
      );
      pushed.set(rect, rect[axis] + Math.max(0, ...pushes));
    });
  return pushed;
}
function oldSize(rect: GroupRect, size: 'width' | 'height'): number {
  return rect.node.placement?.[size] ?? rect[size];
}
/** Before, on this axis, and sharing a stretch of the other axis; or diagonally before, grown into
 * it, with this the axis that needs the shorter push. */
function before(earlier: GroupRect, rect: GroupRect, axis: 'x' | 'y', gap: number): boolean {
  const { cross, crossSize } = SPAN[axis];
  const across =
    earlier[cross] < rect[cross] + oldSize(rect, crossSize) &&
    rect[cross] < earlier[cross] + oldSize(earlier, crossSize);
  return across ? ahead(earlier, rect, axis) : diagonalPush(earlier, rect, gap) === axis;
}
function ahead(earlier: GroupRect, rect: GroupRect, axis: 'x' | 'y'): boolean {
  return earlier[axis] + oldSize(earlier, SPAN[axis].size) <= rect[axis] + 0.5;
}
function diagonalPush(earlier: GroupRect, rect: GroupRect, gap: number): 'x' | 'y' | undefined {
  const reach = (axis: 'x' | 'y') =>
    ahead(earlier, rect, axis) ? earlier[axis] + earlier[SPAN[axis].size] + gap - rect[axis] : 0;
  const shorter = reach('y') < reach('x') ? 'y' : 'x';
  return reach(shorter) > 0 ? shorter : undefined;
}
/** How far the earlier group's grown far edge reaches into the road the later group kept. */
function pushFrom(
  earlier: GroupRect,
  start: number,
  rect: GroupRect,
  axis: 'x' | 'y',
  gap: number,
): number {
  const { size } = SPAN[axis];
  const road = Math.min(gap, rect[axis] - earlier[axis] - oldSize(earlier, size));
  return start + earlier[size] + road - rect[axis];
}
/** A frame whose size was fixed where it stood keeps its leaves' grid margins, so a drag grows it
 * only by what the move needs. An unsized frame keeps a full gap past its last leaf. */
function settledReach<T>(
  authored: { readonly width?: number | undefined } | null | undefined,
  placed: T,
  manual: T,
): T {
  return authored?.width == null ? manual : placed;
}
/** A settled leaf keeps the margin its grid cell gave it: its wire approaches, half the cell gap
 * and half the frame gap, so pinning a node where it already sits never grows the frame. */
function placedReach(
  leaves: readonly VisualNode[],
  footprints: readonly Footprint[],
  margin: number,
): { readonly width: number; readonly height: number } {
  const far = (axis: 'x' | 'y', size: 'width' | 'height', side: 'right' | 'bottom') =>
    Math.ceil(
      Math.max(
        0,
        ...leaves.map((node, index) => {
          const placement = node.placement ?? { x: 0, y: 0, [size]: undefined };
          const extent = Math.max(node[size], placement[size] ?? 0);
          return placement[axis] + extent / 2 + (footprints[index]?.[side] ?? 0) + margin;
        }),
      ),
    );
  return { width: far('x', 'width', 'right'), height: far('y', 'height', 'bottom') };
}
/** The road between child columns (rows) runs on the grid line; a pinned group stays past it. */
function gridFloor(grid: ChildGrid, index: number): { minX: number; minY: number } {
  const column = grid.column(index),
    row = grid.row(index);
  return {
    minX: column === 0 ? -Infinity : grid.ownWidth + (grid.starts.x[column] ?? 0) + grid.gap,
    minY: row === 0 ? -Infinity : grid.header + (grid.starts.y[row] ?? 0) + grid.gap / 2,
  };
}
/** A settled group keeps its grid cell on the far side; Layout runs its ring road there. */
function farEdge(
  rects: readonly { x: number; y: number; minX: number; minY: number }[],
  grid: ChildGrid,
  axis: 'x' | 'y',
): number {
  // Layout starts the cell no earlier than the content area; the caller's own left gap already
  // covers that start once, so strip it back out here.
  const { track, floor, start, strip } = {
    x: { track: grid.column, floor: 'minX' as const, start: grid.gap / 2, strip: grid.gap / 2 },
    y: { track: grid.row, floor: 'minY' as const, start: grid.header, strip: 0 },
  }[axis];
  return Math.max(
    0,
    ...rects.map(
      (rect, index) =>
        Math.max(Math.max(rect[axis], rect[floor]) - (grid.insets[index]?.[axis] ?? 0), start) +
        (grid.sizes[axis][track(index)] ?? 0) -
        strip,
    ),
  );
}

/** A style-derived spacing policy, not a promise that every route fits this capacity. */
function trafficGap(population: number, pitch: number, padding: number): number {
  return Math.ceil(Math.max(padding * 4, (population + 2) * pitch * 2 + padding * 2));
}

function descendants(
  members: readonly VisualNode[],
  all: readonly VisualNode[],
): readonly VisualNode[] {
  return members.flatMap((node) => [
    node,
    ...descendants(
      all.filter((child) => child.parent === node.id),
      all,
    ),
  ]);
}

interface Footprint {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}
type Side = keyof Footprint;

/** Cell bounds include body, compact unselected approaches and the selected annotation bands. */
function nodeFootprint(
  node: VisualNode,
  wires: readonly VisualWire[],
  pitch: number,
  labelGap: number,
  advance: number,
): Footprint {
  const exits = wires.filter((wire) => wire.source.node === node.id);
  const entries = wires.filter((wire) => wire.target.node === node.id);
  const width = Math.max(node.width, node.placement?.width ?? 0);
  const height = Math.max(node.height, node.placement?.height ?? 0);
  const count = Math.max(exits.length, entries.length);
  const compact = count === 0 ? 0 : (count + 1) * pitch + Math.max(0, advance - pitch);
  const body = {
    left: width / 2 + compact,
    right: width / 2 + compact,
    top: height / 2 + compact,
    bottom: height / 2 + compact,
  };
  return annotatedFootprint(
    annotatedFootprint(body, node, exits, 'source', pitch, labelGap, advance),
    node,
    entries,
    'target',
    pitch,
    labelGap,
    advance,
  );
}

/** Orthogonal lanes share the body's across-axis span instead of adding it a second time. */
function annotatedFootprint(
  body: Footprint,
  node: VisualNode,
  wires: readonly VisualWire[],
  endpoint: 'source' | 'target',
  pitch: number,
  gap: number,
  advance: number,
): Footprint {
  const selected = wires.filter(
    (wire) => wire.labelVisible !== false && wire.annotationEndpoint === endpoint,
  );
  const normal = (wires.length + 1) * pitch + Math.max(0, advance - pitch);
  const directions: Readonly<Record<Side, Side>> =
    endpoint === 'source'
      ? { right: 'bottom', left: 'top', bottom: 'left', top: 'right' }
      : { left: 'bottom', right: 'top', top: 'left', bottom: 'right' };
  return (['left', 'right', 'top', 'bottom'] as const).reduce((bounds, side) => {
    const labels = selected.filter((wire) => annotationSide(wire, endpoint) === side);
    if (labels.length === 0) return bounds;
    const lateral = side === 'left' || side === 'right';
    const across = lateral ? 'height' : 'width';
    const along = lateral ? 'width' : 'height';
    const pitches = labels.map((wire) => wire.label[across] + gap * 2 + 1);
    const band = Math.min(
      (wires.length + 1) * Math.max(pitch, ...pitches),
      (wires.length + 1) * pitch + 2 * pitches.reduce((sum, value) => sum + value - pitch, 0),
    );
    const crossSide = directions[side];
    const anchors = labels.map((wire) => anchorOffset(node, wire, endpoint, crossSide));
    return {
      ...bounds,
      [side]: Math.max(
        bounds[side],
        node[along] / 2 +
          normal +
          Math.max(...labels.map((wire) => wire.label[along] + gap * 2 + 1)),
      ),
      [crossSide]: Math.max(bounds[crossSide], band + Math.max(...anchors)),
    };
  }, body);
}
function annotationSide(wire: VisualWire, endpoint: 'source' | 'target'): Side {
  const side = endpoint === 'source' ? wire.route.sourceSide : wire.route.targetSide;
  return side === 'auto' ? (endpoint === 'source' ? 'right' : 'left') : side;
}
function anchorOffset(
  node: VisualNode,
  wire: VisualWire,
  endpoint: 'source' | 'target',
  side: Side,
): number {
  const anchor = node.content.anchors.find((item) => item.member === wire[endpoint].member);
  if (anchor === undefined) return 0;
  return (anchor.y - node.height / 2) * (side === 'top' ? -1 : 1);
}

/** Manual placements reserve their own cell before roads are built; automatic nodes retain grid order. */
function tracks(
  nodes: readonly VisualNode[],
  cells: readonly Footprint[],
  grid: Grid,
  axis: 'x' | 'y',
  gap: number,
  origin: number,
) {
  const count = axis === 'x' ? gridSize(grid).columns : gridSize(grid).rows;
  const columns = grid.columns;
  const before = axis === 'x' ? 'left' : 'top';
  const after = axis === 'x' ? 'right' : 'bottom';
  const dimension = axis === 'x' ? 'width' : 'height';
  const sizes: number[] = [],
    centers: number[] = [];
  let start = origin;
  for (let track = 0; track < count; track++) {
    const members = nodes
      .map((node, index) => ({
        node,
        cell: cells[index]!,
        track:
          axis === 'x'
            ? (grid.cells[index] ?? index) % columns
            : Math.floor((grid.cells[index] ?? index) / columns),
      }))
      .filter((item) => item.track === track);
    const lead = Math.max(...members.map((item) => item.cell[before]));
    const trail = Math.max(...members.map((item) => item.cell[after]));
    const pinned = members
      .filter((item) => item.node.placement !== null)
      .map(
        ({ node, cell }) =>
          node.placement![axis] +
          Math.max(node[dimension], node.placement![dimension] ?? 0) / 2 +
          cell[after] +
          gap / 2 -
          start,
      );
    const size = Math.ceil(Math.max(lead + trail + gap, ...pinned));
    sizes.push(size);
    centers.push(lead + gap / 2);
    start += size;
  }
  return { sizes, centers };
}

/** Annotation ownership is semantic and fixed before measuring any module envelope. */
function annotationOwners(wires: readonly VisualWire[]): readonly VisualWire[] {
  return wires.map((wire) => {
    const exits = wires.filter((other) => other.source.node === wire.source.node).length;
    const entries = wires.filter((other) => other.target.node === wire.target.node).length;
    return { ...wire, annotationEndpoint: exits <= entries ? 'source' : 'target' };
  });
}
