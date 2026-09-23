import type { DetailTier } from '../../contract/records/focus.js';

/** Named thresholds are Canvas view policy; exact boundaries enter the higher-detail tier. */
export function detailAtZoom(zoom: number): DetailTier {
  if (zoom >= 0.48) return 'members';
  if (zoom >= 0.24) return 'names';
  return 'overview';
}
