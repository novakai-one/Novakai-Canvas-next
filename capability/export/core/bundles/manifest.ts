import type { Snapshot, Encoded, Collection } from '../../contract/records/artifact.js';
import type { TransferDependencies } from '../../contract/types.js';
import type { Cancellation } from '../../contract/records/input.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { parse, success } from '../validation/outcomes.js';
import { canonical } from '../validation/canonical.js';
import { captureManual, overlayManual } from './manual.js';
import { inspectResources } from './resources.js';
import { bundleSchema } from '../../contract/records/bundle.js';
/** A portable bundle must reconstruct the exact semantic record plus explicit overrides before output. */
export async function buildBundle(
  snapshot: Snapshot,
  deps: TransferDependencies,
  signal: Cancellation,
): Promise<Result<Encoded>> {
  const resources = await inspectResources(snapshot.resources, deps);
  if (!resources.ok) return resources;
  return afterResources(snapshot, deps, signal);
}
/** Cancellation after resource validation prevents subsequent semantic reconstruction and encoding. */
function afterResources(
  snapshot: Snapshot,
  deps: TransferDependencies,
  signal: Cancellation,
): Result<Encoded> {
  if (signal.aborted)
    return failure('cancelled', '$', 'Export cancelled after resource inspection');
  const source = deps.documents.print(snapshot.collection);
  if (!source.ok) return source;
  return encodeBundle(snapshot, source.value, deps);
}
/** Complete canvas1 source is mandatory; section readouts are not editable portable documents. */
function encodeBundle(
  snapshot: Snapshot,
  source: string,
  deps: TransferDependencies,
): Result<Encoded> {
  if (!/^canvas\s+1(?:\s|$)/.test(source.trimStart()))
    return failure('invalid-bundle', 'source', 'Bundle requires complete canvas 1 DSL');
  const roundtrip = checkRoundtrip(snapshot.collection, source, snapshot, deps);
  if (!roundtrip.ok) return roundtrip;
  return serializeBundle(snapshot, source, deps);
}
/** Printer and parser agreement alone is insufficient; compare against the original admitted collection. */
function checkRoundtrip(
  original: Collection,
  source: string,
  snapshot: Snapshot,
  deps: TransferDependencies,
): Result<void> {
  const parsed = deps.documents.parse(source, snapshot.resources);
  if (!parsed.ok) return parsed;
  const overlaid = overlayManual(parsed.value, captureManual(original));
  if (!overlaid.ok) return overlaid;
  return compareCollection(original, overlaid.value, deps);
}
/** Only allocated revision is ignored; every semantic field and manual decision must survive. */
function compareCollection(
  original: Collection,
  candidate: unknown,
  deps: TransferDependencies,
): Result<void> {
  const valid = deps.documents.read(candidate);
  if (!valid.ok) return valid;
  if (canonical({ ...original, revision: 0 }) !== canonical({ ...valid.value, revision: 0 }))
    return failure(
      'invalid-bundle',
      'source',
      'DSL and manual snapshot cannot reconstruct the collection exactly',
    );
  return success(undefined);
}
/** Canonical records and sorted resource keys make repeated exports byte-identical. */
function serializeBundle(
  snapshot: Snapshot,
  source: string,
  deps: TransferDependencies,
): Result<Encoded> {
  const manual = captureManual(snapshot.collection);
  const resources = snapshot.resources
    .map((item) => ({
      kind: item.kind,
      digest: item.digest,
      mediaType: item.mediaType,
      metadata: item.metadata,
      base64: deps.encoding.base64(item.bytes),
    }))
    .sort((a, b) => `${a.kind}:${a.digest}`.localeCompare(`${b.kind}:${b.digest}`));
  const value = {
    format: 'novakai.canvas.bundle',
    schemaVersion: 1,
    identity: snapshot.identity,
    source,
    sourceDigest: deps.encoding.hash(deps.encoding.utf8(source)),
    manual,
    manualDigest: deps.encoding.hash(deps.encoding.utf8(canonical(manual))),
    resources,
  };
  const parsed = parse(bundleSchema, value, 'invalid-bundle');
  if (!parsed.ok) return parsed;
  return success({ bytes: deps.encoding.utf8(canonical(parsed.value)), pages: [], warnings: [] });
}
