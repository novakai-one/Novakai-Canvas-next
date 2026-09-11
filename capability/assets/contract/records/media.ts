import { z } from 'zod';
import { digest } from '../brands.js';
/** Product admission limits; codecs enforce the same decoded size/dimension ceiling. */
export const limits = Object.freeze({
  bytes: 16 * 1024 * 1024,
  pixels: 32_000_000,
  dimension: 16384,
  svgBytes: 1024 * 1024,
  svgElements: 4096,
  svgDepth: 64,
  glyphs: 65535,
});
export const mediaType = z.enum([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
]);
export type SupportedMedia = z.infer<typeof mediaType>;
export const base64 = z
  .string()
  .min(4)
  .max(Math.ceil(limits.bytes / 3) * 4)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
export const provenance = z
  .strictObject({
    source: z.string().min(1).max(2048),
    license: z.string().max(4096).optional(),
    attribution: z.string().max(4096).optional(),
  })
  .readonly();
export const stageInput = z.strictObject({
  base64,
  mediaType,
  alt: z.string().max(4096),
  provenance,
});
export type StageInput = z.infer<typeof stageInput>;
export const normalizedMedia = z
  .strictObject({
    base64,
    mediaType,
    kind: z.enum(['image', 'icon', 'font']),
    width: z.number().positive().max(limits.dimension).nullable(),
    height: z.number().positive().max(limits.dimension).nullable(),
    fontFamily: z.string().min(1).max(1024).nullable(),
  })
  .readonly();
export type NormalizedMedia = z.infer<typeof normalizedMedia>;
export const descriptor = normalizedMedia
  .unwrap()
  .omit({ base64: true })
  .extend({ digest, byteLength: z.number().int().positive().max(limits.bytes) })
  .readonly();
export type BlobDescriptor = z.infer<typeof descriptor>;
export const storedBlob = z.strictObject({ descriptor, base64 }).readonly();
export type StoredBlob = z.infer<typeof storedBlob>;
export interface Admission {
  readonly descriptor: BlobDescriptor;
  readonly originalDigest: import('../brands.js').Digest;
  readonly alt: string;
  readonly provenance: z.infer<typeof provenance>;
}
