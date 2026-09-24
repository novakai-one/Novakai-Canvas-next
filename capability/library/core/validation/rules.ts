import type { Diagnostic } from '../../contract/errors.js';
import type { LibrarySnapshot, CollectionProjection } from '../../contract/records/snapshot.js';
import type { Catalog, Folder } from '../../contract/records/catalog.js';
import { ancestry } from '../catalog/folders.js';
import { duplicateIssues } from './identities.js';
import { diagnoseWhen } from './outcomes.js';

/**
 * Checks the rules across records of a parsed snapshot, and reports every violation.
 *
 * Diagnostics come in this order:
 * 1. Folders: duplicate IDs, missing parents, then parent cycles.
 * 2. Membership: duplicate entries, duplicate collections, entries whose collection or folder is
 *    missing, then collections without an entry.
 * 3. Each collection: duplicate section IDs, duplicate object IDs, then each object's duplicate
 *    or missing visible sections.
 * 4. Recent visits: duplicates, then visits to missing collections.
 *
 * Works on parsed projections only, never on raw Model documents. Runs inside the protected
 * boundary of `validateSnapshot`; the caller corrects the input, and Authoring owns commit and
 * recovery.
 *
 * @param snapshot - The parsed snapshot.
 * @returns The diagnostics; empty when the snapshot is consistent.
 * @throws Never (the snapshot is already parsed plain data).
 */
export function validateRecords(snapshot: LibrarySnapshot): readonly Diagnostic[] {
  const folders = folderIssues(snapshot.catalog);
  const membership = membershipIssues(snapshot);
  const projections = snapshot.collections.flatMap(projectionIssues);
  const visits = recentIssues(snapshot);
  return [...folders, ...membership, ...projections, ...visits];
}

/** Folder rules: unique IDs, existing parents and no parent cycles, each checked separately. */
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

/** A folder without a parent is at the root; a named parent must exist in this catalog. */
function parentIssues(folder: Folder, catalog: Catalog): readonly Diagnostic[] {
  if (folder.parent === undefined) {
    return [];
  }
  const exists = catalog.folders.some((candidate) => candidate.id === folder.parent);
  return diagnoseWhen(
    !exists,
    'reference',
    `catalog.folders.${folder.id}.parent`,
    'Parent folder must exist',
  );
}

/** The catalog entries and the collection inventory match one to one; neither has orphans. */
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

/** Every entry's collection must exist, and its folder too when it names one. */
function entryIssues(snapshot: LibrarySnapshot): readonly Diagnostic[] {
  return snapshot.catalog.entries.flatMap((entry) => {
    const collectionExists = snapshot.collections.some(
      (collection) => collection.id === entry.collection,
    );
    const folderExists =
      entry.folder === undefined ||
      snapshot.catalog.folders.some((folder) => folder.id === entry.folder);
    const missingCollection = diagnoseWhen(
      !collectionExists,
      'reference',
      `catalog.entries.${entry.collection}`,
      'Collection projection must exist',
    );
    const missingFolder = diagnoseWhen(
      !folderExists,
      'reference',
      `catalog.entries.${entry.collection}.folder`,
      'Containing folder must exist',
    );
    return [...missingCollection, ...missingFolder];
  });
}

/** Section IDs and object IDs are each unique within the collection (separately). */
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

/**
 * An object may be in no section, but each section it names must exist in the same collection and
 * be named only once.
 */
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

/** One visit per collection. A visit may name an archived collection, never a missing one. */
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
