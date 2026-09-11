import type { Reference, LocatedValue } from '../../contract/records/syntax.js';
import { reject } from '../validation/outcomes.js';
import { peek, advance, consume, consumedSpan, type Cursor, type Parsed } from './cursor.js';
/** Read one stable identity without conflating its label or typed namespace. */
export function readIdentity(cursor: Cursor): Parsed<string> {
  const token = peek(cursor);
  if (token.kind !== 'id') reject('syntax', token.span, '@identifier', 'Expected a stable ID');
  return { value: token.text.slice(1), next: advance(cursor) };
}
/** Descendant and section-local addresses use distinct separators and typed fields. */
function readAddressTail(id: string, cursor: Cursor): Parsed<Reference> {
  const separator = peek(cursor).text;
  if (separator === '.') return readMember(id, advance(cursor));
  if (separator === '/') return readSectionMember(id, advance(cursor));
  return { value: { kind: 'reference', id }, next: cursor };
}
/** An endpoint descendant belongs to one object namespace. */
function readMember(id: string, cursor: Cursor): Parsed<Reference> {
  const member = readIdentity(cursor);
  return { value: { kind: 'reference', id, member: member.value }, next: member.next };
}
/** Appearance and route addresses identify their section first. */
function readSectionMember(section: string, cursor: Cursor): Parsed<Reference> {
  const item = readIdentity(cursor);
  return { value: { kind: 'reference', id: item.value, section }, next: item.next };
}
/** Layout namespaces are explicit; ordinary object references omit a namespace. */
export function readReference(cursor: Cursor): Parsed<LocatedValue> {
  if (peek(cursor).kind === 'word') return readNamespaced(cursor);
  const id = readIdentity(cursor);
  const tail = readAddressTail(id.value, id.next);
  return { value: { value: tail.value, span: consumedSpan(cursor, tail.next) }, next: tail.next };
}
/** Reject unknown namespaces before resolving any domain record. */
function readNamespaced(cursor: Cursor): Parsed<LocatedValue> {
  const namespace = peek(cursor).text;
  if (namespace !== 'group' && namespace !== 'section')
    reject(
      'syntax',
      peek(cursor).span,
      'group or section namespace',
      'Unknown reference namespace',
    );
  const id = readIdentity(consume(advance(cursor), ':'));
  return {
    value: {
      value: { kind: 'reference', namespace, id: id.value },
      span: consumedSpan(cursor, id.next),
    },
    next: id.next,
  };
}
