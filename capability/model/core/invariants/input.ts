import type { Result } from '../../contract/errors.js';
import { failure, success } from './issues.js';

const MAX_VALUES = 100_000;
const MAX_DEPTH = 64;

/** One pending JSON value. Ancestors track this path only, allowing shared acyclic values. */
interface InputFrame {
  readonly value: unknown;
  readonly path: string;
  readonly depth: number;
  readonly ancestors: readonly object[];
}

/** Traversal state is local to one inspection and never returned to consumers. */
interface InputScan {
  readonly pending: InputFrame[];
  visited: number;
}

/** Accept only JSON scalar values, including finite numbers. */
function isJsonScalar(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' || typeof value === 'boolean';
}

/** Null is a scalar; only non-null objects may be expanded into child frames. */
function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/** Accept real arrays and plain/null-prototype records with no symbol-keyed fields. */
function hasPlainPrototype(value: object): boolean {
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (Array.isArray(value)) return prototype === Array.prototype;
  return prototype === Object.prototype || prototype === null;
}

/** Array indices must be consecutive and must be the array's only own fields. */
function isDenseArray(value: readonly unknown[]): boolean {
  const keys = Object.getOwnPropertyNames(value).filter((key) => key !== 'length');
  return keys.length === value.length && keys.every((key, index) => key === String(index));
}

/** Reject getters and hidden properties without reading their values. */
function isEnumerableData(descriptor: PropertyDescriptor): boolean {
  return 'value' in descriptor && descriptor.enumerable === true;
}

/** Inspect descriptors rather than properties so user accessors never execute. */
function childFrames(frame: InputFrame, value: object): Result<readonly InputFrame[]> {
  const descriptors = Object.entries(Object.getOwnPropertyDescriptors(value));
  const fields = descriptors.filter(([key]) => key !== 'length' || !Array.isArray(value));
  if (fields.some(([, descriptor]) => !isEnumerableData(descriptor))) {
    return failure(
      'shape',
      frame.path,
      'Expected enumerable data properties, not accessors or hidden fields',
    );
  }
  if (fields.length > MAX_VALUES) return failure('limit', frame.path, 'Input exceeds value budget');
  const children = fields.map(([key, descriptor]): InputFrame => ({
    value: descriptor.value,
    path: `${frame.path}.${key}`,
    depth: frame.depth + 1,
    ancestors: [...frame.ancestors, value],
  }));
  return success(children);
}

/** Arrays need an extra shape check before their data descriptors can be traversed. */
function inspectArrayShape(frame: InputFrame, value: object): Result<readonly InputFrame[]> {
  if (Array.isArray(value) && !isDenseArray(value)) {
    return failure('shape', frame.path, 'Array must be dense with no extra properties');
  }
  return childFrames(frame, value);
}

/** Reject non-JSON records and path cycles before allocating child traversal frames. */
function inspectObject(frame: InputFrame, value: object): Result<readonly InputFrame[]> {
  if (!hasPlainPrototype(value)) return failure('shape', frame.path, 'Expected plain JSON data');
  if (frame.ancestors.includes(value))
    return failure('shape', frame.path, 'Cyclic input is not JSON data');
  return inspectArrayShape(frame, value);
}

/** Leaves contribute to the budget even though they produce no child frames. */
function expandValue(frame: InputFrame): Result<readonly InputFrame[]> {
  if (isJsonScalar(frame.value)) return success([]);
  if (isObject(frame.value)) return inspectObject(frame, frame.value);
  return failure('shape', frame.path, 'Unsupported JSON value');
}

/** Enforce the traversal budget before examining the next value. */
function inspectFrame(frame: InputFrame, visited: number): Result<readonly InputFrame[]> {
  if (visited > MAX_VALUES || frame.depth > MAX_DEPTH) {
    return failure(
      'limit',
      frame.path,
      `Input exceeds ${MAX_VALUES} values or nesting depth ${MAX_DEPTH}`,
    );
  }
  return expandValue(frame);
}

/** Pop one pending value; an empty queue is already complete, not malformed input. */
function visitNext(scan: InputScan): Result<readonly InputFrame[]> {
  const frame = scan.pending.pop();
  if (frame === undefined) return success([]);
  scan.visited += 1;
  return inspectFrame(frame, scan.visited);
}

/** Continue only after a successful visit; failed frames never enqueue more work. */
function queueChildren(scan: InputScan, children: Result<readonly InputFrame[]>): void {
  if (!children.ok) return;
  scan.pending.push(...children.value);
}

/** Iteration avoids exhausting the JS call stack; the first failure stops traversal. */
function scanInput(input: unknown): Result<true> {
  const scan: InputScan = {
    pending: [{ value: input, path: '$', depth: 0, ancestors: [] }],
    visited: 0,
  };
  let inspected: Result<readonly InputFrame[]> = success([]);
  while (scan.pending.length > 0 && inspected.ok) {
    inspected = visitNext(scan);
    queueChildren(scan, inspected);
  }
  return completedInspection(inspected);
}

/** Expose validity rather than the internal traversal queue. */
function completedInspection(inspected: Result<readonly InputFrame[]>): Result<true> {
  if (!inspected.ok) return inspected;
  return success(true);
}

/**
 * Rejects unsupported JSON input before schema parsing: accessors, hidden/symbol fields,
 * cycles, non-finite values and oversized/deep trees. Reflection failures (for example
 * revoked proxies) become shape diagnostics here. Reflection may execute proxy traps;
 * no guarantee is made that arbitrary proxies are inert. Pure data is safe to retry;
 * Authoring owns correcting rejected input and commit/recovery.
 */
export function inspectInput(input: unknown): Result<true> {
  try {
    return scanInput(input);
  } catch {
    return failure('shape', '$', 'Input cannot be inspected as plain data');
  }
}
