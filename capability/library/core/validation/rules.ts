import type { Diagnostic } from '../../contract/errors.js';
import type { LibrarySnapshot, CollectionProjection } from '../../contract/records/snapshot.js';
import type { Catalog, Folder } from '../../contract/records/catalog.js';
import { ancestry } from '../catalog/folders.js';
import { duplicateIssues } from './identities.js';
import { diagnoseWhen } from './outcomes.js';

/** Omitted parent denotes root; a named parent must resolve within this catalog. */
function parentIssues(folder: Folder, catalog: Catalog): readonly Diagnostic[] {
  if (folder.parent === undefined) return [];
  const exists = catalog.folders.some((candidate) => candidate.id === folder.parent);
  return diagnoseWhen(
    !exists,
    'reference',
    `catalog.folders.${folder.id}.parent`,
    'Parent folder must exist',
  );
}
/** Identity, immediate references and ancestry cycles are independent failure checks. */
function folderIssues(catalog: Catalog): readonly Diagnostic[] {
  const identities = duplicateIssues(catalog.folders, (folder) => folder.id, 'catalog.folders');
  const references = catalog.folders.flatMap((folder) => parentIssues(folder, catalog));
  const cycles = catalog.folders.flatMap((folder) =>
    diagnoseWhen(
      ancestry(folder.id, catalog.folders).cycle,
      'cycle',
      `catalog.folders.${folder.id}.parent`,
      'Folder ancestry must be acyclic',
    ),
  );
  return [...identities, ...references, ...cycles];
}
/** Every entry resolves both its collection and optional containing folder. */
function entryIssues(snapshot: LibrarySnapshot): readonly Diagnostic[] {
  return snapshot.catalog.entries.flatMap((entry) => {
    const collectionExists = snapshot.collections.some(
      (collection) => collection.id === entry.collection,
    );
    const folderExists =
      entry.folder === undefined ||
      snapshot.catalog.folders.some((folder) => folder.id === entry.folder);
    const collectionIssues = diagnoseWhen(
      !collectionExists,
      'reference',
      `catalog.entries.${entry.collection}`,
      'Collection projection must exist',
    );
    const folderIssues = diagnoseWhen(
      !folderExists,
      'reference',
      `catalog.entries.${entry.collection}.folder`,
      'Containing folder must exist',
    );
    return [...collectionIssues, ...folderIssues];
  });
}
/** Catalog and collection inventory form a bijection; neither may have orphans. */
function membershipIssues(snapshot: LibrarySnapshot): readonly Diagnostic[] {
  const entries = duplicateIssues(
    snapshot.catalog.entries,
    (entry) => entry.collection,
    'catalog.entries',
  );
  const collections = duplicateIssues(
    snapshot.collections,
    (collection) => collection.id,
    'collections',
  );
  const missingEntries = snapshot.collections.flatMap((collection) => {
    const exists = snapshot.catalog.entries.some((entry) => entry.collection === collection.id);
    return diagnoseWhen(
      !exists,
      'reference',
      `collections.${collection.id}`,
      'Collection must have exactly one catalog entry',
    );
  });
  return [...entries, ...collections, ...entryIssues(snapshot), ...missingEntries];
}
/** An object may be unplaced; every named visible section must exist in the same collection. */
function objectVisibility(collection: CollectionProjection): readonly Diagnostic[] {
  return collection.objects.flatMap((object) => {
    const path = `collections.${collection.id}.objects.${object.id}.visibleIn`;
    const duplicates = duplicateIssues(object.visibleIn, (id) => id, path);
    const references = object.visibleIn.flatMap((id) =>
      diagnoseWhen(
        !collection.sections.some((section) => section.id === id),
        'reference',
        `${path}.${id}`,
        'Visible section must exist',
      ),
    );
    return [...duplicates, ...references];
  });
}
/** Section and object identities occupy separate collection-local namespaces. */
function projectionIssues(collection: CollectionProjection): readonly Diagnostic[] {
  const sections = duplicateIssues(
    collection.sections,
    (section) => section.id,
    `collections.${collection.id}.sections`,
  );
  const objects = duplicateIssues(
    collection.objects,
    (object) => object.id,
    `collections.${collection.id}.objects`,
  );
  return [...sections, ...objects, ...objectVisibility(collection)];
}
/** Visits are unique preferences and may refer to archived collections, but never missing ones. */
function recentIssues(snapshot: LibrarySnapshot): readonly Diagnostic[] {
  const duplicates = duplicateIssues(snapshot.recent, (visit) => visit.collection, 'recent');
  const references = snapshot.recent.flatMap((visit) =>
    diagnoseWhen(
      !snapshot.collections.some((collection) => collection.id === visit.collection),
      'reference',
      `recent.${visit.collection}`,
      'Visited collection must exist',
    ),
  );
  return [...duplicates, ...references];
}

/** All domain rules operate on parsed projections, never raw Model documents. */
export function validateRecords(snapshot: LibrarySnapshot): readonly Diagnostic[] {
  const folders = folderIssues(snapshot.catalog);
  const membership = membershipIssues(snapshot);
  const projections = snapshot.collections.flatMap(projectionIssues);
  const visits = recentIssues(snapshot);
  return [...folders, ...membership, ...projections, ...visits];
}
