/** Section derivation runs under Layout execute; rejected cache hints are recomputed and callers retain the previous scene on failure. */
import type { VisualSection } from '../../contract/records/input.js';
import type { SectionCandidate } from '../../contract/records/candidate.js';
import type { PlacedSection, PlacedNode } from '../../contract/records/geometry.js';
import type { SupplementalMeasurements } from '../../contract/types.js';
import type { DerivationContext } from '../../contract/types.js';
import { hasColumns } from '../placement/seeds.js';
import { placeSection } from '../placement/section.js';
import { routeWires } from '../routing/wires.js';
import { sequenceGeometry } from '../sequence/sequence.js';
import { contentBounds, titleBox, sectionBounds } from './bounds.js';
import { sectionKey, versions } from './keys.js';
import { inspectSection } from '../validation/sections.js';
import { requireValue, protect } from '../validation/outcomes.js';
/** Cache geometry is accepted only after full current-source inspection; a bad hint falls back to derivation. */
function cached(
  source: VisualSection,
  previous: SectionCandidate | null,
  metrics: SupplementalMeasurements,
  context: DerivationContext,
): PlacedSection | null {
  if (previous === null || hasColumns(source)) return null;
  const result = protect(() =>
    inspectSection(source, previous, {
      options: context.options,
      measurements: metrics,
      engines: versions(context.dependencies),
    }),
  );
  if (!result.ok) return null;
  const section = result.value;
  return {
    ...section,
    origin: { x: 0, y: 0 },
    box: {
      ...section.box,
      x: section.box.x - section.origin.x,
      y: section.box.y - section.origin.y,
    },
  };
}
/** Local reuse is exact; collection arrangement may move the independent section origin afterward. */
export async function arrangeSection(
  source: VisualSection,
  previous: SectionCandidate | null,
  metrics: SupplementalMeasurements,
  context: DerivationContext,
): Promise<PlacedSection> {
  const reuse = cached(source, previous, metrics, context);
  if (reuse !== null) return reuse;
  const nodes = requireValue(await placeSection(source, previous, context, metrics));
  return completeSection(source, nodes, metrics, context);
}
/** Build wires, sequence and heading around fixed nodes without assigning collection-space positions. */
export async function completeSection(
  source: VisualSection,
  nodes: readonly PlacedNode[],
  metrics: SupplementalMeasurements,
  context: DerivationContext,
): Promise<PlacedSection> {
  const wires = await routeWires(source, nodes, metrics, context);
  const sequence = sequenceGeometry(source, nodes, metrics, context.options);
  const content = contentBounds(nodes, wires, sequence);
  const title = {
    content: source.title,
    box: titleBox(content, source.title, context.options.padding),
  };
  return {
    id: source.id,
    origin: { x: 0, y: 0 },
    box: sectionBounds(content, title.box, context.options.padding),
    title,
    inputKey: sectionKey(source, metrics, context.options, versions(context.dependencies)),
    nodes,
    wires,
    sequence,
  };
}
