import type { ContentBlock, InputCollection } from '../../contract/records/input.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { AssetReader } from '../../contract/ports/resources.js';
import { visualAsset } from '../../contract/records/style.js';
import type { ResolvedStyle, VisualAsset } from '../../contract/records/style.js';
import { requireValue, reject, parse } from '../validation/outcomes.js';
/** Resolve one binding exactly; missing assets do not become decorative blank rectangles. */
export function measureMedia(
  block: Extract<ContentBlock, { kind: 'image' | 'icon' }>,
  collection: InputCollection,
  width: number,
  style: ResolvedStyle,
  assets: AssetReader,
): MeasuredContent {
  const binding = collection.assets.find((value) => value.id === block.asset);
  if (!binding) return reject('missing-resource', block.asset, 'Asset binding is absent');
  const resource = parse(visualAsset, requireValue(assets.read(binding.digest.slice(7))));
  if (`sha256:${resource.digest}` !== binding.digest)
    return reject('missing-resource', binding.id, 'Asset reader returned a different digest');
  return slot(block, resource, binding.alt, width, style);
}
type MediaBlock = Extract<ContentBlock, { kind: 'image' | 'icon' }>;
/** Bounded media slots center in the final node interior; public projection owns resource rejection. */
function slot(
  block: MediaBlock,
  resource: VisualAsset,
  alt: string,
  width: number,
  style: ResolvedStyle,
): MeasuredContent {
  const preferred =
    block.kind === 'icon'
      ? style.contentSizing.iconBox[block.size]
      : style.contentSizing.widths[block.size].preferred;
  const targetWidth = Math.min(width, preferred);
  const height = slotHeight(block, targetWidth, resource.height / resource.width);
  return {
    width,
    height,
    anchors: [],
    outline: [alt],
    primitives: [
      {
        kind: 'media',
        digest: resource.digest,
        alt,
        dataUri: `data:${resource.mediaType};base64,${resource.base64}`,
        x: (width - targetWidth) / 2,
        y: 0,
        width: targetWidth,
        height,
        fit: block.fit,
      },
    ],
  };
}

/** Icons use square slots; images retain aspect up to a square, including portrait cover crops. */
function slotHeight(block: MediaBlock, width: number, ratio: number): number {
  if (block.kind === 'icon') return width;
  return Math.min(width, width * ratio);
}
