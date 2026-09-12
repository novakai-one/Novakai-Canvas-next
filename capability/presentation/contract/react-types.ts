import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { VisualNode, Primitive, MarkerKind, MeasuredContent } from './records/visual.js';
import type { FontSet, Paint } from './records/style.js';
/** React declarations never enter core; stable slots are bound once by composition. */
export interface ContentBlocksProps {
  readonly primitives: readonly Primitive[];
}
export interface NodeContentProps {
  readonly node: VisualNode;
}
/** Measured labels/titles reuse exact font bytes and primitives without inventing a node frame. */
export interface MeasuredContentProps {
  readonly content: MeasuredContent;
}
export interface MarkerProps {
  readonly kind: MarkerKind;
  readonly paint: Paint;
}
export interface ReactBindings {
  readonly NodeContent: ComponentType<NodeContentProps>;
  readonly MeasuredContent: ComponentType<MeasuredContentProps>;
  readonly Marker: ComponentType<MarkerProps>;
  readonly fonts: FontSet;
}
export interface NodeSlots {
  readonly ContentBlocks: ComponentType<ContentBlocksProps>;
}
export type StaticRenderer = (element: ReactNode) => string;
export type NodeElement = (props: NodeContentProps) => ReactElement;
