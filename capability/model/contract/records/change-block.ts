import { z } from 'zod';
import { changeId, descendantId, label, objectId, relationshipId } from '../brands.js';

/** A change entry addresses one object, one object member, or one relationship. */
export const changeTargetSchema = z.discriminatedUnion('kind', [
  z
    .strictObject({ kind: z.literal('object'), object: objectId, member: descendantId.optional() })
    .readonly(),
  z.strictObject({ kind: z.literal('relationship'), relationship: relationshipId }).readonly(),
]);

/** One declared status for one target. */
export const changeEntrySchema = z
  .strictObject({
    status: z.enum(['new', 'changed', 'deleted', 'locked']),
    target: changeTargetSchema,
  })
  .readonly();

/** Collection-level change block; the only source of an object's change status. */
export const changeBlockSchema = z
  .strictObject({
    id: changeId,
    title: label,
    entries: z.array(changeEntrySchema).min(1).readonly(),
  })
  .readonly();

/** Declared change block with its ordered entries. */
export type ChangeBlock = z.infer<typeof changeBlockSchema>;

/** One status entry inside a change block. */
export type ChangeEntry = z.infer<typeof changeEntrySchema>;
