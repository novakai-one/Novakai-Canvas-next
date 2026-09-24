/*
 * Checks that a leased snapshot is the revision the caller asked for.
 */
import type { Snapshot } from '../../contract/records/artifact.js';
import type { ExportRequest } from '../../contract/records/input.js';

/**
 * Whether the snapshot is the requested revision: its `identity`, `collection` and `scene` all
 * carry the requested collection ID and revision, and `scene.inputKey` equals
 * `identity.inputKey`. All six IDs and revisions are read before any is compared.
 *
 * @param snapshot - The leased snapshot.
 * @param request - The parsed request.
 * @returns `true` when everything matches.
 */
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
