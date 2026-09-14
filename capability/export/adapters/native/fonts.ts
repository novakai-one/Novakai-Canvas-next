import { create } from 'fontkit';
import type { FontSet } from '@novakai/canvas-presentation';
import type { FontDecoder, NativeFont } from '../../contract/render-types.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
/** WOFF2 decoder is injected because native raster accepts sfnt buffers, not browser font-face aliases. */
export function createFontDecoder(
  fonts: FontSet,
  decompress: (bytes: Uint8Array) => Promise<Uint8Array>,
): FontDecoder {
  /** Every exact digest must map to a unique internal family; ambiguous substitutions are rejected. */
  async function decode(): Promise<Result<readonly NativeFont[]>> {
    try {
      if (fonts.length === 0)
        return failure('encoding-failed', 'fonts', 'At least one exact pinned font is required');
      const decoded = await Promise.all(fonts.map(decodeFont));
      return distinctFamilies(decoded);
    } catch {
      return failure('encoding-failed', 'fonts', 'Exact pinned font bytes could not be decoded');
    }
  }
  /** Font metadata comes from actual bytes, never a caller's friendly family alias. */
  async function decodeFont(font: FontSet[number]): Promise<NativeFont> {
    const original = Buffer.from(font.base64, 'base64');
    const bytes = await nativeBytes(original, font.mediaType);
    const parsed = create(Buffer.from(bytes));
    if (!('familyName' in parsed))
      throw new Error('Font collections are not an admitted font source');
    return { alias: `canvas-${font.digest}`, family: parsed.familyName, bytes };
  }
  /** Existing sfnt bytes pass through; only WOFF2 requires decompression for resvg. */
  async function nativeBytes(bytes: Uint8Array, mediaType: string): Promise<Uint8Array> {
    if (mediaType === 'font/woff2') return decompress(bytes);
    return bytes;
  }
  return { decode };
}

/** Ambiguous internal names would permit native font substitution; fail explicitly instead. */
function distinctFamilies(fonts: readonly NativeFont[]): Result<readonly NativeFont[]> {
  if (new Set(fonts.map((font) => font.family)).size !== fonts.length)
    return failure(
      'encoding-failed',
      'fonts',
      'Distinct pinned fonts share an ambiguous internal family',
    );
  return { ok: true, value: fonts };
}
