import { z } from 'zod';
import { validate, query, collectionId, folderId } from '@novakai/canvas-library';
import { projectCollection } from '@novakai/canvas-service';
import type { LibraryReader } from '../contract/records/library.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
/** Host projections are shared with service validation; Library remains the search and organization authority. */
export function createLibraryReader(): LibraryReader {
  return {
    read: (snapshot, collections, recent) => {
      const catalogs = snapshot.records.filter(
        (record) => record.key.kind === 'catalog' && !record.deleted,
      );
      if (catalogs.length !== 1)
        return failure('invalid-library', 'Workspace requires one library catalog');
      return checked(
        validate({
          catalog: catalogs[0]?.value,
          collections: collections.map(projectCollection),
          recent,
        }),
      );
    },
    query: (snapshot, filters, cursor) =>
      checked(
        query(snapshot, {
          text: filters.text,
          archived: filters.archived,
          sort: filters.sort,
          kinds: ['collection', 'section', 'object'],
          limit: 50,
          ...folderFilter(filters.folder),
          ...cursorFilter(cursor),
        }),
      ),
    visits: (input) => {
      const parsed = visits.safeParse(input);
      if (!parsed.success)
        return failure('invalid-visits', 'Recent collections could not be recovered');
      return { ok: true, value: parsed.data };
    },
    folderDraft: (input) => {
      const parsed = z
        .strictObject({ id: folderId, title: z.string(), revision: z.number().int().nonnegative() })
        .safeParse(input);
      if (!parsed.success)
        return failure(
          'invalid-folder-draft',
          'The folder draft could not be recovered; stored data was retained',
        );
      return { ok: true, value: parsed.data };
    },
  };
}
const visits = z
  .array(z.strictObject({ collection: collectionId, openedAt: z.number().int().nonnegative() }))
  .max(10000)
  .readonly();
/** Omitted folder means all folders, matching the Library contract. */
function folderFilter(folder: string | null): Readonly<Record<string, unknown>> {
  if (folder === null) return {};
  return { folder, descendants: true };
}
/** Pagination tokens are opaque Library data; hosts never decode or synthesize offsets. */
function cursorFilter(cursor: string | null): Readonly<Record<string, unknown>> {
  if (cursor === null) return {};
  return { cursor };
}
/** Owner diagnostics remain readable while preserving the browser's stable failure envelope. */
function checked<T>(
  result:
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly diagnostics: readonly { readonly message: string }[] },
): Result<T> {
  if (!result.ok)
    return failure('invalid-library', result.diagnostics.map((item) => item.message).join('; '));
  return result;
}
