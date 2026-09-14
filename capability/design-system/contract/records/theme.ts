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
  readonly chrome?: string | undefined;
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
/** Exact font identity and absolute line box; Presentation rejects invalid projections. */
export interface TextMetric {
  readonly font: { readonly family: string; readonly digest: string };
  readonly size: number;
  readonly lineHeight: number;
}
/** Semantic hierarchy preserves pinned body/mono font parity. */
export interface DiagramTypography {
  readonly sectionHeading: TextMetric;
  readonly nodeHeading: TextMetric;
  readonly body: TextMetric;
  readonly mono: TextMetric;
  readonly annotation: TextMetric;
  readonly caption: TextMetric;
}
/** Preferred and maximum interior widths are positive and ordered. */
export interface SizeBand {
  readonly preferred: number;
  readonly maximum: number;
}
/** Token-derived measurement policy, independent of UI preferences. */
export interface ContentSizing {
  readonly widths: Readonly<Record<'small' | 'medium' | 'large', SizeBand>>;
  readonly rowMinimum: number;
  readonly iconBox: Readonly<Record<'small' | 'medium' | 'large', number>>;
  /** Prominent figure slots scale with the same root spacing policy as content widths. */
  readonly figureBox: Readonly<Record<'small' | 'medium' | 'large', number>>;
}
/** Complete numeric projection; consumers keep the prior scene on validation failure. */
export interface StyleProjection {
  readonly chrome?: string | undefined;
  readonly headers?: Readonly<Record<string, string>>;
  readonly elevation?: {
    readonly offsetX: number;
    readonly offsetY: number;
    readonly blur: number;
    readonly color: string;
  };
  readonly chromeMetrics?: {
    readonly tabWidth: number;
    readonly tabHeight: number;
    readonly accentWidth: number;
  };
  readonly digest: string;
  readonly bodyFont: TextMetric['font'];
  readonly monoFont: TextMetric['font'];
  /** Admitted display-weight face pinned by heading typography roles. */
  readonly strongFont: TextMetric['font'];
  readonly typography: DiagramTypography;
  readonly contentSizing: ContentSizing;
  /** Diagram wire paint and dimensions; Canvas and Export consume the same admitted values. */
  readonly connection: {
    readonly paint: Paint;
    readonly width: number;
    readonly dash: readonly [number, number];
  };
  readonly padding: number;
  readonly gap: number;
  readonly stroke: number;
  readonly radius: number;
  readonly roles: Readonly<Record<string, Paint>>;
  readonly surface: string;
  readonly text: string;
  readonly secondary: string;
  readonly border: string;
}
