import type { DescendantId, ObjectId } from '../../contract/brands.js';
import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type { Section, SequenceItem } from '../../contract/records/section.js';
import { duplicates } from '../invariants/duplicates.js';
import { diagnoseWhen } from '../invariants/issues.js';
import { hasCycle, visibleObjects } from './groups.js';
import { descendants } from '../objects/content.js';
import { resolveCallableEndpoint } from '../relationships/callable.js';
import { referenceIssue } from '../invariants/issues.js';

type Fragment = Extract<SequenceItem, { kind: 'fragment' }>;

/** Fragment branches share the sequence identity namespace with events and fragments. */
function itemIdentities(item: SequenceItem): readonly DescendantId[] {
  if (item.kind === 'event') return [item.id];
  return [item.id, ...item.branches.map((branch) => branch.id)];
}

/** alt has alternatives; opt and loop contain a single unbranched body. */
function hasValidBranchCount(fragment: Fragment): boolean {
  if (fragment.operator === 'alt') return fragment.branches.length >= 2;
  return fragment.branches.length === 0;
}

/** Branch identities are checked globally; branch labels must also be unique within their fragment. */
function validateFragment(item: SequenceItem, path: string): readonly Diagnostic[] {
  if (item.kind !== 'fragment') return [];
  const countIssues = diagnoseWhen(
    !hasValidBranchCount(item),
    'sequence',
    path,
    'alt needs at least two branches; opt/loop forbid branches',
  );
  const labelIssues = duplicates(item.branches, (branch) => branch.label, `${path}.branches`);
  return [...countIssues, ...labelIssues];
}

/** Children of alt identify one of its branches; other parents forbid a branch selector. */
function validateBranchMembership(
  item: SequenceItem,
  owner: Fragment,
  path: string,
): readonly Diagnostic[] {
  if (owner.operator !== 'alt') {
    return diagnoseWhen(
      item.branch !== undefined,
      'sequence',
      path,
      'Only alt children identify a branch',
    );
  }
  const branchExists = owner.branches.some((branch) => branch.id === item.branch);
  return diagnoseWhen(!branchExists, 'sequence', path, 'Child must name an owning alt branch');
}

/** A missing parent means root scope, where a branch selector is not meaningful. */
function validateParent(item: SequenceItem, section: Section, path: string): readonly Diagnostic[] {
  if (item.parent === undefined)
    return diagnoseWhen(item.branch !== undefined, 'sequence', path, 'Root item has no branch');
  const owner = section.sequence.find((candidate) => candidate.id === item.parent);
  if (owner?.kind !== 'fragment')
    return diagnoseWhen(true, 'sequence', path, 'Parent must resolve to a fragment');
  return validateBranchMembership(item, owner, path);
}

/** A sequence endpoint must resolve to a visible participant or a directly shown module used by an event. */
function isVisibleParticipant(id: ObjectId, section: Section, collection: Collection): boolean {
  const object = collection.objects.find((candidate) => candidate.id === id);
  if (!visibleObjects(section).includes(id)) return false;
  return canParticipate(object, id, section);
}

function canParticipate(
  object: Collection['objects'][number] | undefined,
  id: ObjectId,
  section: Section,
): boolean {
  if (object === undefined) return false;
  switch (object.kind) {
    case 'participant':
      return true;
    case 'module':
      return directAppearance(id, section);
    default:
      return false;
  }
}

function directAppearance(id: ObjectId, section: Section): boolean {
  return section.appearances.some(
    (appearance) => appearance.object === id && appearance.group === undefined,
  );
}

/** Fragments carry no endpoints; message events validate both participants independently. */
function validateEvent(
  item: SequenceItem,
  section: Section,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (item.kind !== 'event') return [];
  const endpointIssues = [item.source, item.target].flatMap((id) =>
    diagnoseWhen(
      !isVisibleParticipant(id, section, collection),
      'sequence',
      `${path}.${id}`,
      'Event endpoint must be a visible participant or direct top-level module',
    ),
  );
  return [...endpointIssues, ...validateOperation(item, collection, path)];
}

function validateOperation(
  item: Extract<SequenceItem, { kind: 'event' }>,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (item.operation === undefined) return [];
  const operation = item.operation;
  const operationPath = `${path}.operation`;
  if (item.message === 'return')
    return operationDiagnostic(operationPath, 'Return events cannot reference an operation');
  return validateOperationTarget(item, operation, collection, operationPath);
}

