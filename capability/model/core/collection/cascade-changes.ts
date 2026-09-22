import type { Collection } from '../../contract/records/collection.js';
import type { ChangeBlock, ChangeEntry } from '../../contract/records/change-block.js';

type Target = ChangeEntry['target'];
type ObjectTarget = Extract<Target, { kind: 'object' }>;

/**
 * Drops change entries whose target the cascade removed (the object, any of its members, an
 * incident relationship, or a member cascadeContent stripped); blocks left empty are dropped.
 */
export function cascadeChanges(cascaded: Collection): readonly ChangeBlock[] {
  return cascaded.changes
    .map((block) => ({ ...block, entries: survivingEntries(block, cascaded) }))
    .filter((block) => block.entries.length > 0);
}

function survivingEntries(block: ChangeBlock, cascaded: Collection): readonly ChangeEntry[] {
  return block.entries.filter((entry) => resolves(entry.target, cascaded));
}

function resolves(target: Target, cascaded: Collection): boolean {
  if (target.kind === 'relationship')
    return cascaded.relationships.some((item) => item.id === target.relationship);
  return objectResolves(target, cascaded);
}

function objectResolves(target: ObjectTarget, cascaded: Collection): boolean {
  const object = cascaded.objects.find((item) => item.id === target.object);
  if (object === undefined) return false;
  return target.member === undefined || object.content.some((block) => block.id === target.member);
}
