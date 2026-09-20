import { z } from 'zod';
import { assetId, descendantId, label, objectId, sectionId, size } from '../brands.js';
import { fieldTypeSchema, typeUseSchema } from './definition.js';
import { figureLevelSchema, textRoleSchema } from './composition.js';

/** Canonical object address, optionally narrowed to an addressable descendant. */
export const endpointSchema = z
  .strictObject({ object: objectId, member: descendantId.optional() })
  .readonly();
const textBlockSchema = z
  .strictObject({
    kind: z.literal('text'),
    id: descendantId,
    text: z.string(),
    role: textRoleSchema.default('body'),
  })
  .readonly();
const codeBlockSchema = z
  .strictObject({
    kind: z.literal('code'),
    id: descendantId,
    text: z.string(),
    language: z.string().optional(),
  })
  .readonly();
const listBlockSchema = z
  .strictObject({
    kind: z.literal('list'),
    id: descendantId,
    items: z.array(z.string()).readonly(),
    ordered: z.boolean().default(false),
  })
  .readonly();
const imageBlockSchema = z
  .strictObject({
    kind: z.enum(['image', 'icon']),
    id: descendantId,
    asset: assetId,
    size: size.default('medium'),
    fit: z.enum(['contain', 'cover']).default('contain'),
  })
  .readonly();
/** App-drawn parametric figures; artwork derives from theme tokens, never from per-domain assets. */
const figureBlockSchema = z.discriminatedUnion('form', [
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('vessel'),
      level: figureLevelSchema.default('half'),
      agitator: z.boolean().default(false),
      mark: z.enum(['none', 'check', 'shield']).default('none'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('layered-bed'),
      level: figureLevelSchema.default('full'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('screen'),
      debris: z.enum(['none', 'some']).default('some'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('gauge'),
      level: figureLevelSchema.default('half'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('window'),
      fill: figureLevelSchema.default('half'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('gate'),
      pass: z.enum(['one', 'few']).default('few'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('stack'),
      layers: z.enum(['few', 'some', 'many']).default('some'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('store'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('queue'),
      level: figureLevelSchema.default('half'),
      size: size.default('medium'),
    })
    .readonly(),
  z
    .strictObject({
      kind: z.literal('figure'),
      id: descendantId,
      form: z.literal('cloud'),
      size: size.default('medium'),
    })
    .readonly(),
]);

/** Local links may select a section; URI links remain external references. */
const linkTargetSchema = z.discriminatedUnion('kind', [
  z
    .strictObject({ kind: z.literal('object'), id: objectId, section: sectionId.optional() })
    .readonly(),
  z.strictObject({ kind: z.literal('uri'), uri: label }).readonly(),
]);
const linkBlockSchema = z
  .strictObject({ kind: z.literal('link'), id: descendantId, label, target: linkTargetSchema })
  .readonly();

/** Scalar ER key metadata. Core requires references only for foreign keys. */
const fieldSchema = z
  .strictObject({
    kind: z.literal('field'),
    id: descendantId,
    label,
    type: fieldTypeSchema,
    nullable: z.boolean().default(false),
    key: z.enum(['primary', 'foreign', 'unique']).optional(),
    references: endpointSchema.optional(),
  })
  .readonly();

/** Field order is significant for composite keys and their foreign references. */
const keyGroupSchema = z
  .strictObject({
    kind: z.literal('keygroup'),
    id: descendantId,
    key: z.enum(['primary', 'foreign', 'unique']),
    fields: z.array(descendantId).min(1).readonly(),
    references: z.array(endpointSchema).readonly().optional(),
  })
  .readonly();

/** Callable type information displayed as structured content, not executable code. */
const signatureSchema = z
  .strictObject({
    kind: z.literal('signature'),
    id: descendantId,
    label,
    parameters: z
      .array(z.union([label, z.strictObject({ name: label, type: typeUseSchema }).readonly()]))
      .readonly(),
    returns: typeUseSchema,
  })
  .readonly();
const memberSchema = z
  .strictObject({
    kind: z.literal('member'),
    id: descendantId,
    label,
    type: typeUseSchema,
    visibility: z.enum(['public', 'private', 'protected']).default('public'),
  })
  .readonly();

/** Row identities share the owning object descendant scope; core checks cell count. */
const tableRowSchema = z
  .strictObject({ id: descendantId, cells: z.array(z.string()).readonly() })
  .readonly();
const tableBlockSchema = z
  .strictObject({
    kind: z.literal('table'),
    id: descendantId,
    columns: z.array(label).min(1).readonly(),
    rows: z.array(tableRowSchema).readonly(),
  })
  .readonly();

/** Structured node contents. Kind determines the payload; core validates placement and references. */
export const contentSchema = z.union([
  textBlockSchema,
  codeBlockSchema,
  listBlockSchema,
  imageBlockSchema,
  figureBlockSchema,
  linkBlockSchema,
  fieldSchema,
  keyGroupSchema,
  signatureSchema,
  memberSchema,
  tableBlockSchema,
]);

/** Named connection point with a direction and type label, scoped to its owning object. */
export const portSchema = z
  .strictObject({ id: descendantId, direction: z.enum(['in', 'out', 'inout']), label, type: label })
  .readonly();

/** One readonly content variant; narrow on kind before reading variant fields. */
export type ContentBlock = z.infer<typeof contentSchema>;

/** Object-level address when member is absent; descendant-level address otherwise. */
export type Endpoint = z.infer<typeof endpointSchema>;

/** ER field definition; a foreign key reference is validated against an ordered candidate key. */
export type Field = Extract<ContentBlock, { kind: 'field' }>;

/** Parametric figure block; narrow on form before reading form-specific parameters. */
export type FigureBlock = Extract<ContentBlock, { kind: 'figure' }>;

/** Ordered composite primary, unique or foreign key over fields in the owning entity. */
export type KeyGroup = Extract<ContentBlock, { kind: 'keygroup' }>;
