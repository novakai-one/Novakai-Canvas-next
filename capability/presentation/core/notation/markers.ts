import type { MarkerDrawing } from '../../contract/records/marker.js';
import type { MarkerKind } from '../../contract/records/visual.js';
const bar = 'M -8 -5 L -8 5';
const foot = 'M 0 -6 L -12 0 L 0 6 M -12 0 L 0 0';
const circle = { x: -19, y: 0, radius: 4 };
/** Crow's feet encode maximum many; circle/bar independently encode minimum zero/one. */
const drawings: Readonly<Record<MarkerKind, MarkerDrawing>> = {
  none: { paths: [], circles: [], filled: false, bounds: { advance: 0, halfHeight: 0 } },
  arrow: {
    paths: ['M -10 -5 L 0 0 L -10 5 Z'],
    circles: [],
    filled: true,
    bounds: { advance: 10, halfHeight: 5 },
  },
  'open-arrow': {
    paths: ['M -10 -5 L 0 0 L -10 5'],
    circles: [],
    filled: false,
    bounds: { advance: 10, halfHeight: 5 },
  },
  one: {
    paths: [bar, 'M -15 -5 L -15 5'],
    circles: [],
    filled: false,
    bounds: { advance: 15, halfHeight: 5 },
  },
  'zero-one': {
    paths: [bar],
    circles: [circle],
    filled: false,
    bounds: { advance: 23, halfHeight: 5 },
  },
  'one-many': {
    paths: [foot, 'M -18 -5 L -18 5'],
    circles: [],
    filled: false,
    bounds: { advance: 18, halfHeight: 6 },
  },
  'zero-many': {
    paths: [foot],
    circles: [circle],
    filled: false,
    bounds: { advance: 23, halfHeight: 6 },
  },
};
/** Geometry is shared through a composed renderer slot, never duplicated in Canvas or Export. */
export function markerDrawing(kind: MarkerKind): MarkerDrawing {
  return drawings[kind];
}

/** Marker extents are defined beside their paths; Layout adds stroke clearance from resolved tokens. */
export function markerMeasurements(): Readonly<Record<MarkerKind, MarkerDrawing['bounds']>> {
  return {
    none: drawings.none.bounds,
    arrow: drawings.arrow.bounds,
    'open-arrow': drawings['open-arrow'].bounds,
    one: drawings.one.bounds,
    'zero-one': drawings['zero-one'].bounds,
    'one-many': drawings['one-many'].bounds,
    'zero-many': drawings['zero-many'].bounds,
  };
}
