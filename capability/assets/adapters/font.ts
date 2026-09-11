import { create } from 'fontkit';
import type { Font, FontCollection } from 'fontkit';
import { fail } from '../contract/errors.js';
import type { Result } from '../contract/errors.js';
import { limits } from '../contract/records/media.js';
import type { NormalizedMedia, SupportedMedia } from '../contract/records/media.js';
import type { MediaHandler } from '../contract/ports/media.js';
type FontFactory = (bytes: Buffer) => Font | FontCollection;
const signatures: Readonly<Partial<Record<SupportedMedia, string>>> = {
  'font/ttf': '00010000',
  'font/otf': '4f54544f',
  'font/woff': '774f4646',
  'font/woff2': '774f4632',
};
/** Fontkit accepts collections too; this contract admits exactly one bounded family. */
function inspectFont(font: Font | FontCollection): Result<Font> {
  if (!('numGlyphs' in font))
    return fail('unsupported-media', 'font', 'Font collections require selecting one font first');
  if (font.numGlyphs < 1 || font.numGlyphs > limits.glyphs)
    return fail('unsafe-media', 'glyphs', 'Font glyph count exceeds limits');
  return checkFontMetrics(font);
}
/** Force parsed family/metrics reads so corrupt deferred tables fail before bytes are admitted. */
function checkFontMetrics(font: Font): Result<Font> {
  if (!Number.isFinite(font.unitsPerEm) || font.unitsPerEm <= 0)
    return fail('unsafe-media', 'unitsPerEm', 'Font metric scale is invalid');
  if (!font.familyName) return fail('unsafe-media', 'fontFamily', 'Font has no family name');
  return { ok: true, value: font };
}
/** Supplied MIME must match file signature; raw font bytes are retained without a lossy conversion. */
function normalizeFont(
  encoded: string,
  declared: SupportedMedia,
  parseFont: FontFactory,
): Result<NormalizedMedia> {
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.subarray(0, 4).toString('hex') !== signatures[declared])
    return fail('unsupported-media', 'mediaType', 'Font signature differs from declared format');
  const expanded = checkExpandedSize(bytes, declared);
  if (!expanded.ok) return expanded;
  return parseSingleFont(encoded, declared, bytes, parseFont);
}
/** WOFF headers declare expanded SFNT size; reject oversized expansion before decompression. */
function checkExpandedSize(bytes: Buffer, declared: SupportedMedia): Result<void> {
  if (!['font/woff', 'font/woff2'].includes(declared)) return { ok: true, value: undefined };
  if (bytes.readUInt32BE(16) > limits.bytes)
    return fail('unsafe-media', 'font', 'Expanded font exceeds byte limit');
  return { ok: true, value: undefined };
}
/** Parse one bounded font and expose only its mechanically derived descriptor fields. */
function parseSingleFont(
  encoded: string,
  declared: SupportedMedia,
  bytes: Buffer,
  parseFont: FontFactory,
): Result<NormalizedMedia> {
  const checked = inspectFont(parseFont(bytes));
  if (!checked.ok) return checked;
  return {
    ok: true,
    value: {
      base64: encoded,
      mediaType: declared,
      kind: 'font',
      width: null,
      height: null,
      fontFamily: checked.value.familyName,
    },
  };
}
/** Native parser exceptions are typed unsafe-media; caller corrects bytes, not exception strings. */
async function protectFont(
  encoded: string,
  declared: SupportedMedia,
  parseFont: FontFactory,
): Promise<Result<NormalizedMedia>> {
  try {
    return normalizeFont(encoded, declared, parseFont);
  } catch {
    return fail('unsafe-media', 'font', 'Font tables could not be parsed safely');
  }
}
/** Bind the font engine behind the consumer-owned normalization interface. */
export function createFont(parseFont: FontFactory = create): MediaHandler {
  return {
    mediaTypes: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2'],
    normalize: (encoded, declared) => protectFont(encoded, declared, parseFont),
  };
}
