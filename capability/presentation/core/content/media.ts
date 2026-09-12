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
  emphasis: 'inline' | 'figure' = 'inline',
): MeasuredContent {
  const binding = collection.assets.find((value) => value.id === block.asset);
  if (!binding) return reject('missing-resource', block.asset, 'Asset binding is absent');
  const resource = parse(visualAsset, requireValue(assets.read(binding.digest.slice(7))));
  if (`sha256:${resource.digest}` !== binding.digest)
    return reject('missing-resource', binding.id, 'Asset reader returned a different digest');
  return slot(block, resource, binding.alt, width, style, emphasis);
}
type MediaBlock = Extract<ContentBlock, { kind: 'image' | 'icon' }>;
/** Bounded media slots center in the final node interior; public projection owns resource rejection. */
function slot(
  block: MediaBlock,
  resource: VisualAsset,
  alt: string,
  width: number,
  style: ResolvedStyle,
  emphasis: 'inline' | 'figure',
): MeasuredContent {
  const preferred = preferredWidth(block, style, emphasis);
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

/** Figure emphasis is a semantic composition choice, while inline symbols retain their compact slots. */
function preferredWidth(
  block: MediaBlock,
  style: ResolvedStyle,
  emphasis: 'inline' | 'figure',
): number {
  if (emphasis === 'figure') return style.contentSizing.figureBox[block.size];
  if (block.kind === 'icon') return style.contentSizing.iconBox[block.size];
  return style.contentSizing.widths[block.size].preferred;
}

/** Contained images retain portrait extent; explicit cover uses a bounded square crop. */
function slotHeight(block: MediaBlock, width: number, ratio: number): number {
  if (block.kind === 'icon') return width;
  if (block.fit === 'cover') return width;
  return width * ratio;
}