function validateOperationTarget(
  item: Extract<SequenceItem, { kind: 'event' }>,
  operation: NonNullable<Extract<SequenceItem, { kind: 'event' }>['operation']>,
  collection: Collection,
  operationPath: string,
): readonly Diagnostic[] {
  if (operation.object !== item.target)
    return operationDiagnostic(operationPath, 'Operation owner must equal the event target');
  const owner = collection.objects.find((object) => object.id === operation.object);
  return owner === undefined
    ? referenceIssue(true, operationPath)
    : validateCallableOperation(collection, operation, owner, operationPath);
}

function validateCallableOperation(
  collection: Collection,
  operation: NonNullable<Extract<SequenceItem, { kind: 'event' }>['operation']>,
  owner: Collection['objects'][number],
  operationPath: string,
): readonly Diagnostic[] {
  if (resolveCallableEndpoint(collection, operation) !== undefined) return [];
  return invalidOperation(operation, owner, operationPath);
}

function operationDiagnostic(path: string, message: string): readonly Diagnostic[] {
  return [{ code: 'sequence', path, message }];
}

function invalidOperation(
  operation: NonNullable<Extract<SequenceItem, { kind: 'event' }>['operation']>,
  owner: Collection['objects'][number],
  operationPath: string,
): readonly Diagnostic[] {
  if (operation.member === undefined)
    return operationDiagnostic(
      operationPath,
      'Operation must address a canonical function or signature',
    );
  const member = descendants(owner).find((candidate) => candidate.id === operation.member);
  return [
    ...diagnoseWhen(
      member?.kind !== 'signature',
      'sequence',
      `${operationPath}.member`,
      'Operation must resolve to a signature',
    ),
    ...diagnoseWhen(
      !['module', 'interface', 'function'].includes(owner.kind),
      'sequence',
      operationPath,
      'Operation owner must be callable',
    ),
  ];
}

/** No parent means root scope; unresolved parents are diagnosed independently of cycles. */
function parentId(id: DescendantId, section: Section): DescendantId | undefined {
  const item = section.sequence.find((candidate) => candidate.id === id);
  return item?.parent;
}

/** All items carry containment metadata, so cycle checks apply to events and fragments alike. */
function validateSequenceItem(
  item: SequenceItem,
  section: Section,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  const fragmentIssues = validateFragment(item, path);
  const parentIssues = validateParent(item, section, path);
  const eventIssues = validateEvent(item, section, collection, path);
  const cycleExists = hasCycle(item.id, (id) => parentId(id, section));
  const cycleIssues = diagnoseWhen(
    cycleExists,
    'sequence',
    path,
    'Fragment containment must be acyclic',
  );
  return [...fragmentIssues, ...parentIssues, ...eventIssues, ...cycleIssues];
}

/** Order values need only be unique within the same parent and alt branch, not contiguous. */
function siblingOrderKey(item: SequenceItem): string {
  const parentScope = item.parent ?? '';
  const branchScope = item.branch ?? '';
  return `${parentScope}:${branchScope}:${item.order}`;
}

/**
 * Validates sequence identities, sibling ordering, fragment containment and message participants.
 * Other modes return no sequence diagnostics here. Pure replay; Authoring owns correction
 * and commit/recovery. Events remain ordered semantic records, not routed wire appearances.
 */
export function validateSequence(section: Section, collection: Collection): readonly Diagnostic[] {
  if (section.mode !== 'sequence') return [];
  const path = `sections.${section.id}.sequence`;
  const wireIssues = diagnoseWhen(
    section.wires.length > 0,
    'sequence',
    path,
    'Sequence uses ordered events, not wire appearances',
  );
  const identityIssues = duplicates(section.sequence.flatMap(itemIdentities), (id) => id, path);
  const orderIssues = duplicates(section.sequence, siblingOrderKey, `${path}.order`);
  const itemIssues = section.sequence.flatMap((item) =>
    validateSequenceItem(item, section, collection, `${path}.${item.id}`),
  );
  return [...wireIssues, ...identityIssues, ...orderIssues, ...itemIssues];
}
