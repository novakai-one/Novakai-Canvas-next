import type { VisualSection, VisualSequenceItem } from '../../contract/records/input.js';
import type {
  PlacedNode,
  SequenceEvent,
  FragmentFrame,
  Box,
} from '../../contract/records/geometry.js';
import type { LayoutOptions, SupplementalMeasurements } from '../../contract/types.js';
export type EventInput = VisualSequenceItem & {
  readonly item: Extract<VisualSequenceItem['item'], { kind: 'event' }>;
};
export type FragmentInput = VisualSequenceItem & {
  readonly item: Extract<VisualSequenceItem['item'], { kind: 'fragment' }>;
};
export interface SequenceContext {
  readonly section: VisualSection;
  readonly nodes: readonly PlacedNode[];
  readonly options: LayoutOptions;
  readonly metrics: SupplementalMeasurements;
  readonly extent: Box;
}
export interface Body {
  readonly bottom: number;
  readonly events: readonly SequenceEvent[];
  readonly fragments: readonly FragmentFrame[];
}
