import type { RoutingOverlay } from './routing-overlay.js';
import type { LayoutInputKey } from '../brands.js';
import { z } from 'zod';
import { identity, coordinate, dimension } from '../brands.js';
import type {
  VisualNode,
  MeasuredContent,
  MarkerKind,
  VisualSequenceItem,
  VisualWire,
} from './input.js';
export const point = z.strictObject({ x: coordinate, y: coordinate }).readonly();
export type Point = z.infer<typeof point>;
export const box = point.unwrap().extend({ width: dimension, height: dimension }).readonly();
export type Box = z.infer<typeof box>;
export const side = z.enum(['top', 'right', 'bottom', 'left']);
export type Side = z.infer<typeof side>;
/** A placed node retains its exact measured content; group outer bounds may grow without rewrapping it. */
export interface PlacedNode {
  readonly id: string;
  readonly parent: string | null;
  readonly sectionId: string;
  readonly box: Box;
  readonly measured: VisualNode;
}
export interface ResolvedEndpoint {
  readonly node: string;
  readonly member: string | null;
  readonly point: Point;
  readonly side: Side;
}
export interface RoutedWire {
  readonly labelVisible?: boolean | undefined;
  readonly id: string;
  readonly source: ResolvedEndpoint;
  readonly target: ResolvedEndpoint;
  readonly points: readonly Point[];
  readonly path: string;
  readonly labelBox: Box;
  readonly measuredLabel: MeasuredContent;
  readonly appearance: VisualWire['appearance'];
  readonly sourceMarker: MarkerKind;
  readonly targetMarker: MarkerKind;
  readonly style: 'solid' | 'dashed';
}
export interface Lifeline {
  readonly participant: string;
  readonly from: Point;
  readonly to: Point;
}
export interface SequenceEvent {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly points: readonly Point[];
  readonly labelBox: Box;
  readonly content: MeasuredContent;
  readonly marker: MarkerKind;
  readonly message: 'call' | 'return' | 'async';
}
export interface FragmentFrame {
  readonly id: string;
  readonly parent: string | null;
  readonly box: Box;
  readonly labelBox: Box;
  readonly content: MeasuredContent;
  readonly branches: readonly {
    readonly id: string;
    readonly box: Box;
    readonly labelBox: Box;
    readonly content: MeasuredContent;
  }[];
}
export interface Activation {
  readonly participant: string;
  readonly fromEvent: string;
  readonly toEvent: string | null;
  readonly box: Box;
}
export interface SequenceGeometry {
  readonly lifelines: readonly Lifeline[];
  readonly events: readonly SequenceEvent[];
  readonly fragments: readonly FragmentFrame[];
  readonly activations: readonly Activation[];
  readonly source: readonly VisualSequenceItem[];
}
export interface TreeEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}
export interface TreeRow {
  readonly node: string;
  readonly parent: string | null;
  readonly depth: number;
}
export interface TreeGeometry {
  readonly root: string | null;
  readonly edges: readonly TreeEdge[];
  readonly rows: readonly TreeRow[];
}
export interface PlacedSection {
  readonly routing?: RoutingOverlay | undefined;
  readonly id: string;
  readonly origin: Point;
  readonly box: Box;
  readonly title: { readonly content: MeasuredContent; readonly box: Box };
  readonly inputKey: LayoutInputKey;
  readonly nodes: readonly PlacedNode[];
  readonly wires: readonly RoutedWire[];
  readonly sequence: SequenceGeometry;
  readonly tree?: TreeGeometry | undefined;
}
export interface Warning {
  readonly code: 'wire-crossing' | 'constraint-relaxed';
  readonly targets: readonly string[];
  readonly message: string;
}
export interface Adjustment {
  readonly target: string;
  readonly before: Box | readonly Point[];
  readonly after: Box | readonly Point[];
  readonly reason: string;
}
export interface Scene {
  readonly collectionId: string;
  readonly revision: number;
  readonly inputKey: LayoutInputKey;
  readonly engineVersions: readonly string[];
  readonly sections: readonly PlacedSection[];
  readonly bounds: Box;
  readonly warnings: readonly Warning[];
  readonly adjustments: readonly Adjustment[];
}
/** Empty scenes reserve one positive logical unit rather than using invalid zero-sized render bounds. */
export const emptyBox: Box = Object.freeze({ x: 0, y: 0, width: 1, height: 1 });
export const endpoint = z
  .strictObject({ node: identity, member: z.string().nullable(), point, side })
  .readonly();
