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
/** Numeric/CSS styles come from the same token resolver; no palette or size default is duplicated here. */
export const resolvedStyle = z
  .strictObject({
    digest,
    bodyFont: fontRef,
    monoFont: fontRef,
    fontSize: positive,
    lineHeight: positive,
    padding: positive,
    gap: positive,
    stroke: positive,
    radius: z.number().min(0).max(1000),
    widths: z.strictObject({ small: positive, medium: positive, large: positive }).readonly(),
    roles: z.record(z.string(), paint),
    surface: color,
    text: color,
    secondary: color,
    border: color,
  })
  .readonly();
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
