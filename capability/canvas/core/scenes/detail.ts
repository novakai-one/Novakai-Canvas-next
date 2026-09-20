import type { DetailTier, Emphasis } from '../../contract/records/focus.js';

/** Named thresholds are Canvas view policy; exact boundaries enter the higher-detail tier. */
export function detailAtZoom(zoom: number): DetailTier {
  if (zoom >= 0.48) return 'members';
  if (zoom >= 0.24) return 'names';
  return 'overview';
}

/** Focus keeps directly relevant nodes identifiable without changing their admitted geometry. */
export function visibleDetail(tier: DetailTier, emphasis: Emphasis): DetailTier {
  if (tier !== 'overview') return tier;
  return emphasis === 'primary' || emphasis === 'secondary' ? 'names' : tier;
}
