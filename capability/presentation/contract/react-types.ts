import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { VisualNode, Primitive, MarkerKind, MeasuredContent } from './records/visual.js';
import type { FontSet, Paint } from './records/style.js';
/** React declarations never enter core; stable slots are bound once by composition. */
export interface ContentBlocksProps {
  readonly primitives: readonly Primitive[];
}
export interface NodeContentProps {
  readonly node: VisualNode;
  readonly embedFonts?: boolean;
}
/** Measured labels/titles reuse exact font bytes and primitives without inventing a node frame. */
export interface MeasuredContentProps {
  readonly content: MeasuredContent;
  readonly embedFonts?: boolean;
}
export interface MarkerProps {
  readonly kind: MarkerKind;
  readonly paint: Paint;
}
/** A mounted host may replace installation fonts with the current validated document font set. */
export interface FontDefinitionsProps {
  readonly fonts?: FontSet | undefined;
}
export interface ReactBindings {
  readonly NodeContent: ComponentType<NodeContentProps>;
  readonly MeasuredContent: ComponentType<MeasuredContentProps>;
  readonly Marker: ComponentType<MarkerProps>;
  readonly fonts: FontSet;
  readonly FontDefinitions: ComponentType<FontDefinitionsProps>;
}
export interface NodeSlots {
  readonly ContentBlocks: ComponentType<ContentBlocksProps>;
}
export type StaticRenderer = (element: ReactNode) => string;
export type NodeElement = (props: NodeContentProps) => ReactElement;
