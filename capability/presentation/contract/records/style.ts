import { z } from 'zod';
import { digest } from '../brands.js';
export const color = z.string().regex(/^#[a-fA-F0-9]{6}([a-fA-F0-9]{2})?$/);
export const fontRef = z.strictObject({ digest, family: z.string().min(1).max(256) }).readonly();
export type FontRef = z.infer<typeof fontRef>;
/** Exact admitted bytes reach measurement and rendering together; no OS-font alias is accepted here. */
export const fontSource = fontRef
  .unwrap()
  .extend({
    mediaType: z.enum(['font/woff2', 'font/woff', 'font/ttf', 'font/otf']),
    base64: z
      .string()
      .min(4)
      .max(24 * 1024 * 1024)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  })
  .readonly();
export type FontSource = z.infer<typeof fontSource>;
export const fontSet = z.array(fontSource).min(1).max(100).readonly();
export type FontSet = z.infer<typeof fontSet>;
export const paint = z.strictObject({ fill: color, stroke: color, text: color }).readonly();
export type Paint = z.infer<typeof paint>;
const positive = z.number().finite().positive().max(10000);
/** Diagram-owned wire paint travels with the scene; UI theme never substitutes its own stroke. */
export const connectionStyle = z
  .strictObject({
    paint,
    width: positive,
    dash: z.tuple([positive, positive]).readonly(),
  })
  .readonly();
export type ConnectionStyle = z.infer<typeof connectionStyle>;
/** Absolute role metrics use the exact admitted font; malformed values fail the public reader. */
export const textMetric = z
  .strictObject({ font: fontRef, size: positive, lineHeight: positive })
  .readonly();
/** Validated absolute font and line-box metrics consumed by every renderer. */
export type TextMetric = z.infer<typeof textMetric>;
/** Semantic text roles share body bytes except for the explicit monospace role. */
export const diagramTypography = z
  .strictObject({
    sectionHeading: textMetric,
    nodeHeading: textMetric,
    body: textMetric,
    mono: textMetric,
    annotation: textMetric,
    caption: textMetric,
  })
  .readonly();
/** Validated semantic typography roles sharing pinned body/mono identities. */
export type DiagramTypography = z.infer<typeof diagramTypography>;
/** Interior width bands reject inverted limits instead of silently changing their meaning. */
export const sizeBand = z
  .strictObject({ preferred: positive, maximum: positive })
  .refine((band) => band.preferred <= band.maximum)
  .readonly();
/** Validated preferred and maximum interior widths for one density band. */
export type SizeBand = z.infer<typeof sizeBand>;
/** Content widths, row floors and icon slots have one token-derived authority. */
export const contentSizing = z
  .strictObject({
    widths: z.strictObject({ small: sizeBand, medium: sizeBand, large: sizeBand }).readonly(),
    rowMinimum: positive,
    figureBox: z.strictObject({ small: positive, medium: positive, large: positive }).readonly(),
    iconBox: z.strictObject({ small: positive, medium: positive, large: positive }).readonly(),
  })
  .readonly();
/** Validated width, row and icon measurement policy for projected content. */
export type ContentSizing = z.infer<typeof contentSizing>;
/** Numeric/CSS styles come from the same token resolver; no palette or size default is duplicated here. */
export const resolvedStyle = z
  .strictObject({
    digest,
    bodyFont: fontRef,
    monoFont: fontRef,
    typography: diagramTypography,
    contentSizing,
    connection: connectionStyle,
    padding: positive,
    gap: positive,
    stroke: positive,
    radius: z.number().min(0).max(1000),
    roles: z.record(z.string(), paint).readonly(),
    surface: color,
    text: color,
    secondary: color,
    border: color,
  })
  .refine(matchingFonts, { message: 'Typography roles must use their pinned body/mono font bytes' })
  .readonly();
/** Reject mismatched role bytes before measurement; the public reader owns typed recovery. */
function matchingFonts(style: {
  readonly bodyFont: FontRef;
  readonly monoFont: FontRef;
  readonly typography: DiagramTypography;
}): boolean {
  return Object.entries(style.typography).every(([role, metric]) => {
    const expected = role === 'mono' ? style.monoFont : style.bodyFont;
    return metric.font.digest === expected.digest && metric.font.family === expected.family;
  });
}
export type ResolvedStyle = z.infer<typeof resolvedStyle>;
/** Reader returns safe local bytes and mechanically verified dimensions; no remote URLs. */
export const visualAsset = z
  .strictObject({
    digest,
    mediaType: z.enum(['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']),
    base64: z
      .string()
      .min(4)
      .max(24 * 1024 * 1024)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/),
    width: positive,
    height: positive,
  })
  .readonly();
export type VisualAsset = z.infer<typeof visualAsset>;
