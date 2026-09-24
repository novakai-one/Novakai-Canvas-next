import { assert } from 'vitest';
import {
  catalogId,
  collectionId,
  folderId,
  sectionId,
  objectId,
  type LibrarySnapshot,
  type Result,
  type DiagnosticCode,
} from '../contract/index.js';

/** Fixture IDs, checked with the public ID schemas (no private code is used). */
export const ids = {
  catalog: catalogId.parse('catalog'),
  folder: folderId.parse('engineering'),
  child: folderId.parse('backend'),
  alpha: collectionId.parse('alpha'),
  beta: collectionId.parse('beta'),
  section: sectionId.parse('er'),
  object: objectId.parse('invoice'),
};

/**
 * A valid snapshot: catalog `catalog` (revision 7) with folder `engineering` and its child
 * `backend`; collection `alpha` ("Billing", revision 3) in `backend` with section `er` and the
 * unplaced object `invoice`; archived collection `beta` ("Architecture", revision 4) at the root;
 * `alpha` opened at 100 and `beta` at 200.
 *
 * Every field is given explicitly, so schema defaults never produce an expected value. A fresh
 * object is returned on every call.
 */
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

/**
 * Asserts a result succeeded and returns its value.
 *
 * @throws Vitest's assertion error, carrying the result as JSON, when the result failed.
 */
export function valueOf<T>(result: Result<T>): T {
  assert(result.ok, JSON.stringify(result));
  return result.value;
}

/**
 * True when the result failed with a diagnostic of `code` at exactly `path`. Other diagnostics in
 * the same failure are allowed.
 */
export function hasFailure<T>(result: Result<T>, code: DiagnosticCode, path: string): boolean {
  if (result.ok) {
    return false;
  }
  return result.error.diagnostics.some(
    (diagnostic) => diagnostic.code === code && diagnostic.path === path,
  );
}
