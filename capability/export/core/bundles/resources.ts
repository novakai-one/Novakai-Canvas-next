/*
 * Resource checks shared by bundle building and inspection: Export's own size and integrity
 * checks first, then the resource owners' check, then proof the owners changed nothing.
 */
import type { Resource } from '../../contract/records/bundle.js';
import type { InspectionDependencies } from '../../contract/types.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { success } from '../validation/outcomes.js';
import { canonical } from '../validation/canonical.js';
/**
 * Checks resources, then hands them to the owners' `inspect`, then checks the owners returned
 * the same content.
 *
 * @param resources - The resources to check.
 * @param deps - Hashing, base64 and the owners' `Resources.inspect`.
 * @returns Fresh copies of the owners' resources (bytes copied), or a failure:
 * `limit-exceeded` (over 2,000 resources, or one over 20 MiB), `invalid-bundle` (a repeated kind
 * and digest, or bytes that do not match their digest), the owners' own failure (passed
 * through), or `resource-rejected` if the owners changed any content or metadata.
 */
export async function inspectResources(
  resources: readonly Resource[],
  deps: InspectionDependencies,
): Promise<Result<readonly Resource[]>> {
  const valid = checkResources(resources, deps);
  if (!valid.ok) return valid;
  const admitted = await deps.resources.inspect(resources);
  if (!admitted.ok) return admitted;
  return compareAdmission(resources, admitted.value, deps);
}
/** Checks the resource count, then repeated kind-and-digest keys, then sizes and digests. */
function checkResources(
  resources: readonly Resource[],
  deps: InspectionDependencies,
): Result<void> {
  if (resources.length > 2000)
    return failure('limit-exceeded', 'resources', 'Transfer exceeds 2000 resources');
  const keys = resources.map((item) => `${item.kind}:${item.digest}`);
  if (new Set(keys).size !== keys.length)
    return failure('invalid-bundle', 'resources', 'Duplicate resource kind and digest');
  return checkBytes(resources, deps);
}
/** Checks every size first, then every digest, before any owner decodes a font or image. */
function checkBytes(resources: readonly Resource[], deps: InspectionDependencies): Result<void> {
  if (resources.some((item) => item.bytes.byteLength > 20 * 1024 * 1024))
    return failure('limit-exceeded', 'resources.bytes', 'Resource exceeds 20 MiB');
  if (resources.some((item) => deps.encoding.hash(item.bytes) !== item.digest))
    return failure(
      'invalid-bundle',
      'resources.digest',
      'Resource bytes do not match their digest',
    );
  return success(undefined);
}
/**
 * Compares the owners' result with the original (canonical JSON, bytes as base64). The owners
 * may return new objects, but content, metadata and order must be the same.
 */
function compareAdmission(
  original: readonly Resource[],
  admitted: readonly Resource[],
  deps: InspectionDependencies,
): Result<readonly Resource[]> {
  const fingerprint = (items: readonly Resource[]): string =>
    canonical(items.map((item) => ({ ...item, bytes: deps.encoding.base64(item.bytes) })));
  if (fingerprint(original) !== fingerprint(admitted))
    return failure(
      'resource-rejected',
      'resources',
      'Owner inspector changed the transfer content',
    );
  return success(admitted.map((item) => ({ ...item, bytes: item.bytes.slice() })));
}
