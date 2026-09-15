import { z } from 'zod';
/** Open Presentation registry key; unknown names select card and new chromes require no enum edit. */
export const chromeName = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z][a-z0-9-]*$/)
  .brand<'ChromeName'>();
/** Checked registry key, structurally compatible with the Design System transport. */
export type ChromeName = z.infer<typeof chromeName>;
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
