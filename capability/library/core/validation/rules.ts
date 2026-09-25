/*
 * The rules across records of a parsed snapshot: unique IDs, existing references, no folder
 * cycles, and one catalog entry per collection. Every violation is reported. Pure; the caller
 * corrects the input, and Authoring owns commit and recovery.
 */
import type { Diagnostic } from '../../contract/errors.js';
import type { CollectionId, ObjectId, SectionId } from '../../contract/brands.js';
import type {
  LibrarySnapshot,
  CollectionProjection,
  ObjectProjection,
  RecentVisit,
  SectionProjection,
} from '../../contract/records/snapshot.js';
import type { Catalog, CatalogEntry, Folder } from '../../contract/records/catalog.js';
import { ancestry } from '../catalog/ancestry.js';
import { duplicateIssues } from './identities.js';
import { entryKey, folderKey, hasCollection, hasEntry, hasFolder, hasSection } from './lookups.js';
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
  const identities = duplicateIssues(catalog.folders, folderKey, 'catalog.folders');
  const references = catalog.folders.flatMap(
    /** The folder's missing-parent diagnostic, if any. */ (folder) =>
      parentIssues(folder, catalog),
  );
  const cycles = catalog.folders.flatMap(
    /** The folder's cycle diagnostic, if any. */ (folder) => cycleIssues(folder, catalog),
  );
  return [...identities, ...references, ...cycles];
}

/** A folder without a parent is at the root; a named parent must exist in this catalog. */
function parentIssues(folder: Folder, catalog: Catalog): readonly Diagnostic[] {
  if (folder.parent === undefined) {
    return [];
  }
  return diagnoseWhen(!hasFolder(catalog.folders, folder.parent), {
    code: 'reference',
    path: `catalog.folders.${folder.id}.parent`,
    message: 'Parent folder must exist',
  });
}

/** A folder whose parent chain comes back to a folder already visited is in a cycle. */
function cycleIssues(folder: Folder, catalog: Catalog): readonly Diagnostic[] {
  const walk = ancestry(folder.id, catalog.folders);
  return diagnoseWhen(walk.cycle, {
    code: 'cycle',
    path: `catalog.folders.${folder.id}.parent`,
    message: 'Folder ancestry must be acyclic',
  });
}

/** The catalog entries and the collection inventory match one to one; neither has orphans. */
function membershipIssues(snapshot: LibrarySnapshot): readonly Diagnostic[] {
  const entries = duplicateIssues(snapshot.catalog.entries, entryKey, 'catalog.entries');
  const collections = duplicateIssues(snapshot.collections, collectionKey, 'collections');
  const orphanEntries = snapshot.catalog.entries.flatMap(
    /** The entry's missing collection or folder. */ (entry) => entryIssues(entry, snapshot),
  );
  const missingEntries = snapshot.collections.flatMap(
    /** The collection's missing entry, if any. */ (collection) =>
      missingEntryIssues(collection, snapshot.catalog),
  );
  return [...entries, ...collections, ...orphanEntries, ...missingEntries];
}

/** An entry's collection must exist, and its folder too when it names one. */
function entryIssues(entry: CatalogEntry, snapshot: LibrarySnapshot): readonly Diagnostic[] {
  const collectionExists = hasCollection(snapshot.collections, entry.collection);
  const folderExists =
    entry.folder === undefined || hasFolder(snapshot.catalog.folders, entry.folder);
  const missingCollection = diagnoseWhen(!collectionExists, {
    code: 'reference',
    path: `catalog.entries.${entry.collection}`,
    message: 'Collection projection must exist',
  });
  const missingFolder = diagnoseWhen(!folderExists, {
    code: 'reference',
    path: `catalog.entries.${entry.collection}.folder`,
    message: 'Containing folder must exist',
  });
  return [...missingCollection, ...missingFolder];
}

/** Every collection needs a catalog entry. */
function missingEntryIssues(
  collection: CollectionProjection,
  catalog: Catalog,
): readonly Diagnostic[] {
  return diagnoseWhen(!hasEntry(catalog.entries, collection.id), {
    code: 'reference',
    path: `collections.${collection.id}`,
    message: 'Collection must have exactly one catalog entry',
  });
}

/** Section IDs and object IDs are each unique within the collection (separately). */
function projectionIssues(collection: CollectionProjection): readonly Diagnostic[] {
  const sectionsPath = `collections.${collection.id}.sections`;
  const objectsPath = `collections.${collection.id}.objects`;
  const sections = duplicateIssues(collection.sections, sectionKey, sectionsPath);
  const objects = duplicateIssues(collection.objects, objectKey, objectsPath);
  const visibility = collection.objects.flatMap(
    /** The object's visible-section diagnostics. */ (object) =>
      objectVisibility(object, collection),
  );
  return [...sections, ...objects, ...visibility];
}

/**
 * An object may be in no section, but each section it names must exist in the same collection and
 * be named only once.
 */
function objectVisibility(
  object: ObjectProjection,
  collection: CollectionProjection,
): readonly Diagnostic[] {
  const path = `collections.${collection.id}.objects.${object.id}.visibleIn`;
  const duplicates = duplicateIssues(object.visibleIn, sectionIdKey, path);
  const references = object.visibleIn.flatMap(
    /** The missing-section diagnostic, if any. */ (id) =>
      diagnoseWhen(!hasSection(collection.sections, id), {
        code: 'reference',
        path: `${path}.${id}`,
        message: 'Visible section must exist',
      }),
  );
  return [...duplicates, ...references];
}

/** One visit per collection. A visit may name an archived collection, never a missing one. */
function recentIssues(snapshot: LibrarySnapshot): readonly Diagnostic[] {
  const duplicates = duplicateIssues(snapshot.recent, visitKey, 'recent');
  const references = snapshot.recent.flatMap(
    /** The missing-collection diagnostic, if any. */ (visit) =>
      diagnoseWhen(!hasCollection(snapshot.collections, visit.collection), {
        code: 'reference',
        path: `recent.${visit.collection}`,
        message: 'Visited collection must exist',
      }),
  );
  return [...duplicates, ...references];
}

/** A collection's key: its ID. */
function collectionKey(collection: CollectionProjection): CollectionId {
  return collection.id;
}

/** A section's key: its ID. */
function sectionKey(section: SectionProjection): SectionId {
  return section.id;
}

/** An object's key: its ID. */
function objectKey(object: ObjectProjection): ObjectId {
  return object.id;
}

/** A visible-section entry's key: the section ID itself. */
function sectionIdKey(id: SectionId): SectionId {
  return id;
}

/** A visit's key: its collection's ID. */
function visitKey(visit: RecentVisit): CollectionId {
  return visit.collection;
}
