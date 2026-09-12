import { Resvg } from '@resvg/resvg-wasm';
import type { FontDecoder, RenderDependencies, NativeFont } from '../../contract/render-types.js';
import type { FormatHandler, RenderInput } from '../../contract/ports/formats.js';
import type { Result } from '../../contract/errors.js';
import type { Encoded } from '../../contract/records/artifact.js';
import { failure } from '../../contract/errors.js';
/** WASM is initialized once by composition; each bounded render owns and frees its native allocations. */
export function createPngEncoder(
  deps: Pick<RenderDependencies, 'renderer'>,
  fonts: FontDecoder,
): FormatHandler {
  /** Missing fonts or renderer failures return no partial PNG; the outer job releases its revision. */
  async function encode(input: RenderInput): Promise<Result<Encoded>> {
    const rendered = deps.renderer.render(input);
    if (!rendered.ok) return rendered;
    const decoded = await fonts.decode();
    if (!decoded.ok) return decoded;
    return afterFonts(rendered.value, input, decoded.value);
  }
  return { encode };
}
/** Only generated digest family attributes are normalized; SVG output keeps original embedded font rules. */
function bindFamilies(svg: string, fonts: readonly NativeFont[]): string {
  return fonts.reduce(
    (text, font) =>
      text.replaceAll(
        `font-family="${font.alias}"`,
        `font-family="${escapeAttribute(font.family)}"`,
      ),
    svg,
  );
}
/** Family names originate in font bytes but still require XML attribute escaping. */
function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}
/** Fixed allocation limits are rechecked at the concrete seam for direct adapter consumers. */
function rasterize(svg: string, input: RenderInput, fonts: readonly NativeFont[]): Result<Encoded> {
  const width = Math.ceil(input.selection.bounds.width * input.request.scale);
  const height = Math.ceil(input.selection.bounds.height * input.request.scale);
  if (Math.max(width, height) > 8192 || width * height > 64000000)
    return failure(
      'limit-exceeded',
      'raster',
      'Raster dimensions exceed the native allocation budget',
    );
  try {
    return renderNative(bindFamilies(svg, fonts), input, fonts, width, height);
  } catch {
    return failure('encoding-failed', 'png', 'Native raster encoding failed');
  }
}
/** Both rasterizer and image are disposed even when encoding throws. */
function renderNative(
  svg: string,
  input: RenderInput,
  fonts: readonly NativeFont[],
  width: number,
  height: number,
): Result<Encoded> {
  const viewport = rasterViewport(svg, width, height, input.request.scale);
  const renderer = new Resvg(viewport, {
    font: { fontBuffers: fonts.map((font) => font.bytes) },
  });
  try {
    return readImage(renderer, width, height);
  } finally {
    renderer.free();
  }
}
/** Integral outer pixels preserve the requested scale, adding only the fractional remainder as edge padding. */
function rasterViewport(svg: string, width: number, height: number, scale: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width / scale} ${height / scale}">${svg}</svg>`;
}
/** Dimensions and signature are independent output checks, not assumptions about the native binding. */
function readImage(
  renderer: InstanceType<typeof Resvg>,
  width: number,
  height: number,
): Result<Encoded> {
  const image = renderer.render();
  try {
    const bytes = image.asPng().slice();
    if (image.width !== width || image.height !== height)
      return failure('encoding-failed', 'png', 'Native dimensions differ from the planned raster');
    return { ok: true, value: { bytes, pages: [], warnings: [] } };
  } finally {
    image.free();
  }
}

/** Native raster is bounded but synchronous; cancellation is checked immediately after async font work. */
function afterFonts(
  svg: string,
  input: RenderInput,
  fonts: readonly NativeFont[],
): Result<Encoded> {
  if (input.signal.aborted)
    return failure('cancelled', '$', 'Export cancelled after font decoding');
  return rasterize(svg, input, fonts);
}
