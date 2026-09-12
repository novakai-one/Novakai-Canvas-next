import { z } from 'zod';
import { digest, version } from '../brands.js';
/** Admission metadata supplied by the owner; no network lookup or platform fallback. */
export const fontPin = z
  .strictObject({
    family: z.string().regex(/^[A-Za-z][A-Za-z0-9 -]{0,127}$/),
    digest,
    approved: z.literal(true),
  })
  .readonly();
export const presetPin = z
  .strictObject({ kind: z.literal('theme'), id: z.string().min(1).max(120), version, digest })
  .readonly();
export type FontPin = z.infer<typeof fontPin>;
export type PresetPin = z.infer<typeof presetPin>;
export type PortableToken =
  | { readonly type: 'color'; readonly value: string }
  | {
      readonly type: 'dimension';
      readonly value: number;
      readonly unit: 'px' | 'world' | 'ms' | 'scalar';
    }
  | { readonly type: 'font'; readonly family: string; readonly digest: string };
export interface PortableTheme {
  readonly tokens: Readonly<Record<string, PortableToken>>;
  readonly roles: readonly string[];
  readonly fonts: readonly string[];
  readonly base: PresetPin | null;
}
export interface Paint {
  readonly fill: string;
  readonly stroke: string;
  readonly text: string;
}
export interface StyleProjection {
  readonly digest: string;
  readonly bodyFont: { readonly family: string; readonly digest: string };
  readonly monoFont: { readonly family: string; readonly digest: string };
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly padding: number;
  readonly gap: number;
  readonly stroke: number;
  readonly radius: number;
  readonly widths: { readonly small: number; readonly medium: number; readonly large: number };
  readonly roles: Readonly<Record<string, Paint>>;
  readonly surface: string;
  readonly text: string;
  readonly secondary: string;
  readonly border: string;
}
