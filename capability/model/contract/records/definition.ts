import { z } from 'zod';
import { definitionId, label, objectId } from '../brands.js';
import type { DefinitionId, ObjectId } from '../brands.js';

/** The deliberately small shared type vocabulary for definitions. */
export const primitiveType = z.enum(['string', 'number', 'boolean', 'unknown', 'void']);
const literalType = z.union([z.string(), z.number(), z.boolean()]);

export type TypeExpression =
  | { readonly kind: 'primitive'; readonly name: z.infer<typeof primitiveType> }
  | { readonly kind: 'literal'; readonly value: z.infer<typeof literalType> }
  | { readonly kind: 'reference'; readonly id: z.infer<typeof definitionId> }
  | { readonly kind: 'union'; readonly items: readonly TypeExpression[] }
  | { readonly kind: 'opaque' };

const typeExpressionSchema: z.ZodType<TypeExpression> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('primitive'), name: primitiveType }).readonly(),
    z.strictObject({ kind: z.literal('literal'), value: literalType }).readonly(),
    z.strictObject({ kind: z.literal('reference'), id: definitionId }).readonly(),
    z
      .strictObject({
        kind: z.literal('union'),
        items: z.array(typeExpressionSchema).min(2).readonly(),
      })
      .readonly(),
    z.strictObject({ kind: z.literal('opaque') }).readonly(),
  ]),
);

/** A named, collection-owned shared type. IDs are stable across label/expression edits. */
export const definitionSchema = z
  .strictObject({ id: definitionId, label, expression: typeExpressionSchema })
  .readonly();

export type Definition = z.infer<typeof definitionSchema>;

/** Shared type use: a plain string type, a definition/entity ref, a primitive, or a generic instantiation. */
export type TypeUse =
  | string
  | { readonly kind: 'definition'; readonly id: DefinitionId }
  | { readonly kind: 'entity'; readonly id: ObjectId }
  | { readonly kind: 'primitive'; readonly name: 'string' | 'number' | 'boolean' }
  | {
      readonly kind: 'generic';
      readonly base: DefinitionId;
      readonly arguments: readonly TypeUse[];
    };

export const typeUseSchema: z.ZodType<TypeUse> = z.lazy(() =>
  z.union([
    label,
    z.strictObject({ kind: z.literal('definition'), id: definitionId }).readonly(),
    z.strictObject({ kind: z.literal('entity'), id: objectId }).readonly(),
    z
      .strictObject({ kind: z.literal('primitive'), name: z.enum(['string', 'number', 'boolean']) })
      .readonly(),
    z
      .strictObject({
        kind: z.literal('generic'),
        base: definitionId,
        arguments: z.array(typeUseSchema).min(1).readonly(),
      })
      .readonly(),
  ]),
);

export const fieldTypeSchema = typeUseSchema;
export type FieldType = TypeUse;
