import { placeEntries } from '../core/editing/placements.js';
import type { Section } from '../contract/records/owners.js';
import { previewModuleCollection } from '@novakai/canvas-layout';
import { remeasureModuleEnvelopes } from '@novakai/canvas-presentation';
import type { VisualSection } from '@novakai/canvas-presentation';
import type { EditIntent, GeometryPreview } from '@novakai/canvas-canvas';
import type { RenderDocument } from '@novakai/canvas-service';
import type { Result } from '../contract/errors.js';

/** Reuse the exact Authoring placement merge; moving retains prior explicit dimensions. */
function placed(section: VisualSection, source: Section): VisualSection {
  return {
    ...section,
    placement: source.placement ?? null,
    groups: source.groups,
    nodes: section.nodes.map((node) => {
      const owner =
        node.groupId === null
          ? source.appearances.find((item) => item.object === node.objectId)
          : source.groups.find((item) => item.id === node.groupId);
      return { ...node, placement: owner?.placement ?? null };
    }),
  };
}

/** Only changed module nodes need portable routing; companion section origins are always repacked. */
export function previewModuleRoutes(
  document: RenderDocument,
  intent: EditIntent,
): Result<GeometryPreview | null> {
  if (intent.kind !== 'placement') return { ok: true, value: null };
  // Resizing changes font/content measurement and remains with the full save pipeline.
  if (
    intent.entries.some(
      (entry) => entry.placement.width !== undefined || entry.placement.height !== undefined,
    )
  )
    return { ok: true, value: null };
  const supported = intent.entries.every(
    ({ target }) =>
      target.kind === 'section' ||
      document.projection.sections.some(
        (section) => section.id === target.section && section.mode === 'modules',
      ),
  );
  if (!supported) return { ok: true, value: null };
  if (!document.projection.sections.some((section) => section.mode === 'modules'))
    return { ok: true, value: null };
  const sources = placeEntries(intent, document);
  const projection = remeasureModuleEnvelopes(
    {
      ...document.projection,
      sections: document.projection.sections.map((section) =>
        placed(
          section,
          sources.find((source) => source.id === section.id)!,
        ),
      ),
    },
    document.style,
  );
  const result = previewModuleCollection(
    projection,
    document.measurements,
    document.options,
    document.scene,
  );
  if (!result.ok) return result;
  return {
    ok: true,
    value: {
      bounds: result.value.bounds,
      sections: result.value.sections.map((section) => ({
        id: section.id,
        origin: section.origin,
      })),
      boxes: result.value.sections.flatMap((section) => [
        { target: { kind: 'section' as const, id: section.id }, box: section.box },
        ...section.nodes.map((node) => ({
          target: { kind: 'node' as const, section: section.id, id: node.id },
          box: { ...node.box, x: node.box.x + section.origin.x, y: node.box.y + section.origin.y },
        })),
      ]),
      wires: result.value.sections.flatMap((section) =>
        section.wires.map((wire) => ({
          section: section.id,
          id: wire.id,
          source: wire.source,
          target: wire.target,
          points: wire.points,
          labelBox: wire.labelBox,
        })),
      ),
    },
  };
}
