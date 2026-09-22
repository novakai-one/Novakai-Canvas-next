import type { Collection } from '../../contract/records/collection.js';
import type { ChangeBlock, ChangeEntry } from '../../contract/records/change-block.js';

type Target = ChangeEntry['target'];
type ObjectTarget = Extract<Target, { kind: 'object' }>;

/**
 * Drops change entries this cascade removed (the object, any of its members, an incident
 * relationship, or a member cascadeContent stripped); blocks left empty are dropped. An entry
 * that already dangled before the cascade is kept, so final validation reports it.
 */
export function cascadeChanges(before: Collection, cascaded: Collection): readonly ChangeBlock[] {
  return cascaded.changes
    .map((block) => ({ ...block, entries: survivingEntries(block, before, cascaded) }))
    .filter((block) => block.entries.length > 0);
}

function survivingEntries(
  block: ChangeBlock,
  before: Collection,
  cascaded: Collection,
): readonly ChangeEntry[] {
  return block.entries.filter(
    (entry) => resolves(entry.target, cascaded) || !resolves(entry.target, before),
  );
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
