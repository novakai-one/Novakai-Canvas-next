import type { Json } from '../../contract/records/storage.js';
import { reject } from './outcomes.js';
export interface JsonLimits {
  readonly bytes: number;
  readonly values: number;
}
const requestLimits: JsonLimits = { bytes: 16 * 1024 * 1024, values: 100000 };
/** Stored workspaces/history follow Persistence’s larger envelope; request bounds must not shrink as history grows. */
export const storedLimits: JsonLimits = {
  bytes: 64 * 1024 * 1024,
  values: Number.MAX_SAFE_INTEGER,
};
interface ReadValue {
  readonly value: Json;
  readonly count: number;
}
/** Read descriptors, not getters, so untrusted submitted objects cannot execute during serialization. */
function propertyValue(value: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !('value' in descriptor))
    reject('invalid-input', key, 'Only ordinary data properties are accepted');
  return descriptor.value;
}
/** Objects have one plain prototype and no symbol-keyed hidden payload. */
function checkObject(value: object): void {
  const allowed = [Object.prototype, null];
  if (!allowed.includes(Object.getPrototypeOf(value)))
    reject('invalid-input', '$', 'Only plain JSON objects are accepted');
  if (Object.getOwnPropertySymbols(value).length)
    reject('invalid-input', '$', 'Symbol properties are not JSON');
}
/** Bound the full subtree count even when every individual branch is shallow. */
function countValues(children: readonly ReadValue[], maximum: number): number {
  const count = 1 + children.reduce((sum, child) => sum + child.count, 0);
  if (count > maximum) reject('invalid-input', '$', 'JSON value-count limit exceeded');
  return count;
}
/** Each array element must be an ordinary own data property; sparse arrays are not submitted JSON. */
function readArray(value: readonly unknown[], depth: number, maximum: number): ReadValue {
  checkArrayIdentity(value);
  if (Object.keys(value).length !== value.length)
    reject('invalid-input', '$', 'Sparse or decorated arrays are not JSON');
  const children = Array.from({ length: value.length }, (_, index) =>
    readValue(propertyValue(value, String(index)), depth + 1, maximum),
  );
  return { value: children.map((child) => child.value), count: countValues(children, maximum) };
}
/** Copy ordinary object fields; cycles terminate at the bounded depth without invoking accessors. */
function readObject(value: object, depth: number, maximum: number): ReadValue {
  checkObject(value);
  const entries = Object.keys(value).map((key) => ({
    key,
    read: readValue(propertyValue(value, key), depth + 1, maximum),
  }));
  return {
    value: Object.fromEntries(entries.map((entry) => [entry.key, entry.read.value])),
    count: countValues(
      entries.map((entry) => entry.read),
      maximum,
    ),
  };
}
/** Numbers must retain their JSON meaning; NaN and infinities never silently become null. */
function readNumber(value: number): ReadValue {
  if (!Number.isFinite(value)) reject('invalid-input', '$', 'Only finite numbers are JSON');
  return { value, count: 1 };
}
/** Object routing remains separate from primitive validation for a one-pass readable boundary. */
function readContainer(value: object, depth: number, maximum: number): ReadValue {
  if (Array.isArray(value)) return readArray(value, depth, maximum);
  return readObject(value, depth, maximum);
}
/** Reject unsupported primitives explicitly rather than losing them in JSON.stringify. */
function readOther(value: unknown, depth: number, maximum: number): ReadValue {
  if (typeof value === 'number') return readNumber(value);
  return readNonNumeric(value, depth, maximum);
}
/** Remaining values must be non-null containers; primitive exclusions never coerce input. */
function readNonNumeric(value: unknown, depth: number, maximum: number): ReadValue {
  if (typeof value === 'object' && value !== null) return readContainer(value, depth, maximum);
  return reject('invalid-input', '$', 'Only JSON values are accepted');
}
/** Recursion is bounded independently of shape validation; Authoring retains the draft on rejection. */
function readValue(value: unknown, depth: number, maximum: number): ReadValue {
  if (depth > 64) reject('invalid-input', '$', 'JSON exceeds depth 64');
  if (value === null) return { value: null, count: 1 };
  return readPrimitive(value, depth, maximum);
}
/** Strings and booleans preserve exact submitted content and do not execute conversion methods. */
function readPrimitive(value: unknown, depth: number, maximum: number): ReadValue {
  if (typeof value === 'string' || typeof value === 'boolean') return { value, count: 1 };
  return readOther(value, depth, maximum);
}
/** Detached bounded plain data; Authoring catches unreadable proxies and retains the original draft. */
export function copyJson(value: unknown, limits: JsonLimits = requestLimits): Json {
  const copied = readValue(value, 0, limits.values).value;
  const serialized = JSON.stringify(copied);
  if (new TextEncoder().encode(serialized).byteLength > limits.bytes)
    reject('invalid-input', '$', 'JSON byte limit exceeded');
  return copied;
}

/** Array subclasses and symbol decoration are not plain submitted JSON arrays. */
function checkArrayIdentity(value: readonly unknown[]): void {
  if (Object.getPrototypeOf(value) !== Array.prototype)
    reject('invalid-input', '$', 'Only plain arrays are accepted');
  if (Object.getOwnPropertySymbols(value).length)
    reject('invalid-input', '$', 'Symbol properties are not JSON');
}
