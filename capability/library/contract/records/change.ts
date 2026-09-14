import { z } from 'zod';
import { folderId, collectionId } from '../brands.js';
import { folderSchema, entrySchema } from './catalog.js';
/** Complete payloads prevent arbitrary JSON paths from becoming catalog mutation authority. */
export const changeSchema = z.discriminatedUnion('op', [
  z.strictObject({ op: z.literal('create-folder'), value: folderSchema }).readonly(),
  z.strictObject({ op: z.literal('replace-folder'), value: folderSchema }).readonly(),
  z
    .strictObject({
      op: z.literal('remove-folder'),
      id: folderId,
      policy: z.enum(['reject', 'rehome']).default('reject'),
    })
    .readonly(),
  z.strictObject({ op: z.literal('register'), value: entrySchema }).readonly(),
  z.strictObject({ op: z.literal('replace-entry'), value: entrySchema }).readonly(),
  z.strictObject({ op: z.literal('unregister'), collection: collectionId }).readonly(),
]);
/** Ordered batch; cross-record consistency is checked after all operations succeed. */
export const changesSchema = z.array(changeSchema).max(1000).readonly();
/** A checked catalog operation; all writes still require Authoring admission. */
export type CatalogChange = z.infer<typeof changeSchema>;
