import type { ContentBlock, InputCollection } from '../../contract/records/input.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { AssetReader } from '../../contract/ports/resources.js';
import { visualAsset } from '../../contract/records/style.js';
import type { ResolvedStyle } from '../../contract/records/style.js';
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
  const targetWidth = Math.min(width, style.widths[block.size]);
  return {
    width: targetWidth,
    height: (targetWidth * resource.height) / resource.width,
    anchors: [],
    outline: [binding.alt],
    primitives: [
      {
        kind: 'media',
        digest: resource.digest,
        alt: binding.alt,
        dataUri: `data:${resource.mediaType};base64,${resource.base64}`,
        x: 0,
        y: 0,
        width: targetWidth,
        height: (targetWidth * resource.height) / resource.width,
        fit: block.fit,
      },
    ],
  };
}
