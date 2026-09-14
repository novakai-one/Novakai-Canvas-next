import type { Snapshot } from '../../contract/records/artifact.js';
import type { ExportRequest } from '../../contract/records/input.js';
/** A lease is useful only when all projected and canonical identities describe the requested revision. */
export function matchesIdentity(snapshot: Snapshot, request: ExportRequest): boolean {
  const ids = [snapshot.identity.collectionId, snapshot.collection.id, snapshot.scene.collectionId];
  const revisions = [
    snapshot.identity.revision,
    snapshot.collection.revision,
    snapshot.scene.revision,
  ];
  return (
    ids.every((id) => id === request.identity.collectionId) &&
    revisions.every((revision) => revision === request.identity.revision) &&
    snapshot.identity.inputKey === snapshot.scene.inputKey
  );
}
