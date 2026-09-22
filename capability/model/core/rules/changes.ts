import type { Diagnostic } from '../../contract/errors.js';
import type { ChangeBlock, ChangeEntry } from '../../contract/records/change-block.js';
import type { Collection } from '../../contract/records/collection.js';
import type { DiagramObject } from '../../contract/records/object.js';
import { diagnoseWhen } from '../invariants/issues.js';
import { duplicates } from '../invariants/duplicates.js';

type Target = ChangeEntry['target'];
type ObjectTarget = Extract<Target, { kind: 'object' }>;
type RelationshipTarget = Extract<Target, { kind: 'relationship' }>;
interface Occurrence {
  readonly block: string;
  readonly index: number;
}
interface TargetOwners {
  readonly label: string;
  readonly first: Occurrence;
  readonly later: Occurrence[];
}

/** Change targets resolve, and each target has one status across all change blocks (E112). */
export function validateChanges(collection: Collection): readonly Diagnostic[] {
  return [
    ...duplicates(collection.changes, (block) => block.id, 'changes'),
    ...collection.changes.flatMap((block) => blockTargetIssues(block, collection)),
    ...repeatedTargetIssues(collection.changes),
  ];
}

function blockTargetIssues(block: ChangeBlock, collection: Collection): readonly Diagnostic[] {
  return block.entries.flatMap((entry, index) =>
    targetIssues(entry.target, collection, `changes.${block.id}.entries.${index}`),
  );
}

function targetIssues(target: Target, collection: Collection, path: string): readonly Diagnostic[] {
  if (target.kind === 'relationship') return relationshipIssues(target, collection, path);
  return objectIssues(target, collection, path);
}

function relationshipIssues(
  target: RelationshipTarget,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  const exists = collection.relationships.some((item) => item.id === target.relationship);
  return diagnoseWhen(!exists, 'reference', path, undeclared(target.relationship));
}

function objectIssues(
  target: ObjectTarget,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  const object = collection.objects.find((item) => item.id === target.object);
  if (object === undefined) return diagnoseWhen(true, 'reference', path, undeclared(target.object));
  return memberIssues(object, target.member, path);
}

function memberIssues(
  object: DiagramObject,
  member: string | undefined,
  path: string,
): readonly Diagnostic[] {
  if (member === undefined) return [];
  const members = object.content.map((block) => block.id as string);
  const exposes = members.map((item) => `@${item}`).join(', ');
  return diagnoseWhen(
    !members.includes(member),
    'reference',
    `${path}.member`,
    `E102 resolve: @${object.id} exposes: ${exposes}.`,
  );
}

function undeclared(targetId: string): string {
  return `E101 resolve: @${targetId} is not declared.`;
}

/** E112 names the first two blocks, in declaration order, that address the same target. */
function repeatedTargetIssues(changes: readonly ChangeBlock[]): readonly Diagnostic[] {
  const owners = new Map<string, TargetOwners>();
  changes.forEach((block) => {
    block.entries.forEach((entry, index) => {
      addOwner(owners, entry.target, { block: block.id, index });
    });
  });
  return [...owners.values()].flatMap(repeatIssue);
}

function addOwner(owners: Map<string, TargetOwners>, target: Target, occurrence: Occurrence): void {
  const label = targetLabel(target);
  const key = `${target.kind}:${label}`;
  const current = owners.get(key);
  if (current === undefined) owners.set(key, { label, first: occurrence, later: [] });
  else current.later.push(occurrence);
}

/** The error lands on the repeating entry, so its span is that exact ref. */
function repeatIssue(owner: TargetOwners): readonly Diagnostic[] {
  const second = owner.later.find((item) => item.block !== owner.first.block);
  if (second === undefined) return [];
  return [
    {
      code: 'duplicate',
      path: `changes.${second.block}.entries.${second.index}`,
      message: `E112 delta: ${owner.label} is in @${owner.first.block} and @${second.block}. Keep one.`,
    },
  ];
}

function targetLabel(target: Target): string {
  if (target.kind === 'relationship') return `@${target.relationship}`;
  return memberLabel(target.object, target.member);
}

function memberLabel(object: string, member: string | undefined): string {
  if (member === undefined) return `@${object}`;
  return `@${object}.@${member}`;
}
