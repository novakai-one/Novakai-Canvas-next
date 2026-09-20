import { z } from 'zod';
import { definitionId, label } from '../brands.js';

/** The deliberately small shared type vocabulary for the first definitions slice. */
export const primitiveType = z.enum(['string', 'number', 'boolean', 'unknown', 'void']);
const literalType = z.union([z.string(), z.number(), z.boolean()]);

export type TypeExpression =
  | { readonly kind: 'primitive'; readonly name: z.infer<typeof primitiveType> }
  | { readonly kind: 'literal'; readonly value: z.infer<typeof literalType> }
  | { readonly kind: 'reference'; readonly id: z.infer<typeof definitionId> }
  | { readonly kind: 'union'; readonly items: readonly TypeExpression[] };

const typeExpressionSchema: z.ZodType<TypeExpression> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('primitive'), name: primitiveType }).readonly(),
    z.strictObject({ kind: z.literal('literal'), value: literalType }).readonly(),
    z.strictObject({ kind: z.literal('reference'), id: definitionId }).readonly(),
    z.strictObject({ kind: z.literal('union'), items: z.array(typeExpressionSchema).min(2).readonly() }).readonly(),
  ]),
);

/** A named, collection-owned shared type. IDs are stable across label/expression edits. */
export const definitionSchema = z
  .strictObject({ id: definitionId, label, expression: typeExpressionSchema })
  .readonly();

export type Definition = z.infer<typeof definitionSchema>;

/** A field's type has one physical source of truth: a legacy string or an explicit definition ref. */
export const fieldTypeSchema = z.union([
  label,
  z.strictObject({ kind: z.literal('definition'), id: definitionId }).readonly(),
]);

export type FieldType = z.infer<typeof fieldTypeSchema>;
