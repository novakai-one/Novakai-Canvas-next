import sharp from 'sharp';
import type { Sharp, Metadata } from 'sharp';
import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import { limits } from '../contract/records/media.js';
import type { NormalizedMedia, SupportedMedia } from '../contract/records/media.js';
import type { MediaHandler } from '../contract/ports/media.js';
/** Minimal native codec construction slot for controlled parser failures. */
type RasterFactory = (bytes: Uint8Array) => Pick<Sharp, 'metadata' | 'rotate' | 'png' | 'toBuffer'>;
const rasterFormats: Readonly<Partial<Record<SupportedMedia, string>>> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
};
/** Header checks reject format spoofing and animation before full bounded pixel decode. */
function inspectMetadata(metadata: Metadata, declared: SupportedMedia): Result<void> {
  if (metadata.format !== rasterFormats[declared])
    return fail('unsupported-media', 'mediaType', 'Declared raster format differs from bytes');
  if ((metadata.pages ?? 1) !== 1)
    return fail('unsafe-media', 'pages', 'Animated or multipage images are not admitted');
  return checkDimensions(metadata.width, metadata.height);
}
/** Independent dimension ceiling complements the codec's decoded pixel budget. */
function checkDimensions(width: number, height: number): Result<void> {
  if (Math.max(width, height) > limits.dimension)
    return fail('unsafe-media', 'dimensions', 'Raster dimension exceeds limit');
  if (width * height > limits.pixels)
    return fail('unsafe-media', 'dimensions', 'Raster pixel count exceeds limit');
  return { ok: true, value: undefined };
}
/** Full decode/re-encode removes metadata and normalizes orientation; metadata-only parsing is insufficient. */
async function normalizeRaster(
  encoded: string,
  declared: SupportedMedia,
  create: RasterFactory,
): Promise<Result<NormalizedMedia>> {
  const pipeline = create(Buffer.from(encoded, 'base64'));
  const metadata = await pipeline.metadata();
  const checked = inspectMetadata(metadata, declared);
  if (!checked.ok) return checked;
  const rotated = pipeline.rotate();
  const output = rotated.png({ compressionLevel: 9, adaptiveFiltering: false });
  const decoded = await output.toBuffer({ resolveWithObject: true });
  return {
    ok: true,
    value: {
      base64: decoded.data.toString('base64'),
      mediaType: 'image/png',
      kind: 'image',
      width: decoded.info.width,
      height: decoded.info.height,
      fontFamily: null,
    },
  };
}
/** Typed native failure boundary; correct unsafe bytes before retry, Assets owns orphan cleanup. */
async function protectRaster(
  encoded: string,
  declared: SupportedMedia,
  create: RasterFactory,
): Promise<Result<NormalizedMedia>> {
  try {
    return await normalizeRaster(encoded, declared, create);
  } catch {
    return fail('unsafe-media', 'base64', 'Raster decoding failed within admission limits');
  }
}
/** Bind codec once; its built-in pixel limit stays enabled for the complete decoding pipeline. */
export function createRaster(
  create: RasterFactory = (bytes) =>
    sharp(bytes, { limitInputPixels: limits.pixels, failOn: 'warning' }),
): MediaHandler {
  return {
    mediaTypes: ['image/png', 'image/jpeg', 'image/webp'],
    normalize: (encoded, declared) => protectRaster(encoded, declared, create),
  };
}
