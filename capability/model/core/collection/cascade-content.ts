import type { ObjectId } from '../../contract/brands.js';
import type { ContentBlock } from '../../contract/records/content.js';
import type { DiagramObject } from '../../contract/records/object.js';

/** A composite key pointing at the deleted entity can no longer define a valid relationship. */
function keyGroupReferencesObject(block: ContentBlock, removedId: ObjectId): boolean {
  if (block.kind !== 'keygroup') return false;
  if (block.references === undefined) return false;
  return block.references.some((endpoint) => endpoint.object === removedId);
}

/** Only canonical object links are removed; URI links remain external content. */
function linksToObject(block: ContentBlock, removedId: ObjectId): boolean {
  if (block.kind !== 'link') return false;
  return block.target.kind === 'object' && block.target.id === removedId;
}

/** Preserve the field itself while removing the foreign-key declaration and target together. */
function clearDeletedFieldReference(block: ContentBlock, removedId: ObjectId): ContentBlock {
  if (block.kind !== 'field') return block;
  if (block.references?.object !== removedId) return block;
  const { key: removedKey, references: removedReference, ...ordinaryField } = block;
  void removedKey;
  void removedReference;
  return ordinaryField;
}

/**
 * Removes content dependencies on one explicitly cascaded object deletion. Composite
 * foreign keys and local links are removed; scalar fields survive without their FK role.
 * Pure copy; planChanges validates the final result and Authoring owns commit/recovery.
 */
export function cascadeContent(object: DiagramObject, removedId: ObjectId): DiagramObject {
  const survivingBlocks = object.content.filter(
    (block) => !keyGroupReferencesObject(block, removedId) && !linksToObject(block, removedId),
  );
  const content = survivingBlocks.map((block) => clearDeletedFieldReference(block, removedId));
  return { ...object, content };
}
