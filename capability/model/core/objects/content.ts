import type { DescendantId } from '../../contract/brands.js';
import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type { ContentBlock } from '../../contract/records/content.js';
import type { DiagramObject, ObjectKind } from '../../contract/records/object.js';
import { duplicates } from '../invariants/duplicates.js';
import { diagnoseWhen, referenceIssue } from '../invariants/issues.js';

/** Identity and kind needed to resolve an endpoint without exposing content payload details. */
export interface ObjectDescendant {
  readonly id: DescendantId;
  readonly kind: ContentBlock['kind'] | 'port' | 'row';
}

// Unlisted content kinds are legal on any object; listed kinds have semantic placement rules.
const contentOwners: Readonly<Partial<Record<ContentBlock['kind'], readonly ObjectKind[]>>> = {
  field: ['entity'],
  keygroup: ['entity'],
  member: ['module', 'interface', 'function'],
  signature: ['module', 'interface', 'function'],
};

/** Table rows share their owning object's identity namespace with blocks and ports. */
function contentDescendants(block: ContentBlock): readonly ObjectDescendant[] {
  const identity: ObjectDescendant = { id: block.id, kind: block.kind };
  if (block.kind !== 'table') return [identity];
  const rows = block.rows.map((row): ObjectDescendant => ({ id: row.id, kind: 'row' }));
  return [identity, ...rows];
}

/**
 * Lists an object's descendant identities without suppressing duplicates. Endpoint and
 * identity validators consume this projection; no state changes or recovery are involved.
 */
export function descendants(object: DiagramObject): readonly ObjectDescendant[] {
  const ports = object.ports.map((port): ObjectDescendant => ({ id: port.id, kind: 'port' }));
  const content = object.content.flatMap(contentDescendants);
  return [...ports, ...content];
}

/** Absence from the policy table means unrestricted placement, not an unknown kind. */
function validateContentPlacement(
  block: ContentBlock,
  object: DiagramObject,
): readonly Diagnostic[] {
  const allowedOwners = contentOwners[block.kind];
  if (allowedOwners === undefined) return [];
  return diagnoseWhen(
    !allowedOwners.includes(object.kind),
    'content',
    `objects.${object.id}.content.${block.id}`,
    'Content kind is not legal on this object kind',
  );
}

/** Each table row must supply exactly one cell per declared column. */
function validateTableWidth(block: ContentBlock, path: string): readonly Diagnostic[] {
  if (block.kind !== 'table') return [];
  return block.rows.flatMap((row) =>
    diagnoseWhen(
      row.cells.length !== block.columns.length,
      'content',
      `${path}.${row.id}`,
      'Row width must equal column count',
    ),
  );
}

/** Check local identities before payload compatibility, then resolve the canonical theme role. */
function validateObjectContent(
  object: DiagramObject,
  collection: Collection,
): readonly Diagnostic[] {
  const path = `objects.${object.id}`;
  const identityIssues = duplicates(descendants(object), (item) => item.id, `${path}.descendants`);
  const blockIssues = object.content.flatMap((block) => {
    const placementIssues = validateContentPlacement(block, object);
    const tableIssues = validateTableWidth(block, `${path}.content.${block.id}`);
    return [...placementIssues, ...tableIssues];
  });
  const roleIssues = referenceIssue(!collection.theme.roles.includes(object.role), `${path}.role`);
  return [...identityIssues, ...blockIssues, ...roleIssues];
}

/**
 * Validates structured content, descendant uniqueness and object theme roles. Returns all
 * failures without mutation. Pure replay; Authoring owns correction and commit/recovery.
 */
export function validateContent(collection: Collection): readonly Diagnostic[] {
  return collection.objects.flatMap((object) => validateObjectContent(object, collection));
}
