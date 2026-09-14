import type { Request } from '../../contract/records/request.js';
import type { Snapshot, ReadVersion, Write } from '../../contract/records/storage.js';
import {
  uniqueKeys,
  compareVersions,
  checkWriteAuthority,
  mergeVersions,
} from '../records/versions.js';
import { reject } from '../validation/outcomes.js';
/** Validate caller authority before pruning no-ops; Authoring never grants a reserved history scope. */
export function checkRequest(request: Request, snapshot: Snapshot): void {
  uniqueKeys(request.scope, 'scope');
  uniqueKeys(
    request.expected.map((read) => read.key),
    'expected',
  );
  if (request.scope.some((key) => key.kind === 'history'))
    reject('permission-denied', 'scope', 'History is engine-owned');
  checkAssetAliases(request);
  compareVersions(snapshot, request.expected);
}
/** Even an injected planner cannot create a raw privileged history write. */
export function checkProposal(request: Request, writes: readonly Write[]): void {
  const keys = writes.map((write) => write.key);
  uniqueKeys(keys, 'writes');
  if (keys.some((key) => key.kind === 'history'))
    reject('permission-denied', 'writes', 'Planner cannot mutate engine history');
  checkWriteAuthority(request, keys);
}
/** Read dependencies are a checked union, never a fresh substitute for client preconditions. */
export function checkDependencies(
  snapshot: Snapshot,
  groups: readonly (readonly ReadVersion[])[],
): readonly ReadVersion[] {
  const reads = mergeVersions(groups);
  if (reads.length > 10000) reject('invalid-input', 'reads', 'Read dependency limit exceeded');
  compareVersions(snapshot, reads);
  return reads;
}

/** One submitted alias has exactly one digest; retries cannot ambiguously select between source bytes. */
function checkAssetAliases(request: Request): void {
  if (new Set(request.assets.map((asset) => asset.alias)).size !== request.assets.length)
    reject('invalid-input', 'assets', 'Duplicate submitted asset aliases');
}
