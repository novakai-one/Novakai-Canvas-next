import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import type { SupportedMedia } from '../contract/records/media.js';
interface Signature {
  readonly mediaType: SupportedMedia;
  readonly matches: (bytes: Buffer) => boolean;
}
/** Ordered byte signatures only choose a strict processor; they never prove an asset safe by themselves. */
const signatures: readonly Signature[] = [
  {
    mediaType: 'image/png',
    matches: (bytes) => bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a',
  },
  {
    mediaType: 'image/jpeg',
    matches: (bytes) => bytes.subarray(0, 3).toString('hex') === 'ffd8ff',
  },
  {
    mediaType: 'image/webp',
    matches: (bytes) =>
      bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP',
  },
  {
    mediaType: 'font/ttf',
    matches: (bytes) => bytes.subarray(0, 4).toString('hex') === '00010000',
  },
  { mediaType: 'font/otf', matches: (bytes) => bytes.subarray(0, 4).toString() === 'OTTO' },
  { mediaType: 'font/woff', matches: (bytes) => bytes.subarray(0, 4).toString() === 'wOFF' },
  { mediaType: 'font/woff2', matches: (bytes) => bytes.subarray(0, 4).toString() === 'wOF2' },
  {
    mediaType: 'image/svg+xml',
    matches: (bytes) => bytes.toString('utf8', 0, 256).trimStart().startsWith('<'),
  },
];
/** Restore has no trusted MIME; signature selection is followed by full handler validation. */
export function detectMedia(encoded: string): Result<SupportedMedia> {
  try {
    const bytes = Buffer.from(encoded, 'base64');
    const signature = signatures.find((signature) => signature.matches(bytes));
    if (!signature)
      return fail('unsupported-media', 'mediaType', 'No supported media signature found');
    return { ok: true, value: signature.mediaType };
  } catch {
    return fail('invalid-input', 'base64', 'Media bytes could not be decoded');
  }
}
