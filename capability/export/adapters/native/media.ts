import sharp from 'sharp';
import type { MediaConverter } from '../../contract/render-types.js';
import type { Resource } from '../../contract/records/bundle.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
/** PDFKit embeds PNG/JPEG; admitted WebP and SVG image assets receive bounded PNG transcodes. */
export function createMediaConverter(): MediaConverter {
  /** Conversion affects the export only; original digests and portable resource bytes remain untouched. */
  async function convert(
    resources: readonly Resource[],
  ): Promise<Result<ReadonlyMap<string, string>>> {
    try {
      const images = resources.filter((item) => item.mediaType.startsWith('image/'));
      const entries = await Promise.all(images.map(convertImage));
      return { ok: true, value: new Map(entries) };
    } catch {
      return failure('encoding-failed', 'images', 'An admitted image could not be encoded for PDF');
    }
  }
  return { convert };
}
/** Static data URIs are the only callback keys; unknown or network links are rejected by the PDF adapter. */
async function convertImage(resource: Resource): Promise<readonly [string, string]> {
  const original = `data:${resource.mediaType};base64,${Buffer.from(resource.bytes).toString('base64')}`;
  if (['image/png', 'image/jpeg'].includes(resource.mediaType)) return [original, original];
  const bytes = await sharp(Buffer.from(resource.bytes), { limitInputPixels: 64000000 })
    .png()
    .toBuffer();
  return [original, `data:image/png;base64,${bytes.toString('base64')}`];
}
