import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type {
  RestoreResources,
  RestoreLease,
  ValidateDomain,
} from '../../contract/ports/resources.js';
import type { StorePort, Decision } from '../../contract/ports/store.js';
import { backupBundle } from '../../contract/records/backup.js';
import type { BackupBundle } from '../../contract/records/backup.js';
import type { WorkspaceState } from '../../contract/records/storage.js';
import { boundedClone, parse, protect, protectAsync, success } from '../validation/outcomes.js';
import { validateState } from '../validation/state.js';
import { checkCoverage, reachableResources, verifyResources, withLease } from './resources.js';
/** Validate the whole envelope plus retained state before any destination bytes are staged. */
function readBundle(input: unknown): Result<BackupBundle> {
  const parsed = parse(backupBundle, boundedClone(input, 256 * 1024 * 1024), 'corrupt-record');
  if (!parsed.ok) return parsed;
  const state = validateState(parsed.value.state);
  if (!state.ok) return state;
  return success(parsed.value);
}
/** Empty means never committed, not merely a workspace with all collections deleted. */
function installIntoPristine(raw: unknown, restored: WorkspaceState): Result<Decision<void>> {
  const current = validateState(raw);
  if (!current.ok) return current;
  if (current.value.workspace !== restored.workspace)
    return fail('invalid-input', 'workspace', 'Restore must preserve logical workspace identity');
  return chooseDestination(current.value, restored);
}
/** Conditional destination check occurs inside the same transaction as installation. */
function chooseDestination(
  current: WorkspaceState,
  restored: WorkspaceState,
): Result<Decision<void>> {
  if (current.sequence !== 0)
    return fail('destination-not-empty', '$', 'Restore destination has already been used');
  return success({ state: restored, value: undefined });
}
/** Finish all staging before installing any document; reservation remains held throughout. */
async function stageAndInstall(
  bundle: BackupBundle,
  lease: RestoreLease,
  store: Pick<StorePort, 'transact'>,
): Promise<Result<void>> {
  const results = await Promise.all(
    bundle.blobs.map((blob) => protectAsync(() => lease.stage(blob.digest, blob.base64))),
  );
  const failed = results.find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  return protect(
    () => store.transact((raw) => installIntoPristine(raw, bundle.state)),
    'storage-unavailable',
  );
}
/** Reservation prevents concurrent GC from deleting new bytes before their references commit. */
async function reserveAndInstall(
  bundle: BackupBundle,
  resources: RestoreResources,
  store: Pick<StorePort, 'transact'>,
): Promise<Result<void>> {
  const reserved = await resources.reserve(reachableResources(bundle.state));
  if (!reserved.ok) return reserved;
  return withLease(reserved.value, () => stageAndInstall(bundle, reserved.value, store));
}
/** Injected semantic validation is mandatory; verified bytes alone do not prove valid documents. */
async function validateAndInstall(
  bundle: BackupBundle,
  resources: RestoreResources,
  validateDomain: ValidateDomain,
  store: Pick<StorePort, 'transact'>,
): Promise<Result<void>> {
  const verified = await verifyResources(bundle.blobs, resources.verify);
  if (!verified.ok) return verified;
  const domain = await validateDomain(bundle.state);
  if (!domain.ok) return domain;
  return reserveAndInstall(bundle, resources, store);
}
/** Known precommit failure preserves documents. Uncertain COMMIT requires host reopen/inspection before activation. */
async function restoreChecked(
  input: unknown,
  resources: RestoreResources,
  validateDomain: ValidateDomain,
  store: Pick<StorePort, 'transact'>,
): Promise<Result<void>> {
  const bundle = protect(() => readBundle(input), 'corrupt-record');
  if (!bundle.ok) return bundle;
  const coverage = checkCoverage(bundle.value.state, bundle.value.blobs);
  if (!coverage.ok) return coverage;
  return validateAndInstall(bundle.value, resources, validateDomain, store);
}

/** Typed private boundary also protects rejecting resource providers; host owns uncertain-install recovery. */
export function restoreBackup(
  input: unknown,
  resources: RestoreResources,
  validateDomain: ValidateDomain,
  store: Pick<StorePort, 'transact'>,
): Promise<Result<void>> {
  return protectAsync(() => restoreChecked(input, resources, validateDomain, store));
}
