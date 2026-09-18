import { routeModuleSection } from '@novakai/canvas-layout';
import type { PlacedNode, PlacedSection, Point } from '@novakai/canvas-layout';
import type { EditIntent, PlacementIntent, WireRoutePreview } from '@novakai/canvas-canvas';
import type { RenderDocument } from '@novakai/canvas-service';
import type { Result } from '../contract/errors.js';

/** Human placements are parent-local; engine fixed boxes are section-local, including nested ancestors. */
function delta(node: PlacedNode, nodes: readonly PlacedNode[], intent: PlacementIntent): Point {
  const entry = intent.entries.find(
    (item) => item.target.kind === 'node' && item.target.id === node.id,
  );
  if (entry !== undefined) {
    const parent = nodes.find((item) => item.id === node.parent)?.box ?? { x: 0, y: 0 };
    return {
      x: entry.placement.x + parent.x - node.box.x,
      y: entry.placement.y + parent.y - node.box.y,
    };
  }
  const parent = nodes.find((item) => item.id === node.parent);
  return parent === undefined ? { x: 0, y: 0 } : delta(parent, nodes, intent);
}
/** Moving a group translates descendants once; measured dimensions are retained byte-for-byte. */
function moved(section: PlacedSection, intent: PlacementIntent): readonly PlacedNode[] {
  return section.nodes.map((node) => {
    const offset = delta(node, section.nodes, intent);
    return { ...node, box: { ...node.box, x: node.box.x + offset.x, y: node.box.y + offset.y } };
  });
}
/** Reuse the same custom engine as server arrangement without native providers or any new measurement. */
export function previewModuleRoutes(
  document: RenderDocument,
  intent: EditIntent,
): Result<readonly WireRoutePreview[]> {
  if (intent.kind !== 'placement') return { ok: true, value: [] };
  const sections = new Set(
    intent.entries.flatMap((entry) => (entry.target.kind === 'node' ? [entry.target.section] : [])),
  );
  const wires: WireRoutePreview[] = [];
  for (const section of document.scene.sections) {
    if (!sections.has(section.id)) continue;
    const source = document.projection.sections.find((item) => item.id === section.id);
    if (source?.mode !== 'modules') continue;
    const routed = routeModuleSection(
      source,
      document.measurements,
      document.options,
      moved(section, intent),
      section,
    );
    if (!routed.ok) return routed;
    wires.push(
      ...routed.value.wires.map((wire) => ({
        id: wire.id,
        points: wire.points,
        labelBox: wire.labelBox,
      })),
    );
  }
  return { ok: true, value: wires };
}
