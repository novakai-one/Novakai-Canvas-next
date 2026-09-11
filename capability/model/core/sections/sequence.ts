import type { Collection } from '../../contract/records/collection.js';
import type { Section, SequenceItem } from '../../contract/records/section.js';
import { duplicates, issue } from '../invariants/issues.js';
import { hasCycle, visibleObjects } from './groups.js';
function identities(item: SequenceItem): readonly string[] {
  if (item.kind === 'event') return [item.id];
  return [item.id, ...item.branches.map((branch) => branch.id)];
}
function fragment(item: SequenceItem, path: string) {
  if (item.kind !== 'fragment') return [];
  const countValid =
    item.operator === 'alt' ? item.branches.length >= 2 : item.branches.length === 0;
  return [
    ...issue(
      !countValid,
      'sequence',
      path,
      'alt needs at least two branches; opt/loop forbid branches',
    ),
    ...duplicates(item.branches, (branch) => branch.label, `${path}.branches`),
  ];
}
function parent(item: SequenceItem, section: Section, path: string) {
  if (!item.parent)
    return issue(item.branch !== undefined, 'sequence', path, 'Root item has no branch');
  const owner = section.sequence.find((candidate) => candidate.id === item.parent);
  if (owner?.kind !== 'fragment')
    return issue(true, 'sequence', path, 'Parent must resolve to a fragment');
  return branch(item, owner, path);
}
function branch(
  item: SequenceItem,
  owner: Extract<SequenceItem, { kind: 'fragment' }>,
  path: string,
) {
  if (owner.operator !== 'alt')
    return issue(
      item.branch !== undefined,
      'sequence',
      path,
      'Only alt children identify a branch',
    );
  return issue(
    !owner.branches.some((branch) => branch.id === item.branch),
    'sequence',
    path,
    'Child must name an owning alt branch',
  );
}
function event(item: SequenceItem, section: Section, collection: Collection, path: string) {
  if (item.kind !== 'event') return [];
  const visible = visibleObjects(section);
  return [item.source, item.target].flatMap((id) =>
    issue(
      !visible.includes(id) ||
        collection.objects.find((object) => object.id === id)?.kind !== 'participant',
      'sequence',
      `${path}.${id}`,
      'Event endpoint must be a visible participant',
    ),
  );
}
export function validateSequence(section: Section, collection: Collection) {
  if (section.mode !== 'sequence') return [];
  const path = `sections.${section.id}.sequence`;
  return [
    ...issue(
      section.wires.length > 0,
      'sequence',
      path,
      'Sequence uses ordered events, not wire appearances',
    ),
    ...duplicates(section.sequence.flatMap(identities), (id) => id, path),
    ...duplicates(
      section.sequence,
      (item) => `${item.parent ?? ''}:${item.branch ?? ''}:${item.order}`,
      `${path}.order`,
    ),
    ...section.sequence.flatMap((item) => [
      ...fragment(item, `${path}.${item.id}`),
      ...parent(item, section, `${path}.${item.id}`),
      ...event(item, section, collection, `${path}.${item.id}`),
      ...issue(
        hasCycle(item.id, (id) => section.sequence.find((item) => item.id === id)?.parent),
        'sequence',
        `${path}.${item.id}`,
        'Fragment containment must be acyclic',
      ),
    ]),
  ];
}
