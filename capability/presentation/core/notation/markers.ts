import type { MarkerDrawing } from '../../contract/records/marker.js';
import type { MarkerKind } from '../../contract/records/visual.js';
const bar = 'M -8 -5 L -8 5';
const foot = 'M 0 -6 L -12 0 L 0 6 M -12 0 L 0 0';
const circle = { x: -19, y: 0, radius: 4 };
/** Crow's feet encode maximum many; circle/bar independently encode minimum zero/one. */
const drawings: Readonly<Record<MarkerKind, MarkerDrawing>> = {
  none: { paths: [], circles: [], filled: false },
  arrow: { paths: ['M -10 -5 L 0 0 L -10 5 Z'], circles: [], filled: true },
  'open-arrow': { paths: ['M -10 -5 L 0 0 L -10 5'], circles: [], filled: false },
  one: { paths: [bar, 'M -15 -5 L -15 5'], circles: [], filled: false },
  'zero-one': { paths: [bar], circles: [circle], filled: false },
  'one-many': { paths: [foot, 'M -18 -5 L -18 5'], circles: [], filled: false },
  'zero-many': { paths: [foot], circles: [circle], filled: false },
};
/** Geometry is shared through a composed renderer slot, never duplicated in Canvas or Export. */
export function markerDrawing(kind: MarkerKind): MarkerDrawing {
  return drawings[kind];
}
