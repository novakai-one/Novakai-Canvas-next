import type { MarkerKind } from './visual.js';
/** Local geometry faces toward the endpoint at x=0; routing applies orientation/translation. */
export interface MarkerDrawing {
  readonly paths: readonly string[];
  readonly circles: readonly { readonly x: number; readonly y: number; readonly radius: number }[];
  readonly filled: boolean;
  readonly bounds: { readonly advance: number; readonly halfHeight: number };
}
export type MarkerFactory = (kind: MarkerKind) => MarkerDrawing;
