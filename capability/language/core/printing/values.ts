import type { ValueType } from '../../contract/records/vocabulary.js';
import { reject, origin } from '../validation/outcomes.js';
import { quote } from './strings.js';
import type { RawRecord } from '../lowering/fields.js';
/** Unsupported value shapes fail explicitly rather than disappearing from an otherwise printable document. */
export function record(value: unknown): RawRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    reject('unrepresentable', origin, 'Canonical record', 'Cannot print a non-record');
  return Object.fromEntries(Object.entries(value));
}
/** Only actual strings become textual DSL; object coercion would hide data corruption. */
export function string(value: unknown, name = 'value'): string {
  if (typeof value !== 'string')
    reject('unrepresentable', origin, 'String', `Cannot print a non-string ${name}`, name);
  return value;
}
/** Format canonical properties using the same declared scalar/list type used by the parser. */
export function printValue(value: unknown, type: ValueType, name = 'value'): string {
  if (type === 'signature-parameters') return printSignatureParameters(value);
  return printSimpleValue(value, type, name);
}

function printSimpleValue(value: unknown, type: ValueType, name: string): string {
  if (Array.isArray(value)) return printList(value, type);
  if (type === 'endpoint') return printEndpoint(value);
  return printScalar(value, type, name);
}

function printSignatureParameters(value: unknown): string {
  if (!Array.isArray(value))
    reject('unrepresentable', origin, 'Signature parameters', 'Cannot print parameters');
  return `[${value
    .map((item) => {
      if (typeof item === 'string') return quote(item);
      const parameter = record(item);
      return `[${quote(string(parameter.name))}, ${printValue(parameter.type, 'type-expression')}]`;
    })
    .join(', ')}]`;
}
/** Scalars have explicit delimiters; theme pins are quoted when they are not bare vocabulary words. */
function printScalar(value: unknown, type: ValueType, name: string): string {
  const printers: Readonly<Record<string, () => string>> = {
    string: () => quote(string(value, name)),
    word: () => word(value, name),
    id: () => `@${string(value, name)}`,
    boolean: () => String(value),
    integer: () => String(value),
    'type-expression': () => printTypeExpression(value),
  };
  const print = printers[type];
  if (print === undefined)
    reject(
      'unrepresentable',
      origin,
      'Supported scalar type',
      'Cannot print this scalar kind',
      type,
    );
  return print();
}

function printTypeExpression(value: unknown): string {
  if (typeof value === 'string') return quote(value);
  requireTypeRecord(value);
  const recordValue = record(value);
  const print = typePrinters.get(string(recordValue.kind));
  if (print === undefined)
    return reject(
      'unrepresentable',
      origin,
      'Shared definition reference',
      'Cannot print field type',
    );
  return print(recordValue);
}
/** Interim v1 spelling for v2 type records; the phase 5 printer replaces it. */
const typePrinters = new Map<string, (value: RawRecord) => string>([
  ['definition', (value) => `@${string(value.id)}`],
  ['entity', (value) => `@${string(value.id)}`],
  ['primitive', (value) => string(value.name)],
  [
    'generic',
    (value) =>
      `@${string(value.base)}<${typeArguments(value.arguments).map(printTypeExpression).join(', ')}>`,
  ],
]);
function typeArguments(value: unknown): readonly unknown[] {
  if (!Array.isArray(value))
    reject('unrepresentable', origin, 'Shared definition reference', 'Cannot print field type');
  return value;
}

function requireTypeRecord(value: unknown): asserts value is object {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    reject('unrepresentable', origin, 'Shared definition reference', 'Cannot print field type');
}
/** Bare words remain readable; punctuation-bearing theme pins retain exact identity inside quotes. */
function word(value: unknown, name: string): string {
  const text = string(value, name);
  return /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(text) ? text : quote(text);
}
/** Bracketed list order is semantic, including fields and foreign composite references. */
function printList(values: readonly unknown[], type: ValueType): string {
  const scalar: Readonly<Record<string, ValueType>> = {
    strings: 'string',
    ids: 'id',
    endpoints: 'endpoint',
  };
  const element = scalar[type];
  if (element === undefined)
    reject('unrepresentable', origin, 'Typed list property', 'Cannot print an unsupported list');
  return `[${values.map((value) => printValue(value, element)).join(', ')}]`;
}
/** Member selectors are stable domain addresses; no layout point is emitted. */
function printEndpoint(value: unknown): string {
  const endpoint = record(value);
  const object = `@${string(endpoint.object)}`;
  if (endpoint.member === undefined) return object;
  return `${object}.@${string(endpoint.member)}`;
}
