import { z } from 'zod';
import { assetId, descendantId, label, objectId, sectionId, size } from '../brands.js';
export const endpointSchema = z
  .strictObject({ object: objectId, member: descendantId.optional() })
  .readonly();
const text = z
  .strictObject({ kind: z.literal('text'), id: descendantId, text: z.string() })
  .readonly();
const code = z
  .strictObject({
    kind: z.literal('code'),
    id: descendantId,
    text: z.string(),
    language: z.string().optional(),
  })
  .readonly();
const list = z
  .strictObject({
    kind: z.literal('list'),
    id: descendantId,
    items: z.array(z.string()).readonly(),
    ordered: z.boolean().default(false),
  })
  .readonly();
const image = z
  .strictObject({
    kind: z.enum(['image', 'icon']),
    id: descendantId,
    asset: assetId,
    size: size.default('medium'),
    fit: z.enum(['contain', 'cover']).default('contain'),
  })
  .readonly();
const linkTarget = z.discriminatedUnion('kind', [
  z
    .strictObject({ kind: z.literal('object'), id: objectId, section: sectionId.optional() })
    .readonly(),
  z.strictObject({ kind: z.literal('uri'), uri: label }).readonly(),
]);
const link = z
  .strictObject({ kind: z.literal('link'), id: descendantId, label, target: linkTarget })
  .readonly();
const field = z
  .strictObject({
    kind: z.literal('field'),
    id: descendantId,
    label,
    type: label,
    nullable: z.boolean().default(false),
    key: z.enum(['primary', 'foreign', 'unique']).optional(),
    references: endpointSchema.optional(),
  })
  .readonly();
const keygroup = z
  .strictObject({
    kind: z.literal('keygroup'),
    id: descendantId,
    key: z.enum(['primary', 'foreign', 'unique']),
    fields: z.array(descendantId).min(1).readonly(),
    references: z.array(endpointSchema).readonly().optional(),
  })
  .readonly();
const signature = z
  .strictObject({
    kind: z.literal('signature'),
    id: descendantId,
    label,
    parameters: z.array(label).readonly(),
    returns: label,
  })
  .readonly();
const member = z
  .strictObject({
    kind: z.literal('member'),
    id: descendantId,
    label,
    type: label,
    visibility: z.enum(['public', 'private', 'protected']).default('public'),
  })
  .readonly();
const row = z.strictObject({ id: descendantId, cells: z.array(z.string()).readonly() }).readonly();
const table = z
  .strictObject({
    kind: z.literal('table'),
    id: descendantId,
    columns: z.array(label).min(1).readonly(),
    rows: z.array(row).readonly(),
  })
  .readonly();
export const contentSchema = z.union([
  text,
  code,
  list,
  image,
  link,
  field,
  keygroup,
  signature,
  member,
  table,
]);
export const portSchema = z
  .strictObject({ id: descendantId, direction: z.enum(['in', 'out', 'inout']), label, type: label })
  .readonly();
export type ContentBlock = z.infer<typeof contentSchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type Field = Extract<ContentBlock, { kind: 'field' }>;
export type KeyGroup = Extract<ContentBlock, { kind: 'keygroup' }>;
