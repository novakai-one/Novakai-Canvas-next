import type { Collection } from '../../contract/records/collection.js';
import type { Change } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../invariants/issues.js';
import { preserveOverrides } from './preservation.js';
import { writeRecord } from './records.js';
import { deleteObject, removeRecord } from './removal.js';
import { editView } from './view-operations.js';
function replaceDocument(collection: Collection, value: Collection): Result<Collection> {
  if (collection.id !== value.id || collection.revision !== value.revision)
    return failure(
      'identity',
      'collection',
      'Collection identity and revision are fixed during planning',
    );
  return success(preserveOverrides(value, collection));
}
function structural(collection: Collection, change: Change): Result<Collection> {
  if (change.op === 'delete-object') return deleteObject(collection, change);
  if (change.op === 'remove') return removeRecord(collection, change);
  return other(collection, change);
}
function other(collection: Collection, change: Change): Result<Collection> {
  if (change.op === 'replace-document') return replaceDocument(collection, change.value);
  if ('section' in change) return editView(collection, change);
  return failure('shape', 'changes', 'Unsupported operation');
}
export function applyOperation(collection: Collection, change: Change): Result<Collection> {
  if (change.op === 'create' || change.op === 'replace') return writeRecord(collection, change);
  return structural(collection, change);
}
