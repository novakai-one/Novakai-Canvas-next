/*
 * Catalog change records. Each change carries a complete record or an ID, never a partial patch
 * or a JSON path. The schema is built by a function, so no schema object is shared between calls.
 * A change these schemas reject is a `shape` diagnostic; the caller corrects it, and Authoring
 * owns admission, commit and recovery.
 */
import { z } from 'zod';
import { folderIdSchema, collectionIdSchema, type CollectionId, type FolderId } from '../brands.js';
import { folderSchema, entrySchema, type CatalogEntry, type Folder } from './catalog.js';

/** The most changes one batch may hold. */
export const MAX_CHANGES = 1000;

/**
 * One catalog change:
 * - `create-folder` / `replace-folder`: a complete folder.
 * - `remove-folder`: a folder ID and `policy`: `reject` refuses a folder with contents; `rehome`
 *   moves its direct children and entries to its parent.
 * - `register` / `replace-entry`: a complete catalog entry.
 * - `unregister`: a collection ID.
 */
export type CatalogChange =
  | { readonly op: 'create-folder'; readonly value: Folder }
  | { readonly op: 'replace-folder'; readonly value: Folder }
  | { readonly op: 'remove-folder'; readonly id: FolderId; readonly policy: RemovalPolicy }
  | { readonly op: 'register'; readonly value: CatalogEntry }
  | { readonly op: 'replace-entry'; readonly value: CatalogEntry }
  | { readonly op: 'unregister'; readonly collection: CollectionId };

/** What removing a folder with contents does: refuse, or move the contents to its parent. */
export type RemovalPolicy = 'reject' | 'rehome';

/** The name of one kind of change. */
export type ChangeOperation = CatalogChange['op'];

/** One change of the named kind. */
export type ChangeOf<Op extends ChangeOperation> = Extract<CatalogChange, { readonly op: Op }>;

/**
 * Builds the schema of one change. `remove-folder`'s `policy` defaults to `reject`.
 *
 * @returns A new change schema.
 * @throws Never.
 */
export function changeSchema(): z.ZodType<CatalogChange> {
  return z.discriminatedUnion('op', [
    z.strictObject({ op: z.literal('create-folder'), value: folderSchema() }).readonly(),
    z.strictObject({ op: z.literal('replace-folder'), value: folderSchema() }).readonly(),
    z
      .strictObject({
        op: z.literal('remove-folder'),
        id: folderIdSchema(),
        policy: z.enum(['reject', 'rehome']).default('reject'),
      })
      .readonly(),
    z.strictObject({ op: z.literal('register'), value: entrySchema() }).readonly(),
    z.strictObject({ op: z.literal('replace-entry'), value: entrySchema() }).readonly(),
    z.strictObject({ op: z.literal('unregister'), collection: collectionIdSchema() }).readonly(),
  ]);
}

/**
 * Builds the schema of an ordered batch of at most {@link MAX_CHANGES} changes. Planning applies
 * them in order. Each change's own checks fail at once: a missing ID is `not-found`, an ID
 * already present is `already-exists`, and `reject` on a non-empty folder is `folder-not-empty`.
 * Only the rules across records wait for the final catalog, so a later change may repair an
 * earlier one there.
 *
 * @returns A new batch schema.
 * @throws Never.
 */
export function changesSchema(): z.ZodType<readonly CatalogChange[]> {
  return z.array(changeSchema()).max(MAX_CHANGES).readonly();
}
