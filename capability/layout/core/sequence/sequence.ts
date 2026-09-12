import type { VisualSection } from '../../contract/records/input.js';
import type { PlacedNode, SequenceGeometry } from '../../contract/records/geometry.js';
import type { LayoutOptions, SupplementalMeasurements } from '../../contract/types.js';
import type { SequenceContext } from './records.js';
import { body } from './frames.js';
import { activations } from './activations.js';
import { union, center } from '../geometry/bounds.js';
/** Sequence whitespace scales against configured normal spacing; measured content and padding stay intact.
 * LayoutFault propagates to createLayout().arrange/inspect for typed rejection; Authoring retains
 * the committed scene while callers correct invalid measurements and retry this pure derivation.
 */
export function sequenceGeometry(
  section: VisualSection,
  nodes: readonly PlacedNode[],
  metrics: SupplementalMeasurements,
  options: LayoutOptions,
): SequenceGeometry {
  if (section.sequence.length === 0)
    return { lifelines: [], events: [], fragments: [], activations: [], source: section.sequence };
  const participants = nodes.filter((node): boolean => node.measured.kind === 'participant');
  const extent = union(participants.map((node): typeof node.box => node.box));
  const localOptions: LayoutOptions = {
    ...options,
    sequenceGap: (options.sequenceGap * options.gap[section.layout.gap]) / options.gap.normal,
  };
  const context: SequenceContext = {
    section,
    nodes: participants,
    metrics,
    options: localOptions,
    extent,
  };
  const geometry = body(context, null, null, extent.y + extent.height + localOptions.sequenceGap);
  return {
    source: section.sequence,
    events: geometry.events,
    fragments: geometry.fragments,
    activations: activations(geometry.events, geometry.bottom, geometry.fragments, context),
    lifelines: participants.map((node): SequenceGeometry['lifelines'][number] => ({
      participant: node.id,
      from: { x: center(node.box).x, y: node.box.y + node.box.height },
      to: { x: center(node.box).x, y: geometry.bottom },
    })),
  };
}
