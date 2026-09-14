import { bundleSchema } from '../../contract/records/bundle.js';
import type { Bundle, BundleInspection, Resource } from '../../contract/records/bundle.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import type { InspectionDependencies } from '../../contract/types.js';
import { parse, success } from '../validation/outcomes.js';
import { canonical } from '../validation/canonical.js';
import { inspectResources } from './resources.js';
/** A parsed envelope remains untrusted until all hashes and owner validations have succeeded. */
export async function inspectBundle(
  input: unknown,
  deps: InspectionDependencies,
): Promise<Result<BundleInspection>> {
  const bytes = readBytes(input);
  if (!bytes.ok) return bytes;
  const text = deps.encoding.text(bytes.value);
  if (!text.ok) return text;
  return inspectText(text.value, deps);
}
/** Bound the original buffer before decoding or JSON allocation. */
export function readBytes(input: unknown): Result<Uint8Array> {
  if (!(input instanceof Uint8Array))
    return failure('invalid-input', 'bytes', 'Expected a byte buffer');
  if (input.byteLength > 128 * 1024 * 1024)
    return failure('limit-exceeded', 'bytes', 'Transfer exceeds 128 MiB');
  return success(input.slice());
}
/** JSON syntax exceptions are caught by the public boundary as invalid-bundle, never exposed. */
async function inspectText(
  text: string,
  deps: InspectionDependencies,
): Promise<Result<BundleInspection>> {
  const parsed = parse(bundleSchema, JSON.parse(text), 'invalid-bundle');
  if (!parsed.ok) return parsed;
  const hashes = checkHashes(parsed.value, deps);
  if (!hashes.ok) return hashes;
  return inspectDecoded(parsed.value, deps);
}
/** Source/manual hashes are independent; changing geometry cannot hide behind an unchanged DSL digest. */
function checkHashes(bundle: Bundle, deps: InspectionDependencies): Result<void> {
  const hashes = [
    deps.encoding.hash(deps.encoding.utf8(bundle.source)) === bundle.sourceDigest,
    deps.encoding.hash(deps.encoding.utf8(canonical(bundle.manual))) === bundle.manualDigest,
  ];
  if (!hashes.every(Boolean))
    return failure('invalid-bundle', 'digest', 'Source or manual snapshot hash mismatch');
  if (deps.encoding.utf8(bundle.source).byteLength > 16 * 1024 * 1024)
    return failure('limit-exceeded', 'source', 'DSL exceeds 16 MiB');
  return success(undefined);
}
/** Base64 is decoded strictly before resource-owner validation; no partial inspection escapes. */
async function inspectDecoded(
  bundle: Bundle,
  deps: InspectionDependencies,
): Promise<Result<BundleInspection>> {
  const decoded = decodeResources(bundle, deps);
  if (!decoded.ok) return decoded;
  const resources = await inspectResources(decoded.value, deps);
  if (!resources.ok) return resources;
  return success({
    identity: bundle.identity,
    source: bundle.source,
    sourceDigest: bundle.sourceDigest,
    manual: bundle.manual,
    resources: resources.value,
    counts: { resources: resources.value.length, sections: bundle.manual.sections.length },
  });
}
/** Collect successes only after checking the whole decode result list. */
function decodeResources(
  bundle: Bundle,
  deps: InspectionDependencies,
): Result<readonly Resource[]> {
  const decoded = bundle.resources.map((resource) => decodeResource(resource, deps));
  const failed = decoded.find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  return success(decoded.flatMap((result) => (result.ok ? [result.value] : [])));
}
/** Decode one transfer resource while preserving the owner metadata record. */
function decodeResource(
  resource: Bundle['resources'][number],
  deps: InspectionDependencies,
): Result<Resource> {
  const bytes = deps.encoding.decode(resource.base64);
  if (!bytes.ok) return bytes;
  return success({
    kind: resource.kind,
    digest: resource.digest,
    mediaType: resource.mediaType,
    metadata: resource.metadata,
    bytes: bytes.value,
  });
}
