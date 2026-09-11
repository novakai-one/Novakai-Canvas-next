import type { VisualSection } from '../../contract/records/input.js';
import type { PlacedNode, SequenceGeometry } from '../../contract/records/geometry.js';
import type { LayoutOptions, SupplementalMeasurements } from '../../contract/types.js';
import type { SequenceContext } from './records.js';
import { body } from './frames.js';
import { activations } from './activations.js';
import { union, center } from '../geometry/bounds.js';
/** An ordinary section retains an explicit empty sequence, never hidden synthetic participants. */
export function sequenceGeometry(
  section: VisualSection,
  nodes: readonly PlacedNode[],
  metrics: SupplementalMeasurements,
  options: LayoutOptions,
): SequenceGeometry {
  if (section.sequence.length === 0)
    return { lifelines: [], events: [], fragments: [], activations: [], source: section.sequence };
  const participants = nodes.filter((node) => node.measured.kind === 'participant');
  const extent = union(participants.map((node) => node.box));
  const context: SequenceContext = { section, nodes: participants, metrics, options, extent };
  const geometry = body(context, null, null, extent.y + extent.height + options.sequenceGap);
  return {
    source: section.sequence,
    events: geometry.events,
    fragments: geometry.fragments,
    activations: activations(geometry.events, geometry.bottom, geometry.fragments, context),
    lifelines: participants.map((node) => ({
      participant: node.id,
      from: { x: center(node.box).x, y: node.box.y + node.box.height },
      to: { x: center(node.box).x, y: geometry.bottom },
    })),
  };
}
