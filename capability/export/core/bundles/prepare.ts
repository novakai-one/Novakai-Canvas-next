import type {
  ImportRequest,
  BundleInspection,
  PreparedImport,
} from '../../contract/records/bundle.js';
import type { Collection } from '../../contract/records/artifact.js';
import type { ImportDependencies } from '../../contract/types.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { success, protect } from '../validation/outcomes.js';
import { inspectBundle } from './inspect.js';
import { overlayManual } from './manual.js';
import { checkCollectionResources } from './completeness.js';
/** Prepare a distinct collection namespace only. Authoring owns collision checks and atomic admission. */
async function prepareChecked(
  request: ImportRequest,
  deps: ImportDependencies,
): Promise<Result<PreparedImport>> {
  const inspection = await inspectBundle(request.bytes, deps);
  if (!inspection.ok) return inspection;
  if (request.targetCollectionId === inspection.value.identity.collectionId)
    return failure(
      'invalid-import',
      'targetCollectionId',
      'Import requires a new collection namespace',
    );
  return reconstruct(request, inspection.value, deps);
}
/** Language reconstructs semantics before the portable sidecar restores human geometry. */
function reconstruct(
  request: ImportRequest,
  inspection: BundleInspection,
  deps: ImportDependencies,
): Result<PreparedImport> {
  const parsed = deps.documents.parse(inspection.source, inspection.resources);
  if (!parsed.ok) return parsed;
  if (parsed.value.id !== inspection.identity.collectionId)
    return failure('invalid-import', 'source', 'DSL collection does not match bundle identity');
  return restore(request, inspection, parsed.value, deps);
}
/** Validate the restored original namespace before changing its root identity. */
function restore(
  request: ImportRequest,
  inspection: BundleInspection,
  collection: Collection,
  deps: ImportDependencies,
): Result<PreparedImport> {
  const overlaid = overlayManual(collection, inspection.manual);
  if (!overlaid.ok) return overlaid;
  const admitted = deps.documents.read(overlaid.value);
  if (!admitted.ok) return admitted;
  return remapNamespace(request, inspection, admitted.value, deps);
}
/** Local IDs remain stable: changing the collection namespace changes every fully scoped address. */
function remapNamespace(
  request: ImportRequest,
  inspection: BundleInspection,
  collection: Collection,
  deps: ImportDependencies,
): Result<PreparedImport> {
  const completeness = checkCollectionResources(collection, inspection.resources);
  if (!completeness.ok) return completeness;
  const candidate = deps.documents.read({
    ...collection,
    id: request.targetCollectionId,
    revision: 0,
  });
  if (!candidate.ok) return candidate;
  return success({
    original: inspection.identity,
    target: { ...inspection.identity, collectionId: request.targetCollectionId, revision: 0 },
    collection: candidate.value,
    resources: inspection.resources,
    expected: 'absent',
    sourceDigest: inspection.sourceDigest,
    warnings: [],
  });
}

/** Typed public preparation boundary; Authoring owns admission, callers safely retry rejected reads. */
export async function prepareImport(
  request: ImportRequest,
  deps: ImportDependencies,
): Promise<Result<PreparedImport>> {
  return protect(() => prepareChecked(request, deps), 'invalid-import');
}
