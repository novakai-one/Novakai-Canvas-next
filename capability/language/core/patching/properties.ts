import type { Collection } from '../../contract/ports/model.js';
import type { Operation } from '../../contract/records/syntax.js';
import type { ResolvedResources } from '../../contract/records/requests.js';
import type { RawRecord } from '../lowering/fields.js';
import { propertyTarget } from './property-targets.js';
import { changedProperties } from './property-values.js';
import { resolveTheme } from '../lowering/resources.js';
import { modeLayout } from '../lowering/layout.js';
import { isReference } from '../parsing/value-types.js';
import { reject } from '../validation/outcomes.js';
/** Scalar edits preserve all unmentioned canonical data and human geometry. Model validates the final batch. */
export function editProperties(
  collection: Collection,
  operation: Operation,
  resources: ResolvedResources,
): RawRecord {
  const target = propertyTarget(collection, operation);
  const changed = changedProperties(target.record, operation, target.properties);
  const semantic = adjustNestedProperties(target.record, changed, operation, resources);
  return target.write(semantic);
}
/** Layout and link syntax flatten readability only; their canonical data remains explicitly nested. */
function adjustNestedProperties(
  previous: RawRecord,
  next: RawRecord,
  operation: Operation,
  resources: ResolvedResources,
): RawRecord {
  if (operation.target === 'collection')
    return collectionProperties(previous, next, operation, resources);
  return adjustSectionOrContent(previous, next, operation);
}
/** Section layout and content navigation each retain their own nested representation. */
function adjustSectionOrContent(
  previous: RawRecord,
  next: RawRecord,
  operation: Operation,
): RawRecord {
  if (operation.target === 'section') return nestedLayout(previous, next, operation, 'layout');
  return previous.kind === 'link' ? linkProperties(previous, next, operation) : next;
}
/** Theme aliases resolve only from supplied exact metadata, while unchanged pins survive untouched. */
function collectionProperties(
  previous: RawRecord,
  next: RawRecord,
  operation: Operation,
  resources: ResolvedResources,
): RawRecord {
  const layout = nestedLayout(previous, next, operation, 'arrangement');
  if (typeof next.theme !== 'string') return layout;
  return { ...layout, theme: resolveTheme(next.theme, resources, operation.span) };
}
/** Checked owner records contain plain nested layout/link data; reject a dishonest provider shape. */
function nestedRecord(value: unknown, operation: Operation): RawRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    reject(
      'invalid-input',
      operation.span,
      'Canonical nested record',
      'Owner supplied an invalid nested record',
    );
  return Object.fromEntries(Object.entries(value));
}
/** Only mentioned layout fields update; resetting algorithm chooses the owning mode's default. */
function nestedLayout(
  previous: RawRecord,
  next: RawRecord,
  operation: Operation,
  field: 'layout' | 'arrangement',
): RawRecord {
  const before = nestedRecord(previous[field], operation);
  const { algorithm, direction, gap, ...remaining } = next;
  const modified = { algorithm, direction, gap };
  const updates = Object.fromEntries(
    Object.entries(modified).filter(([, value]) => value !== undefined),
  );
  const resetAlgorithm = operation.properties.includes('layout');
  const defaultAlgorithm = field === 'arrangement' ? 'grid' : modeLayout(String(next.mode));
  const layout = { ...before, ...updates };
  const resolved = resetAlgorithm ? { ...layout, algorithm: defaultAlgorithm } : layout;
  return { ...remaining, [field]: resolved };
}
/** A local navigation target can retain/select a section; URI links cannot carry that local selector. */
function linkProperties(previous: RawRecord, next: RawRecord, operation: Operation): RawRecord {
  const target = linkTarget(previous, operation);
  const section = operation.fields.section;
  const { section: unused, ...remaining } = next;
  void unused;
  if (section !== undefined)
    return { ...remaining, target: withSection(target, section.value, operation) };
  if (operation.properties.includes('section'))
    return { ...remaining, target: withoutSection(target) };
  return { ...remaining, target };
}
/** Assigning a new URI deliberately replaces its navigation target; other edits retain the target. */
function linkTarget(previous: RawRecord, operation: Operation): RawRecord {
  const assigned = operation.fields.target;
  if (assigned === undefined) return nestedRecord(previous.target, operation);
  if (isReference(assigned.value))
    return { kind: 'object', id: assigned.value.id, ...retainedSection(previous, operation) };
  return { kind: 'uri', uri: assigned.value };
}
/** Only collection-local object links may select a section. */
function withSection(
  target: RawRecord,
  value: import('../../contract/records/syntax.js').SyntaxValue,
  operation: Operation,
): RawRecord {
  if (target.kind !== 'object')
    reject(
      'invalid-value',
      operation.span,
      'Object link',
      'URI links cannot select a local section',
    );
  if (!isReference(value))
    reject('invalid-value', operation.span, 'Section identity', 'Invalid link section');
  return { ...target, section: value.id };
}
/** Explicit unset removes only the local section selector. */
function withoutSection(target: RawRecord): RawRecord {
  const { section, ...remaining } = target;
  void section;
  return remaining;
}

/** Reconnecting an object link retains its omitted section preference; URI payload never leaks across kinds. */
function retainedSection(previous: RawRecord, operation: Operation): RawRecord {
  const target = nestedRecord(previous.target, operation);
  if (target.section === undefined) return {};
  return { section: target.section };
}
