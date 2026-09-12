import type { Box } from './artifact.js';
/** Crop uses collection coordinates; scale/margin/overlap use PDF points. */
export interface Page {
  readonly ordinal: number;
  readonly section: string;
  readonly crop: Box;
  readonly paperWidth: number;
  readonly paperHeight: number;
  readonly scale: number;
  readonly margin: number;
  readonly overlap: number;
  readonly footer: string;
}
