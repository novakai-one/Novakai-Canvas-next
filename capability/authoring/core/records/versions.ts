import type { Request } from '../../contract/records/request.js';
import type { ReadVersion, RecordKey, Snapshot } from '../../contract/records/storage.js';
import { keyText, versionOf } from './keys.js';
import { reject } from '../validation/outcomes.js';
/** Any observed mismatch rejects the entire request; Authoring never refreshes the caller's expectations. */
export function compareVersions(snapshot: Snapshot, expected: readonly ReadVersion[]): void {
  const stale = expected.find((read) => versionOf(snapshot, read.key).version !== read.version);
  if (stale)
    reject('revision-conflict', keyText(stale.key), 'The observed record version has changed');
}
/** Duplicate identities are invalid even if a malicious payload repeats an equal value. */
export function uniqueKeys(keys: readonly RecordKey[], path: string): void {
  if (new Set(keys.map(keyText)).size !== keys.length)
    reject('invalid-input', path, 'Duplicate record identities');
}
/** Scope and preconditions are independent; neither can supply the other's missing authority. */
export function checkWriteAuthority(request: Request, keys: readonly RecordKey[]): void {
  const scoped = new Set(request.scope.map(keyText));
  const observed = new Set(request.expected.map((read) => keyText(read.key)));
  if (keys.some((key) => !scoped.has(keyText(key))))
    reject('permission-denied', 'scope', 'A write falls outside submitted scope');
  if (keys.some((key) => !observed.has(keyText(key))))
    reject('invalid-input', 'expected', 'Every write needs an explicit client version');
}
/** Merge identical dependencies while rejecting contradictory observations; Authoring owns conflict recovery. */
export function mergeVersions(groups: readonly (readonly ReadVersion[])[]): readonly ReadVersion[] {
  const reads = groups.flat();
  const merged = new Map(reads.map((read) => [keyText(read.key), read]));
  reads.forEach((read) => checkMergedVersion(read, merged));
  return [...merged.values()];
}
/** Check a known map entry explicitly; contradictory reads cannot be silently overwritten. */
function checkMergedVersion(read: ReadVersion, merged: ReadonlyMap<string, ReadVersion>): void {
  const existing = merged.get(keyText(read.key));
  if (!existing) reject('invalid-input', 'reads', 'A dependency identity could not be resolved');
  if (existing.version !== read.version)
    reject('revision-conflict', 'reads', 'Dependencies disagree about one record version');
}
