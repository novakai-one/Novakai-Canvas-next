import type {
  Operation,
  TargetKind,
  Action,
  Declaration,
  Fields,
  Reference,
} from '../../contract/records/syntax.js';
import type { Property } from '../../contract/records/vocabulary.js';
import { patchProperties, operationWords } from '../vocabulary/patch-properties.js';
import { reject, accepted } from '../validation/outcomes.js';
import {
  peek,
  advance,
  consume,
  enter,
  leave,
  consumedSpan,
  type Cursor,
  type Parsed,
} from './cursor.js';
import { readIdentity, readReference } from './references.js';
import { reference } from '../lowering/fields.js';
import { readAttributes } from './attributes.js';
import { readDeclaration } from './declarations.js';
import { repeat } from './repetition.js';
type Reader = (cursor: Cursor) => Parsed<Operation>;
const readers: Readonly<Record<string, Reader>> = {
  add: readAdd,
  replace: readReplace,
  set: readSet,
  unset: readUnset,
  show: readMembership,
  hide: readMembership,
  connect: readMembership,
  disconnect: readMembership,
  delete: readDelete,
  reset: readReset,
  remove: readBlockMove,
  move: readBlockMove,
};
/** Read one bounded operation; each action has a distinct grammar and no arbitrary nested paths. */
export function readOperation(cursor: Cursor): Parsed<Operation> {
  const reader = readers[peek(cursor).text];
  if (reader === undefined)
    reject('syntax', peek(cursor).span, operationWords.join(' / '), 'Unknown patch operation');
  return reader(cursor);
}
/** One common operation record retains source ownership for later semantic diagnostics. */
function operation(
  start: Cursor,
  end: Cursor,
  action: Action,
  target: TargetKind,
  address: Reference,
  fields: Fields = {},
  declaration: Declaration | null = null,
  properties: readonly string[] = [],
): Parsed<Operation> {
  return {
    value: {
      action,
      target,
      address,
      fields,
      declaration,
      properties,
      span: consumedSpan(start, end),
    },
    next: end,
  };
}
/** Allowed target words are matched against a closed typed list. */
function targetKind(cursor: Cursor, allowed: readonly TargetKind[]): TargetKind {
  const kind = allowed.find((item) => item === peek(cursor).text);
  if (kind === undefined)
    reject('syntax', peek(cursor).span, allowed.join(' / '), 'Unknown operation target');
  return kind;
}
/** Add whole records or one block; no upsert semantics are implied. */
function readAdd(cursor: Cursor): Parsed<Operation> {
  if (peek(cursor, 1).text === 'block') return readAddBlock(cursor);
  return readDeclarationOperation(cursor, 'add', ['node', 'wire', 'asset', 'source', 'section']);
}
/** Replacements use complete node/section syntax and preserve identities through Model. */
function readReplace(cursor: Cursor): Parsed<Operation> {
  return readDeclarationOperation(cursor, 'replace', ['node', 'section']);
}
/** Declaration's positional ID is the operation target; a second ID is never consumed. */
function readDeclarationOperation(
  cursor: Cursor,
  action: 'add' | 'replace',
  allowed: readonly ('node' | 'wire' | 'asset' | 'source' | 'section')[],
): Parsed<Operation> {
  const start = advance(cursor);
  const target = targetKind(start, allowed);
  const declaration = readDeclaration(start, allowed);
  const identity = declaration.value.fields.id;
  if (identity === undefined)
    reject('syntax', peek(start).span, 'Declaration ID', 'Declaration has no ID');
  return operation(
    cursor,
    declaration.next,
    action,
    target,
    reference(identity),
    {},
    declaration.value,
  );
}
/** Collection has no repeated target ID; the patch header already owns collection identity. */
function readTarget(
  cursor: Cursor,
): Parsed<{ readonly target: TargetKind; readonly address: Reference }> {
  const target = targetKind(cursor, [
    'collection',
    'node',
    'wire',
    'block',
    'appearance',
    'section',
    'route',
  ]);
  if (target === 'collection')
    return { value: { target, address: { kind: 'reference', id: '' } }, next: advance(cursor) };
  const address = readReference(advance(cursor));
  return { value: { target, address: reference(address.value) }, next: address.next };
}
/** Set syntax checks the target-wide scalar vocabulary; block-kind narrowing occurs against staged content. */
function readSet(cursor: Cursor): Parsed<Operation> {
  const target = readTarget(advance(cursor));
  const fields = readAttributes(target.next, patchProperties[target.value.target]);
  if (Object.keys(fields.value).length === 0)
    reject(
      'syntax',
      peek(fields.next).span,
      'One or more named assignments',
      'Set requires properties',
    );
  return operation(
    cursor,
    fields.next,
    'set',
    target.value.target,
    target.value.address,
    fields.value,
  );
}
/** Unset consumes property names until the next operation or closing brace. */
function readUnset(cursor: Cursor): Parsed<Operation> {
  const target = readTarget(advance(cursor));
  const properties = accepted(repeat(target.next, continuesProperty, readPropertyName));
  if (properties.value.length === 0)
    reject(
      'syntax',
      peek(target.next).span,
      'One or more property names',
      'Unset requires properties',
    );
  return operation(
    cursor,
    properties.next,
    'unset',
    target.value.target,
    target.value.address,
    {},
    null,
    properties.value,
  );
}
/** A following action keyword ends an unset statement without depending on newline placement. */
function continuesProperty(cursor: Cursor): boolean {
  return peek(cursor).kind === 'word' && !operationWords.includes(peek(cursor).text);
}
/** Property names remain readable words, not paths or JSON selectors. */
function readPropertyName(cursor: Cursor): Parsed<string> {
  return { value: peek(cursor).text, next: advance(cursor) };
}
/** Membership operations always name both the canonical item and section. */
function readMembership(cursor: Cursor): Parsed<Operation> {
  const action = ['show', 'hide', 'connect', 'disconnect'].find(
    (item) => item === peek(cursor).text,
  );
  const item = readIdentity(advance(cursor));
  const section = readIdentity(consume(item.next, 'in'));
  if (action !== 'show' && action !== 'hide' && action !== 'connect' && action !== 'disconnect')
    reject('syntax', peek(cursor).span, 'Membership action', 'Invalid membership action');
  return operation(cursor, section.next, action, 'section', {
    kind: 'reference',
    id: item.value,
    section: section.value,
  });
}
/** Cascade belongs only to node deletion and is explicit; all other deletes preserve dependency validation. */
function readDelete(cursor: Cursor): Parsed<Operation> {
  const target = targetKind(advance(cursor), ['node', 'wire', 'section', 'asset', 'source']);
  const address = readReference(advance(cursor, 2));
  const properties: Readonly<Record<string, Property>> =
    target === 'node' ? { cascade: { type: 'boolean', field: 'cascade' } } : {};
  const attributes = readAttributes(address.next, properties);
  return operation(
    cursor,
    attributes.next,
    'delete',
    target,
    reference(address.value),
    attributes.value,
  );
}
/** Layout resets and route resets have different address scopes. */
function readReset(cursor: Cursor): Parsed<Operation> {
  const target = targetKind(advance(cursor), ['layout', 'route']);
  const address = readReference(advance(cursor, 2));
  return operation(cursor, address.next, 'reset', target, reference(address.value));
}
/** Block insertion has one child declaration and optional before identity after its body. */
function readAddBlock(cursor: Cursor): Parsed<Operation> {
  const address = readReference(advance(cursor, 2));
  const start = enter(consume(address.next, '{'));
  const child = readDeclaration(start, [
    'text',
    'code',
    'link',
    'list',
    'image',
    'icon',
    'field',
    'keygroup',
    'signature',
    'member',
    'table',
  ]);
  const end = leave(consume(child.next, '}'));
  const fields = readAttributes(end, { before: { type: 'id', field: 'before' } });
  return operation(
    cursor,
    fields.next,
    'add',
    'block',
    reference(address.value),
    fields.value,
    child.value,
  );
}
/** Move preserves identity within one object; remove only addresses a top-level content block. */
function readBlockMove(cursor: Cursor): Parsed<Operation> {
  const action = peek(cursor).text === 'move' ? 'move' : 'remove';
  const start = consume(advance(cursor), 'block');
  const address = readReference(start);
  const properties: Readonly<Record<string, Property>> =
    action === 'move' ? { before: { type: 'id', field: 'before', required: true } } : {};
  const fields = readAttributes(address.next, properties);
  return operation(cursor, fields.next, action, 'block', reference(address.value), fields.value);
}
