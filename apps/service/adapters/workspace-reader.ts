import { projectCollection } from '../contract/api.js';
import { validate as validateModel } from '@novakai/canvas-model';
import { validate as validateLibrary } from '@novakai/canvas-library';
import { failure } from '@novakai/canvas-authoring';
import type { Snapshot, Result, StoredRecord } from '@novakai/canvas-authoring';
import type { Collection } from '@novakai/canvas-model';
import type {
  WorkspaceReader,
  WorkspaceReaderOwners,
  WorkspaceContents,
} from '../contract/records/workspace.js';
/** Preserve owner rejection across typed record accumulation; no invalid member is dropped from a workspace. */
function collection(
  records: Result<readonly Collection[]>,
  record: StoredRecord,
): Result<readonly Collection[]> {
  if (!records.ok) return records;
  const checked = validateModel(record.value);
  if (!checked.ok)
    return failure(
      'invariant-violation',
      record.key.id,
      checked.diagnostics.map((item) => item.message).join('; '),
    );
  return { ok: true, value: [...records.value, checked.value] };
}
/** Complete workspace decoding composes owner validation; final Authoring validation supplies the exact stamped candidate. */
function read(snapshot: Snapshot, owners: WorkspaceReaderOwners): Result<WorkspaceContents> {
  const live = snapshot.records.filter((record) => !record.deleted);
  const collections = live
    .filter((record) => record.key.kind === 'collection')
    .reduce<Result<readonly Collection[]>>(collection, { ok: true, value: [] });
  if (!collections.ok) return collections;
  return complete(live, collections.value, owners);
}
/** Catalog membership and all immutable preset hashes are checked before any consumer receives a workspace view. */
function complete(
  live: readonly StoredRecord[],
  collections: readonly Collection[],
  owners: WorkspaceReaderOwners,
): Result<WorkspaceContents> {
  const catalogs = live.filter((record) => record.key.kind === 'catalog');
  if (catalogs.length !== 1)
    return failure('invariant-violation', 'catalog', 'Workspace requires exactly one catalog');
  return checkedCatalogs(catalogs[0]?.value, live, collections, owners);
}
/** Distinct owner failures retain a stable Authoring diagnostic and never become a partially populated inventory. */
function checkedCatalogs(
  catalog: unknown,
  live: readonly StoredRecord[],
  collections: readonly Collection[],
  owners: WorkspaceReaderOwners,
): Result<WorkspaceContents> {
  const library = validateLibrary({
    catalog,
    collections: collections.map(projectCollection),
    recent: [],
  });
  if (!library.ok)
    return failure(
      'invariant-violation',
      'catalog',
      library.diagnostics.map((item) => item.message).join('; '),
    );
  const presets = owners.templates.readCatalog(
    live.filter((record) => record.key.kind === 'preset').map((record) => record.value),
  );
  if (!presets.ok) return failure('invariant-violation', 'presets', presets.error.message);
  return { ok: true, value: { collections, library: library.value, presets: presets.value } };
}
/** Read-only bridge; Authoring retains the current snapshot if an owner rejects any canonical participant. */
export function createWorkspaceReader(owners: WorkspaceReaderOwners): WorkspaceReader {
  return { read: (snapshot) => read(snapshot, owners), project: projectCollection };
}
