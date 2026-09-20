import { z } from 'zod';
/** Open chrome key retained in the immutable preset; Presentation owns registration and card fallback. */
const chromeName = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z][a-z0-9-]*$/)
  .brand<'ChromeName'>();
import { digest, presetId, version } from '../brands.js';
export const kind = z.enum(['recipe', 'theme']);
export const family = z.enum(['er', 'modules', 'sop', 'mindmap', 'sequence', 'infographic']);
const text = z
  .string()
  .min(1)
  .max(256)
  .refine((value) => value.trim().length > 0);
/** Pins always include kind, release and content hash; aliases are selection inputs only. */
export const pin = z.strictObject({ kind, id: presetId, version, digest }).readonly();
export type Pin = z.infer<typeof pin>;
export const themePin = pin.refine((value) => value.kind === 'theme', 'Expected theme pin');
/** Resolved font tokens carry exact bytes; no operating-system alias survives admission. */
export const token = z.discriminatedUnion('type', [
  z
    .strictObject({
      type: z.literal('color'),
      value: z.string().regex(/^#[a-fA-F0-9]{6}([a-fA-F0-9]{2})?$/),
    })
    .readonly(),
  z
    .strictObject({
      type: z.literal('dimension'),
      value: z.number().finite(),
      unit: z.enum(['px', 'world', 'ms', 'scalar']),
    })
    .readonly(),
  z.strictObject({ type: z.literal('font'), family: text, digest }).readonly(),
]);
export const recipePayload = z
  .strictObject({
    languageVersion: z.literal(1),
    source: z
      .string()
      .min(1)
      .max(1024 * 1024),
    family,
    assets: z.array(digest).max(1000).readonly(),
    themes: z.array(themePin).max(100).readonly(),
  })
  .readonly();
export const themePayload = z
  .strictObject({
    chrome: chromeName.optional(),
    tokens: z
      .record(z.string().min(1).max(120), token)
      .refine((values) => Object.keys(values).length <= 1000),
    roles: z.array(text).min(1).max(100).readonly(),
    fonts: z.array(digest).max(100).readonly(),
    base: themePin.nullable(),
  })
  .readonly();
export type RecipePayload = z.infer<typeof recipePayload>;
export type ThemePayload = z.infer<typeof themePayload>;
const header = {
  schemaVersion: z.literal(1),
  id: presetId,
  version,
  title: text,
  description: z.string().max(4096),
};
/** Immutable normalized records; both variants use the same identity and admission lifecycle. */
export const preset = z.discriminatedUnion('kind', [
  z
    .strictObject({ ...header, kind: z.literal('recipe'), payload: recipePayload, digest })
    .readonly(),
  z.strictObject({ ...header, kind: z.literal('theme'), payload: themePayload, digest }).readonly(),
]);
export type Preset = z.infer<typeof preset>;
export type ThemePreset = Extract<Preset, { kind: 'theme' }>;
export const catalog = z.array(preset).max(1000).readonly();
export type Catalog = z.infer<typeof catalog>;
/** Submitted source or delta is resolved only by the required syntax/token owner. */
export const admission = z.discriminatedUnion('kind', [
  z
    .strictObject({
      ...header,
      kind: z.literal('recipe'),
      source: z
        .string()
        .min(1)
        .max(1024 * 1024),
      family,
    })
    .readonly(),
  z.strictObject({ ...header, kind: z.literal('theme'), raw: z.unknown() }).readonly(),
]);
export type Admission = z.infer<typeof admission>;
export const selection = z
  .strictObject({ kind, id: presetId, version: version.optional(), digest: digest.optional() })
  .refine((value) => !value.digest || !!value.version, 'Digest requires an exact version')
  .readonly();
export type Selection = z.infer<typeof selection>;
export const query = z
  .strictObject({ search: z.string().max(256).default(''), kind: kind.optional() })
  .readonly();
export type Query = z.infer<typeof query>;
/** Checked theme selector projected from the full admission envelope. */
export const themeInput = z.object({ kind: z.literal('theme'), id: presetId }).readonly();
export const expansionRequest = z.strictObject({ pin, namespace: presetId }).readonly();
export type ExpansionRequest = z.infer<typeof expansionRequest>;
