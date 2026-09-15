import { z } from 'zod';
import { chromeName, type ChromeName } from '../../../design-system/contract/index.js';
/** Design System owns registry-key validation; Presentation owns registration and card fallback. */
export { chromeName, type ChromeName };
/** Canonical lowercase sRGB hex with optional alpha byte for chrome-owned ink. */
export const hexColor = z
  .string()
  .regex(/^#[0-9a-f]{6}([0-9a-f]{2})?$/)
  .brand<'HexColor'>();
/** Nonblank chrome compartment caption; validation preserves the exact display bytes. */
export const sectionLabel = z
  .string()
  .refine((value) => value.trim().length > 0)
  .brand<'ChromeSectionLabel'>();
/** React-free measurement decisions supplied by each registered chrome. */
export const chromePolicy = z
  .strictObject({ showKind: z.boolean(), sectionLabel: sectionLabel.optional() })
  .readonly();
/** Immutable checked heading policy with an optional compartment caption. */
export type ChromePolicy = z.infer<typeof chromePolicy>;
/** Open checked registry keys map to React-free policy; theme selectors are not a closed enum. */
export type ChromePolicies = Readonly<Record<ChromeName, ChromePolicy>>;

/** Nonempty SVG path data emitted by the trusted folder geometry serializer, never authored diagram coordinates. */
export const chromeOutline = z.string().min(1).brand<'ChromeOutline'>();
/** Serialized frame outline with checked string presence; native SVG owns path interpretation. */
export type ChromeOutline = z.infer<typeof chromeOutline>;
