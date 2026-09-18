import { markerMeasurements } from '../notation/markers.js';
import type {
  VisualNode,
  VisualSection,
  VisualWire,
  ModuleEnvelope,
} from '../../contract/records/visual.js';
import type { ContentContext } from '../content/blocks.js';

/** Presentation owns container footprints before any routing runs. Reserves are based on
 * measured content and connection density, never on a router's calculated geometry. */
export function moduleEnvelopes(section: VisualSection, context: ContentContext): VisualSection {
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
  context: ContentContext,
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
  const labels = section.wires.map((wire) => wire.label);
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
  const gap = Math.ceil(
    Math.max(padding * 4, (traffic.perimeter + 2) * lanePitch * 2 + padding * 2),
  );
  const cellGap = Math.ceil(
    Math.max(padding * 4, (traffic.local + 2) * lanePitch * 2 + padding * 2),
  );
  const intent =
    section.groups.find((group) => group.id === parent?.groupId)?.layout ?? section.layout;
  const columns = Math.max(
    1,
    Math.min(leaves.length || 1, intent.columns ?? Math.ceil(Math.sqrt(leaves.length))),
  );
  const childColumns = Math.max(
    1,
    Math.min(children.length || 1, intent.columns ?? Math.ceil(Math.sqrt(children.length))),
  );
  const cells = leaves.map((node) => {
    const reserve = nodeReserve(node.id, section.wires, lanePitch, annotationGap, advance);
    return {
      x: Math.ceil(Math.max(node.width, node.placement?.width ?? 0) + reserve.x + cellGap),
      y: Math.ceil(Math.max(node.height, node.placement?.height ?? 0) + reserve.y + cellGap),
    };
  });
  const columnWidths = Array.from({ length: leaves.length === 0 ? 0 : columns }, (_, column) =>
    Math.max(...cells.filter((_, i) => i % columns === column).map((cell) => cell.x)),
  );
  const rowHeights = Array.from({ length: Math.ceil(leaves.length / columns) }, (_, row) =>
    Math.max(...cells.slice(row * columns, (row + 1) * columns).map((cell) => cell.y)),
  );
  const pitch = { x: Math.max(gap, ...columnWidths), y: Math.max(gap, ...rowHeights) };
  const childRows = Array.from({ length: Math.ceil(children.length / childColumns) }, (_, index) =>
    children.slice(index * childColumns, (index + 1) * childColumns),
  );
  const childWidth = Math.max(
    0,
    ...childRows.map((row) => row.reduce((sum, child) => sum + child.width + gap, 0)),
  );
  const childHeight = childRows.reduce(
    (sum, row) => sum + Math.max(...row.map((child) => child.height + gap)),
    0,
  );
  const header = Math.ceil((parent?.headerHeight ?? section.title.height + padding * 2) + gap / 2);
  const ownWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const ownHeight = rowHeights.reduce((sum, height) => sum + height, 0);
  const pinned = leaves.filter((node) => node.placement !== null);
  const manualWidth = Math.max(
    0,
    ...pinned.map(
      (node) => node.placement!.x + Math.max(node.width, node.placement!.width ?? 0) + gap / 2,
    ),
  );
  const manualHeight = Math.max(
    0,
    ...pinned.map(
      (node) => node.placement!.y + Math.max(node.height, node.placement!.height ?? 0) + gap / 2,
    ),
  );
  const authored = parent === null ? section.placement : parent.placement;
  return {
    width:
      authored?.width ??
      Math.max(
        manualWidth,
        Math.max(parent?.content.width ?? section.title.width, ownWidth + childWidth) + gap,
      ),
    height:
      authored?.height ??
      Math.max(manualHeight, Math.max(ownHeight, childHeight) + header + gap / 2),
    header,
    gap,
    lanePitch,
    annotationGap,
    terminalPitch,
    columns,
    childColumns,
    pitch,
    columnWidths,
    rowHeights,
  };
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

/** Each role bounds its eventual ports; only owned labels reserve extra lane space. */
function nodeReserve(
  id: string,
  wires: readonly VisualWire[],
  pitch: number,
  labelGap: number,
  advance: number,
) {
  const exits = wires.filter((wire) => wire.source.node === id);
  const entries = wires.filter((wire) => wire.target.node === id);
  return {
    x:
      2 *
      Math.max(
        roleReserve(exits, 'source', pitch, 'width', labelGap, advance),
        roleReserve(entries, 'target', pitch, 'width', labelGap, advance),
      ),
    y:
      2 *
      Math.max(
        roleReserve(exits, 'source', pitch, 'height', labelGap, advance),
        roleReserve(entries, 'target', pitch, 'height', labelGap, advance),
      ),
  };
}

/** Lateral automatic annotations reserve shallow bands and a measured approach length. */
function roleReserve(
  wires: readonly VisualWire[],
  endpoint: 'source' | 'target',
  pitch: number,
  dimension: 'width' | 'height',
  labelGap: number,
  advance: number,
): number {
  if (wires.length === 0) return 0;
  const owned = wires.filter((wire) => wire.annotationEndpoint === endpoint);
  const across = owned.filter((wire) => acrossDimension(wire, endpoint) === dimension);
  const along = owned.filter((wire) => acrossDimension(wire, endpoint) !== dimension);
  const pitches = across.map((wire) => wire.label[dimension] + labelGap * 2 + 1);
  const stem = Math.max(0, advance - pitch);
  const base = (wires.length + 1) * pitch + stem;
  const uniform = (wires.length + 1) * Math.max(pitch, ...pitches) + stem;
  const variable = base + 2 * pitches.reduce((sum, value) => sum + value - pitch, 0);
  const approach = Math.max(0, ...along.map((wire) => wire.label[dimension] + labelGap * 2 + 1));
  return Math.max(Math.min(uniform, variable), base + approach);
}

/** Explicit vertical sides remain authoritative; automatic label attachments are lateral. */
function acrossDimension(wire: VisualWire, endpoint: 'source' | 'target'): 'width' | 'height' {
  const side = endpoint === 'source' ? wire.route.sourceSide : wire.route.targetSide;
  return side === 'top' || side === 'bottom' ? 'width' : 'height';
}

/** Annotation ownership is semantic and fixed before measuring any module envelope. */
function annotationOwners(wires: readonly VisualWire[]): readonly VisualWire[] {
  return wires.map((wire) => {
    const exits = wires.filter((other) => other.source.node === wire.source.node).length;
    const entries = wires.filter((other) => other.target.node === wire.target.node).length;
    return { ...wire, annotationEndpoint: exits <= entries ? 'source' : 'target' };
  });
}
