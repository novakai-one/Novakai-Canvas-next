import { z } from 'zod';

/** Shared identity grammar. Namespace schemas below mint checked, incompatible ID types. */
export const identifier = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]*$/);

/** Checked identity of one collection; never interchangeable with its child records. */
export const collectionId = identifier.brand<'CollectionId'>();

/** Checked identity of a canonical object within its collection. */
export const objectId = identifier.brand<'ObjectId'>();

/** Checked identity of a canonical relationship within its collection. */
export const relationshipId = identifier.brand<'RelationshipId'>();

/** Checked identity of a diagram view within its collection. */
export const sectionId = identifier.brand<'SectionId'>();

/** Checked identity of an asset manifest entry; distinct from its content digest. */
export const assetId = identifier.brand<'AssetId'>();

/** Checked identity of a provenance entry within its collection. */
export const sourceId = identifier.brand<'SourceId'>();

/** Checked identity of a shared type definition within its collection. */
export const definitionId = identifier.brand<'DefinitionId'>();

/** Checked identity of a container within one section. */
export const groupId = identifier.brand<'GroupId'>();

/** Checked identity of a port, content block or table row within its owning scope. */
export const descendantId = identifier.brand<'DescendantId'>();

/** Nonblank display text; validation preserves the original whitespace. */
export const label = z
  .string()
  .refine((value): boolean => value.trim().length > 0, 'Must be nonblank');

/** Pinned SHA-256 content identity; Model checks syntax and does not fetch bytes. */
export const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/);

/** Semantic size preference. Layout resolves dimensions; agents do not supply pixels. */
export const size = z.enum(['small', 'medium', 'large']);

/** Object identity produced by the checked objectId schema. */
export type ObjectId = z.infer<typeof objectId>;

/** Collection identity produced by the checked collectionId schema. */
export type CollectionId = z.infer<typeof collectionId>;

/** Section identity produced by the checked sectionId schema. */
export type SectionId = z.infer<typeof sectionId>;

/** Relationship identity produced by the checked relationshipId schema. */
export type RelationshipId = z.infer<typeof relationshipId>;

/** Local descendant identity produced by the checked descendantId schema. */
export type DescendantId = z.infer<typeof descendantId>;

/** Asset manifest identity produced by the checked assetId schema. */
export type AssetId = z.infer<typeof assetId>;

/** Provenance identity produced by the checked sourceId schema. */
export type SourceId = z.infer<typeof sourceId>;

/** Shared definition identity produced by the checked definitionId schema. */
export type DefinitionId = z.infer<typeof definitionId>;

/** Section-local container identity produced by the checked groupId schema. */
export type GroupId = z.infer<typeof groupId>;
