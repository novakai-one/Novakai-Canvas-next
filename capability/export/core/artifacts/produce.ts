import { failure } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { ProductionDependencies } from '../../contract/types.js';
import type { Artifact, Snapshot, Encoded } from '../../contract/records/artifact.js';
import type { ExportRequest, Cancellation } from '../../contract/records/input.js';
import { success, protect } from '../validation/outcomes.js';
import { selectScope, validBounds } from './scope.js';
import { planPages } from './pages.js';
import { matchesIdentity } from './identity.js';
import { checkSceneResources } from '../bundles/completeness.js';
const descriptors = {
  svg: ['image/svg+xml', 'svg'],
  png: ['image/png', 'png'],
  pdf: ['application/pdf', 'pdf'],
  html: ['text/html', 'html'],
  bundle: ['application/vnd.novakai.canvas+json', 'nvcanvas'],
} as const;
/** Acquire once, settle encoding, then release once. Host repairs providers; failed reads are safe to retry. */
export async function produce(
  request: ExportRequest,
  deps: ProductionDependencies,
  signal?: Cancellation,
): Promise<Result<Artifact>> {
  if (signal?.aborted)
    return failure('cancelled', '$', 'Export was cancelled before acquiring a revision');
  const acquired = await protect(() => deps.snapshots.acquire(request.identity));
  if (!acquired.ok) return acquired;
  const lease = acquired.value;
  const encoded = await protect(() => renderSnapshot(lease.snapshot, request, deps, signal));
  const released = await protect(() => lease.release(), 'cleanup-failed');
  return settle(encoded, released);
}
/** A primary failure remains primary; cleanup failure is attached for host repair. */
function settle(result: Result<Artifact>, cleanup: Result<void>): Result<Artifact> {
  if (cleanup.ok) return result;
  if (result.ok) return cleanup;
  return { ...result, diagnostics: [cleanup.error] };
}
/** Validate the identity and scope before any format handler sees a scene. */
async function renderSnapshot(
  snapshot: Snapshot,
  request: ExportRequest,
  deps: ProductionDependencies,
  signal?: Cancellation,
): Promise<Result<Artifact>> {
  if (!matchesIdentity(snapshot, request))
    return failure(
      'snapshot-mismatch',
      'identity',
      'Snapshot does not match the requested revision and projection',
    );
  const selected = selectScope(snapshot, request.scope);
  if (!selected.ok) return selected;
  return encodeSelection(snapshot, request, deps, selected.value, signal);
}
/** Format-independent allocation gates protect every native adapter and custom host handler. */
async function encodeSelection(
  snapshot: Snapshot,
  request: ExportRequest,
  deps: ProductionDependencies,
  selection: import('../../contract/records/artifact.js').Selection,
  signal?: Cancellation,
): Promise<Result<Artifact>> {
  const invalid = checkSceneResources(snapshot);
  if (!invalid.ok) return invalid;
  const pages = pagesForFormat(selection, request, snapshot.identity);
  if (!pages.ok) return pages;
  return allocateAndEncode(snapshot, request, deps, selection, pages.value, signal);
}
/** Cancellation after encoding still discards bytes while the outer lifecycle releases retention. */
async function runEncoder(
  snapshot: Snapshot,
  request: ExportRequest,
  deps: ProductionDependencies,
  selection: import('../../contract/records/artifact.js').Selection,
  pages: readonly import('../../contract/records/pages.js').Page[],
  signal?: Cancellation,
): Promise<Result<Artifact>> {
  if (signal?.aborted) return failure('cancelled', '$', 'Export was cancelled before encoding');
  const result = await deps.formats[request.format].encode({
    snapshot,
    selection,
    request,
    pages,
    signal: signal ?? { aborted: false },
  });
  if (!result.ok) return result;
  return finish(result.value, snapshot, request, deps, signal);
}
/** Hash the detached final byte buffer; no timestamp or random field contaminates deterministic formats. */
function finish(
  encoded: Encoded,
  snapshot: Snapshot,
  request: ExportRequest,
  deps: ProductionDependencies,
  signal?: Cancellation,
): Result<Artifact> {
  if (signal?.aborted) return failure('cancelled', '$', 'Export was cancelled after encoding');
  if (encoded.bytes.byteLength > 128 * 1024 * 1024)
    return failure('limit-exceeded', 'bytes', 'Artifact exceeds 128 MiB');
  const [mediaType, extension] = descriptors[request.format];
  return success({
    ...encoded,
    bytes: encoded.bytes.slice(),
    schemaVersion: 1,
    mediaType,
    extension,
    digest: deps.encoding.hash(encoded.bytes),
    identity: { ...snapshot.identity },
    scope: { ...request.scope },
  });
}
/** Canonical scene count bounds apply before printing, even to injected handlers. */
function checkAllocation(
  snapshot: Snapshot,
  request: ExportRequest,
  box: import('../../contract/records/artifact.js').Box,
): Result<void> {
  if (!validBounds(box))
    return failure('invalid-input', 'scene.bounds', 'Scene bounds must be finite and positive');
  if (isSectionBundle(request))
    return failure('invalid-input', 'scope', 'Portable bundles require the whole collection');
  return checkCounts(snapshot, request, box);
}
/** Raster dimensions are rounded exactly as the concrete encoder will allocate them. */
function checkCounts(
  snapshot: Snapshot,
  request: ExportRequest,
  box: import('../../contract/records/artifact.js').Box,
): Result<void> {
  const counts = [
    snapshot.scene.sections.length / 10,
    snapshot.scene.sections.flatMap((section) => section.nodes).length / 1000,
    snapshot.scene.sections.flatMap((section) => section.wires).length / 1500,
  ];
  if (counts.some((ratio) => ratio > 1))
    return failure('limit-exceeded', 'scene', 'Scene exceeds the owning capability limits');
  if (request.format !== 'png') return success(undefined);
  const width = Math.ceil(box.width * request.scale);
  const height = Math.ceil(box.height * request.scale);
  return checkRaster(width, height);
}
/** Shared exact raster policy prevents large native allocations; callers receive a retryable typed limit. */
export function checkRaster(width: number, height: number): Result<void> {
  if (Math.max(width, height) > 8192 || width * height > 64000000)
    return failure(
      'limit-exceeded',
      'raster',
      'Raster exceeds 8192 pixels per side or 64 million pixels',
    );
  return success(undefined);
}

/** Pagination applies only to PDF; other formats retain their single logical scene. */
function pagesForFormat(
  selection: import('../../contract/records/artifact.js').Selection,
  request: ExportRequest,
  identity: import('../../contract/records/artifact.js').Identity,
): Result<readonly import('../../contract/records/pages.js').Page[]> {
  if (request.format !== 'pdf') return success([]);
  return planPages(selection, request, identity);
}
/** Bundle transfer is defined only for a complete collection namespace. */
function isSectionBundle(request: ExportRequest): boolean {
  return request.format === 'bundle' && request.scope.kind !== 'all';
}

/** Validate counts and byte allocation before entering a native handler. */
async function allocateAndEncode(
  snapshot: Snapshot,
  request: ExportRequest,
  deps: ProductionDependencies,
  selection: import('../../contract/records/artifact.js').Selection,
  pages: readonly import('../../contract/records/pages.js').Page[],
  signal?: Cancellation,
): Promise<Result<Artifact>> {
  const checked = checkAllocation(snapshot, request, selection.bounds);
  if (!checked.ok) return checked;
  return runEncoder(snapshot, request, deps, selection, pages, signal);
}
