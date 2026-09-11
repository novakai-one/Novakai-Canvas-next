import type { Result } from '../../contract/errors.js';
import { failure, success } from './issues.js';
interface Frame {
  readonly value: unknown;
  readonly path: string;
  readonly depth: number;
  readonly ancestors: readonly object[];
}
function primitive(value: unknown): boolean {
  if (value === null) return true;
  return ['string', 'boolean'].includes(typeof value);
}
function numeric(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}
function plain(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  if (Array.isArray(value)) return prototype === Array.prototype;
  return prototype === Object.prototype || prototype === null;
}
function plainDescriptor(descriptor: PropertyDescriptor): boolean {
  return 'value' in descriptor && descriptor.enumerable === true;
}
function children(frame: Frame, value: object): Result<readonly Frame[]> {
  const entries = Object.entries(Object.getOwnPropertyDescriptors(value));
  const data = entries.filter(([key]) => key !== 'length' || !Array.isArray(value));
  if (data.some(([, descriptor]) => !plainDescriptor(descriptor)))
    return failure(
      'shape',
      frame.path,
      'Expected enumerable data properties, not accessors or hidden fields',
    );
  if (data.length > 100000) return failure('limit', frame.path, 'Input exceeds value budget');
  return success(
    data.map(([key, descriptor]) => ({
      value: descriptor.value,
      path: `${frame.path}.${key}`,
      depth: frame.depth + 1,
      ancestors: [...frame.ancestors, value],
    })),
  );
}
function plainKeys(value: object): boolean {
  return plain(value) && Object.getOwnPropertySymbols(value).length === 0;
}
function overLimit(count: number, depth: number): boolean {
  return count > 100000 || depth > 64;
}
function objectFrames(frame: Frame, value: object): Result<readonly Frame[]> {
  if (!plainKeys(value)) return failure('shape', frame.path, 'Expected plain JSON data');
  if (frame.ancestors.includes(value))
    return failure('shape', frame.path, 'Cyclic input is not JSON data');
  return arrayFrames(frame, value);
}
function arrayFrames(frame: Frame, value: object): Result<readonly Frame[]> {
  if (Array.isArray(value) && !denseArray(value))
    return failure('shape', frame.path, 'Array must be dense with no extra properties');
  return children(frame, value);
}
function denseArray(value: readonly unknown[]): boolean {
  const keys = Object.getOwnPropertyNames(value).filter((key) => key !== 'length');
  return keys.length === value.length && keys.every((key, index) => key === String(index));
}
function scalar(value: unknown): boolean {
  return primitive(value) || numeric(value);
}
function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
function expand(frame: Frame): Result<readonly Frame[]> {
  if (scalar(frame.value)) return success([]);
  if (isObject(frame.value)) return objectFrames(frame, frame.value);
  return failure('shape', frame.path, 'Unsupported JSON value');
}
function inspect(frame: Frame | undefined, count: number): Result<readonly Frame[]> {
  if (!frame) return success([]);
  if (overLimit(count, frame.depth))
    return failure('limit', frame.path, 'Input exceeds 100000 values or nesting depth 64');
  return expand(frame);
}
function scan(input: unknown): Result<true> {
  const pending: Frame[] = [{ value: input, path: '$', depth: 0, ancestors: [] }];
  let visited = 0;
  let result: Result<readonly Frame[]> = success([]);
  while (pending.length > 0 && result.ok) {
    result = inspect(pending.pop(), ++visited);
    append(pending, result);
  }
  return scanResult(result);
}
function append(pending: Frame[], result: Result<readonly Frame[]>) {
  if (!result.ok) return;
  pending.push(...result.value);
}
function scanResult(result: Result<readonly Frame[]>): Result<true> {
  if (!result.ok) return result;
  return success(true);
}
/** No accessors invoked; unsupported proxies are rejected at this boundary. */
export function inspectInput(input: unknown): Result<true> {
  try {
    return scan(input);
  } catch {
    return failure('shape', '$', 'Input cannot be inspected as plain data');
  }
}
