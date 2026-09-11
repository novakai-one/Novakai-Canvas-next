import type { Collection } from '../../contract/ports/model.js';
import type { Operation } from '../../contract/records/syntax.js';
import type { ResolvedResources } from '../../contract/records/requests.js';
import { lowerNode, lowerRecord } from '../lowering/content.js';
import { lowerSection } from '../lowering/views.js';
import { lowerAsset } from '../lowering/resources.js';
import type { RawRecord } from '../lowering/fields.js';
import { reject } from '../validation/outcomes.js';
import { requirePlainAddress } from './targets.js';
const namespaces: Readonly<Record<string, string>> = {
  node: 'objects',
  wire: 'relationships',
  section: 'sections',
  asset: 'assets',
  source: 'sources',
};
/** Whole-record structural operations remain Model change data; Language never copies cascade semantics. */
export function structuralChange(operation: Operation, resources: ResolvedResources): RawRecord {
  requirePlainAddress(operation);
  if (operation.action === 'delete') return deleteRecord(operation);
  const value = declarationRecord(operation, resources);
  return {
    op: operation.action === 'add' ? 'create' : 'replace',
    target: namespaces[operation.target],
    value,
  };
}
/** Node deletion is the only explicit cascade command; Model owns the dependency cleanup. */
function deleteRecord(operation: Operation): RawRecord {
  if (operation.target === 'node')
    return {
      op: 'delete-object',
      id: operation.address.id,
      cascade: operation.fields.cascade?.value ?? false,
    };
  return { op: 'remove', target: namespaces[operation.target], id: operation.address.id };
}
/** Construct-specific lowering is reused between document creation and patches. */
function declarationRecord(operation: Operation, resources: ResolvedResources): RawRecord {
  const item = operation.declaration;
  if (item === null)
    reject('syntax', operation.span, 'Complete declaration', 'Missing replacement declaration');
  const translators: Readonly<Record<string, () => RawRecord>> = {
    node: () => lowerNode(item),
    section: () => lowerSection(item),
    asset: () => lowerAsset(item, resources),
  };
  const translate = translators[item.kind];
  return translate === undefined ? lowerRecord(item) : translate();
}
/** Explicit reset operations preserve semantic constraints and clear only Model-owned manual data. */
export function resetChange(operation: Operation): RawRecord {
  if (operation.target === 'layout') {
    requirePlainAddress(operation);
    return { op: 'reset-layout', section: operation.address.id };
  }
  if (operation.address.section === undefined)
    reject('invalid-value', operation.span, '@section/@wire', 'Route reset needs section address');
  return {
    op: 'reset-route',
    section: operation.address.section,
    relationship: operation.address.id,
  };
}
/** Empty input cannot invent a collection; operation compilers always receive a valid original snapshot. */
export function requireSnapshot(
  snapshot: Collection | null,
  operation: { readonly collection: string; readonly span: Operation['span'] },
): Collection {
  if (snapshot === null)
    reject(
      'unknown-target',
      operation.span,
      'Existing collection snapshot',
      'Patch needs a snapshot',
    );
  if (snapshot.id !== operation.collection)
    reject(
      'unknown-target',
      operation.span,
      'Matching collection identity',
      'Patch targets a different collection',
    );
  return snapshot;
}
