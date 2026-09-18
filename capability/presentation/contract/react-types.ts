import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { VisualNode, Primitive, MarkerKind, MeasuredContent } from './records/visual.js';
import type { ChromePolicy, ChromePolicies, ChromeName } from './records/chrome.js';
import type { FontSet, Paint, ResolvedStyle } from './records/style.js';
/** React declarations never enter core; stable slots are bound once by composition. */
export interface ContentBlocksProps {
  readonly primitives: readonly Primitive[];
}
export interface NodeContentProps {
  readonly node: VisualNode;
  readonly embedFonts?: boolean;
  readonly emphasis?: 'normal' | 'primary' | 'secondary' | 'muted';
}
/** Browser paint roles are injected once; shared/native renderers remain stylesheet-free. */
export interface NodeRenderClasses {
  readonly root: string;
  readonly frame: string;
  readonly rim: string;
  readonly header: string;
  readonly separator: string;
  readonly heading: string;
  readonly body: string;
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
  readonly chromePolicies?: ChromePolicies;
  readonly NodeContent: ComponentType<NodeContentProps>;
  readonly MeasuredContent: ComponentType<MeasuredContentProps>;
  readonly Marker: ComponentType<MarkerProps>;
  readonly fonts: FontSet;
  readonly FontDefinitions: ComponentType<FontDefinitionsProps>;
}
/** A chrome owns frame and heading treatment; shared primitives retain content and ports. */
export interface NodeChromeProps {
  readonly node: VisualNode;
  readonly style?: ResolvedStyle | undefined;
  readonly heading?: ReactNode;
  readonly classes?: NodeRenderClasses | undefined;
}
/** Registered React frame and its immutable measurement policy share one selection key. */
export interface NodeChrome extends ChromePolicy {
  readonly separateHeading?: boolean;
  readonly Component: ComponentType<NodeChromeProps>;
}
/** Open checked registry keys select frames; card is the mandatory unknown-name fallback. */
export type NodeChromeRegistry = Readonly<Record<ChromeName, NodeChrome>> & {
  readonly card: NodeChrome;
};
export interface NodeSlots {
  readonly chromes: NodeChromeRegistry;
  readonly ContentBlocks: ComponentType<ContentBlocksProps>;
  readonly classes?: NodeRenderClasses | undefined;
}
export type StaticRenderer = (element: ReactNode) => string;
export type NodeElement = (props: NodeContentProps) => ReactElement;
