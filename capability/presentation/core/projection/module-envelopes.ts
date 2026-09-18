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
  const measured = new Map<string, VisualNode>();
  const envelope = measure(null, section, context, measured);
  return {
    ...section,
    envelope,
    nodes: section.nodes.map((node) => measured.get(node.id) ?? node),
  };
}
/** Reserve at each immediate boundary only; a child's internal links consume its own space. */
function density(
  members: readonly VisualNode[],
  all: readonly VisualNode[],
  wires: readonly VisualWire[],
): number {
  const owners = new Map<string, string>();
  members.forEach((member) =>
    descendants([member], all).forEach((node) => owners.set(node.id, member.id)),
  );
  return wires.filter((wire) => {
    const from = owners.get(wire.source.node),
      to = owners.get(wire.target.node);
    return from !== to && (from !== undefined || to !== undefined);
  }).length;
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
  const lanePitch = context.style.gap;
  const terminalPitch = Math.max(
    lanePitch * 2,
    ...labels.map((label) => label.height + lanePitch * 2),
  );
  const traffic = density(members, section.nodes, section.wires);
  const gap = Math.ceil(Math.max(padding * 4, (traffic + 2) * lanePitch * 2 + padding * 2));
  const nodeTraffic = Math.max(
    0,
    ...leaves.map(
      (node) =>
        section.wires.filter((wire) => wire.source.node === node.id || wire.target.node === node.id)
          .length,
    ),
  );
  const nodeGap = Math.ceil(Math.max(gap, (nodeTraffic + 1) * terminalPitch * 2 + gap));
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
  const pitch = {
    x:
      Math.ceil(
        Math.max(0, ...leaves.map((node) => Math.max(node.width, node.placement?.width ?? 0))),
      ) + nodeGap,
    y:
      Math.ceil(
        Math.max(0, ...leaves.map((node) => Math.max(node.height, node.placement?.height ?? 0))),
      ) + nodeGap,
  };
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
  const ownWidth = leaves.length === 0 ? 0 : columns * pitch.x;
  const ownHeight = Math.ceil(leaves.length / columns) * pitch.y;
  const authored = parent === null ? section.placement : parent.placement;
  return {
    width:
      authored?.width ??
      Math.max(parent?.content.width ?? section.title.width, ownWidth + childWidth) + gap,
    height: authored?.height ?? Math.max(ownHeight, childHeight) + header + gap / 2,
    header,
    gap,
    lanePitch,
    terminalPitch,
    columns,
    childColumns,
    pitch,
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
