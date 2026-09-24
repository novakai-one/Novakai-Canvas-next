import { z } from 'zod';
import { folderId, collectionId } from '../brands.js';
import { folderSchema, entrySchema } from './catalog.js';

/**
 * Checks one catalog change. Each change carries a complete record or an ID, never a partial
 * patch or a JSON path:
 * - `create-folder` / `replace-folder`: a complete folder.
 * - `remove-folder`: a folder ID and `policy` (default `reject`): `reject` refuses a folder with
 *   contents; `rehome` moves its direct children and entries to its parent.
 * - `register` / `replace-entry`: a complete catalog entry.
 * - `unregister`: a collection ID.
 */
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

/**
 * Checks an ordered batch of at most 1,000 changes. Planning applies them in order and checks the
 * rules across records only on the final catalog, so a later change may repair an earlier one.
 */
export const changesSchema = z.array(changeSchema).max(1000).readonly();

/** A change that passed {@link changeSchema}. Storing it still requires Authoring admission. */
export type CatalogChange = z.infer<typeof changeSchema>;
