import type { Collection, ContentBlock } from '../../contract/ports/model.js';
import type { Operation } from '../../contract/records/syntax.js';
import { lowerContent } from '../lowering/content.js';
import { id, type RawRecord } from '../lowering/fields.js';
import { reject } from '../validation/outcomes.js';
import { blockOwner, blockId, findRecord } from './targets.js';
/** Replace one content record while preserving all sibling blocks, ports and canonical metadata. */
export function replaceBlock(
  collection: Collection,
  operation: Operation,
  value: RawRecord,
): RawRecord {
  const owner = blockOwner(collection, operation);
  const target = blockId(operation);
  return {
    op: 'replace',
    target: 'objects',
    value: {
      ...owner,
      content: owner.content.map((block) => (block.id === target ? value : block)),
    },
  };
}
/** Structural block operations retain IDs and ordering; final Model planning owns endpoint validity. */
export function editBlocks(collection: Collection, operation: Operation): RawRecord {
  const owner = blockOwner(collection, operation);
  const content = changedContent(owner.content, operation);
  return { op: 'replace', target: 'objects', value: { ...owner, content } };
}
/** Only insertion omits a member address; remove/move require the existing stable block. */
function changedContent(
  content: readonly ContentBlock[],
  operation: Operation,
): readonly RawRecord[] {
  if (operation.action === 'add') return addContent(content, operation);
  const target = findRecord(content, blockId(operation), operation);
  if (operation.action === 'remove') return content.filter((item) => item.id !== target.id);
  return moveContent(content, target, operation);
}
/** Insertion body is one complete content declaration; duplicates are rejected by final Model validation. */
function addContent(content: readonly ContentBlock[], operation: Operation): readonly RawRecord[] {
  if (operation.declaration === null)
    reject('syntax', operation.span, 'One content declaration', 'Missing inserted block');
  return insertBefore(content, lowerContent(operation.declaration), beforeId(operation), operation);
}
/** Moving before itself is an explicit no-op, not an accidental deletion. */
function moveContent(
  content: readonly ContentBlock[],
  target: ContentBlock,
  operation: Operation,
): readonly RawRecord[] {
  const before = beforeId(operation);
  if (before === null)
    reject('syntax', operation.span, 'before=@block', 'Move requires a destination');
  if (before === target.id) return content;
  return insertBefore(
    content.filter((item) => item.id !== target.id),
    target,
    before,
    operation,
  );
}
/** Optional append is distinct from a missing or invalid named insertion target. */
function beforeId(operation: Operation): string | null {
  if (operation.fields.before === undefined) return null;
  return id(operation.fields, 'before');
}
/** Array copies preserve order and leave the staged record immutable. Language owns correction. */
function insertBefore(
  content: readonly ContentBlock[],
  block: RawRecord,
  before: string | null,
  operation: Operation,
): readonly RawRecord[] {
  if (before === null) return [...content, block];
  const index = content.findIndex((item) => item.id === before);
  if (index < 0)
    reject(
      'unknown-target',
      operation.span,
      'Existing sibling block',
      'Insertion target does not exist',
      before,
    );
  return [...content.slice(0, index), block, ...content.slice(index)];
}
