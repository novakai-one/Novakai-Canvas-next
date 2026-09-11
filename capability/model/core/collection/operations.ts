import type { Collection } from '../../contract/records/collection.js';
import type { Change } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../invariants/issues.js';
import { preserveOverrides } from './preservation.js';
import { writeRecord } from './records.js';
import { deleteObject, removeRecord } from './removal.js';
import { editView } from './view-operations.js';

type OperationHandler = (collection: Collection, change: Change) => Result<Collection>;

/** Replacing content cannot change the identity or revision of the planning snapshot. */
function replaceDocument(collection: Collection, replacement: Collection): Result<Collection> {
  const identityChanged =
    collection.id !== replacement.id || collection.revision !== replacement.revision;
  if (identityChanged)
    return failure(
      'identity',
      'collection',
      'Collection identity and revision are fixed during planning',
    );
  return success(preserveOverrides(replacement, collection));
}

/** Typed rejection for a mismatched internal dispatch; checked input never selects this path. */
function unsupportedOperation(): Result<Collection> {
  return failure('shape', 'changes', 'Unsupported operation');
}

// Each handler narrows its own payload; the table is exhaustive over the shipped operation union.
const operationHandlers: Readonly<Record<Change['op'], OperationHandler>> = {
  create: (collection, change) => {
    if (change.op !== 'create') return unsupportedOperation();
    return writeRecord(collection, change);
  },
  replace: (collection, change) => {
    if (change.op !== 'replace') return unsupportedOperation();
    return writeRecord(collection, change);
  },
  remove: (collection, change) => {
    if (change.op !== 'remove') return unsupportedOperation();
    return removeRecord(collection, change);
  },
  'delete-object': (collection, change) => {
    if (change.op !== 'delete-object') return unsupportedOperation();
    return deleteObject(collection, change);
  },
  'replace-document': (collection, change) => {
    if (change.op !== 'replace-document') return unsupportedOperation();
    return replaceDocument(collection, change.value);
  },
  hide: (collection, change) => {
    if (change.op !== 'hide') return unsupportedOperation();
    return editView(collection, change);
  },
  'reset-layout': (collection, change) => {
    if (change.op !== 'reset-layout') return unsupportedOperation();
    return editView(collection, change);
  },
  'reset-route': (collection, change) => {
    if (change.op !== 'reset-route') return unsupportedOperation();
    return editView(collection, change);
  },
};

/**
 * Dispatches one parsed operation without validating intermediate domain state.
 * A typed failure stops planning. Pure replay against the same snapshot is safe;
 * planChanges owns final validation and Authoring owns commit/recovery.
 */
export function applyOperation(collection: Collection, change: Change): Result<Collection> {
  const handler = operationHandlers[change.op];
  return handler(collection, change);
}
