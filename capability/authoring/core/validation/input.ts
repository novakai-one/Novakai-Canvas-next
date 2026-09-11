import type { CheckedShape } from '../../contract/ports/decoding.js';
import type { ErrorCode } from '../../contract/errors.js';
import { requestSchema, applyOptionsSchema } from '../../contract/records/request.js';
import type { Request, ApplyOptions } from '../../contract/records/request.js';
import { copyJson } from './plain-data.js';
import type { JsonLimits } from './plain-data.js';
import { reject, freeze } from './outcomes.js';
/** Framework-independent checked parsing; Authoring rejects malformed provider data without partial writes. */
export function readShape<T>(
  shape: CheckedShape<T>,
  value: unknown,
  code: ErrorCode = 'invalid-input',
  limits?: JsonLimits,
): T {
  const parsed = shape.safeParse(copyJson(value, limits));
  if (!parsed.success) reject(code, '$', 'Data does not match the required authoring contract');
  return freeze(parsed.data);
}
/** Separate unsupported protocol versions from ordinary malformed data. */
function checkVersion(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  checkObjectVersion(value);
}
/** Snapshot the exact submitted envelope before any await; Authoring owns retry identity and recovery. */
export function readRequest(input: unknown): Request {
  const copied = copyJson(input);
  checkVersion(copied);
  return readShape(requestSchema, copied);
}

/** Submitted data has already been copied, so this field read cannot invoke a getter. */
function checkObjectVersion(value: object): void {
  if (!('version' in value)) return;
  if (value.version !== 1)
    reject('unsupported-version', 'version', 'Only authoring protocol version 1 is supported');
}

/** Omitted prepared hash stays absent, never explicit undefined; Authoring still recomputes every candidate. */
export function readOptions(input: unknown): ApplyOptions {
  const options = readShape(applyOptionsSchema, input);
  if (options.candidateHash === undefined) return {};
  return { candidateHash: options.candidateHash };
}
