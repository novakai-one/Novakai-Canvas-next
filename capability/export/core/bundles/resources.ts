import type { Resource } from '../../contract/records/bundle.js';
import type { InspectionDependencies } from '../../contract/types.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { success } from '../validation/outcomes.js';
import { canonical } from '../validation/canonical.js';
/** Verify byte integrity before owner admission, then reject an owner changing transfer identities. */
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
/** Byte and identity limits are independent of the owner inspector's media-specific validation. */
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
/** Reject resource hashes before an expensive font/media decoder receives them. */
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
/** Admission may return new objects but must retain the exact transfer content and metadata. */
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
