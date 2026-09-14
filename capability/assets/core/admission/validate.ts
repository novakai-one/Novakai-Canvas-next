import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import { stageInput, normalizedMedia, limits } from '../../contract/records/media.js';
import type { StageInput, NormalizedMedia } from '../../contract/records/media.js';
import { parse, success } from '../validation/outcomes.js';
/** Base64 alphabet/round-trip validation belongs to the identity adapter; this computes bounded decoded size. */
export function byteLength(base64: string): number {
  const padding = base64.length - base64.replace(/=+$/, '').length;
  return (base64.length * 3) / 4 - padding;
}
/** Alt text is required for visual assets; font accessibility is represented by its family and labels. */
function missingAlt(input: StageInput): boolean {
  return !input.mediaType.startsWith('font/') && input.alt.trim().length === 0;
}
/** Validate metadata before handing bytes to any expensive codec. */
export function validateInput(input: unknown): Result<StageInput> {
  const parsed = parse(stageInput, input);
  if (!parsed.ok) return parsed;
  if (missingAlt(parsed.value))
    return fail('invalid-input', 'alt', 'Visual media requires descriptive alt text');
  return checkInputSize(parsed.value);
}
/** Input limit precedes normalization; output is independently checked after processing. */
function checkInputSize(input: StageInput): Result<StageInput> {
  if (byteLength(input.base64) > limits.bytes)
    return fail('invalid-input', 'base64', 'Asset exceeds byte limit');
  return success(input);
}
/** Processor outputs must remain bounded and structurally honest, even for injected implementations. */
export function validateNormalized(input: unknown): Result<NormalizedMedia> {
  const parsed = parse(normalizedMedia, input, 'unsafe-media');
  if (!parsed.ok) return parsed;
  if (byteLength(parsed.value.base64) > limits.bytes)
    return fail('unsafe-media', 'base64', 'Normalized asset exceeds byte limit');
  return checkMetrics(parsed.value);
}
/** Fonts have family identity; visual media has measured dimensions, never caller-provided guesses. */
function checkMetrics(media: NormalizedMedia): Result<NormalizedMedia> {
  if (media.kind === 'font') return checkFontMetrics(media);
  if (media.width === null || media.height === null)
    return fail('unsafe-media', 'dimensions', 'Visual media requires measured dimensions');
  return success(media);
}
/** Nullable dimensions are deliberate for fonts; finite metrics were checked by the font processor. */
function checkFontMetrics(media: NormalizedMedia): Result<NormalizedMedia> {
  if (media.fontFamily === null)
    return fail('unsafe-media', 'fontFamily', 'Font requires a family name');
  return success(media);
}
