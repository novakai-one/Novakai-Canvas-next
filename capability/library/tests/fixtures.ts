import { assert } from 'vitest';
import {
  catalogId,
  collectionId,
  folderId,
  sectionId,
  objectId,
  type LibrarySnapshot,
  type Result,
} from '../contract/index.js';
/** Independently minted fixture identities; no private implementation is used. */
export const ids = {
  catalog: catalogId.parse('catalog'),
  folder: folderId.parse('engineering'),
  child: folderId.parse('backend'),
  alpha: collectionId.parse('alpha'),
  beta: collectionId.parse('beta'),
  section: sectionId.parse('er'),
  object: objectId.parse('invoice'),
};
/** Explicit fixture values prevent schema defaults from manufacturing expected results. */
export function snapshot(): LibrarySnapshot {
  return {
    catalog: {
      schemaVersion: 1,
      id: ids.catalog,
      revision: 7,
      folders: [
        { id: ids.folder, title: 'Engineering', order: 0 },
        { id: ids.child, title: 'Backend', parent: ids.folder, order: 0 },
      ],
      entries: [
        { collection: ids.alpha, folder: ids.child, order: 0, archived: false },
        { collection: ids.beta, order: 1, archived: true },
      ],
    },
    collections: [
      {
        id: ids.alpha,
        revision: 3,
        title: 'Billing',
        description: 'Payments overview',
        sections: [{ id: ids.section, title: 'Database' }],
        objects: [
          {
            id: ids.object,
            label: 'Invoice',
            description: 'Unplaced financial record',
            visibleIn: [],
          },
        ],
      },
      {
        id: ids.beta,
        revision: 4,
        title: 'Architecture',
        description: 'Service topology',
        sections: [],
        objects: [],
      },
    ],
    recent: [
      { collection: ids.alpha, openedAt: 100 },
      { collection: ids.beta, openedAt: 200 },
    ],
  };
}
/** Assert success before exposing the public value; a failed fixture result stops its test. */
export function valueOf<T>(result: Result<T>): T {
  assert(result.ok, JSON.stringify(result));
  return result.value;
}
/** Check both failure category and its independently specified affected path. */
export function hasFailure<T>(result: Result<T>, code: string, path: string): boolean {
  if (result.ok) return false;
  return result.error.diagnostics.some(
    (diagnostic) => diagnostic.code === code && diagnostic.path === path,
  );
}
