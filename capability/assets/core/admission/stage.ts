import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type {
  Admission,
  StageInput,
  NormalizedMedia,
  StoredBlob,
} from '../../contract/records/media.js';
import type { AssetStorage } from '../../contract/ports/storage.js';
/** Admission consumes only transaction, hashing and registered processors, never lease/lifecycle services. */
interface StageDependencies {
  readonly storage: Pick<AssetStorage, 'transact'>;
  readonly identity: Pick<IdentityPort, 'digest'>;
  readonly media: Pick<MediaRegistry, 'handlers'>;
}
import type { IdentityPort } from '../../contract/ports/identity.js';
import type { MediaRegistry } from '../../contract/ports/media.js';
import type { AssetTransaction } from '../../contract/ports/storage.js';
import { success, protectAsync } from '../validation/outcomes.js';
import { validateInput, validateNormalized, byteLength } from './validate.js';
import { resolveBlob } from '../resolution/resolve.js';
/** Select one declared processor; adding a format extends the registry rather than this pipeline. */
async function normalizeInput(
  input: StageInput,
  media: Pick<MediaRegistry, 'handlers'>,
): Promise<Result<NormalizedMedia>> {
  const handler = media.handlers.find((handler) => handler.mediaTypes.includes(input.mediaType));
  if (!handler) return fail('unsupported-media', 'mediaType', 'No processor supports this format');
  const processed = await handler.normalize(input.base64, input.mediaType);
  if (!processed.ok) return processed;
  return validateNormalized(processed.value);
}
/** Derive the immutable descriptor from normalized bytes, keeping per-submission metadata outside storage. */
export function identifyBlob(
  media: NormalizedMedia,
  identity: Pick<IdentityPort, 'digest'>,
): Result<StoredBlob> {
  const hashed = identity.digest(media.base64);
  if (!hashed.ok) return hashed;
  const { base64, ...facts } = media;
  return success({
    base64,
    descriptor: { ...facts, digest: hashed.value, byteLength: byteLength(base64) },
  });
}
/** Existing content must verify before reuse; the adapter also refuses different bytes at a digest path. */
export function storeBlob(
  transaction: Pick<AssetTransaction, 'readBlob' | 'writeBlob'>,
  blob: StoredBlob,
  identity: Pick<IdentityPort, 'digest'>,
): Result<void> {
  const previous = transaction.readBlob(blob.descriptor.digest);
  if (previous !== null) return checkExisting(transaction, blob, identity);
  transaction.writeBlob(blob);
  return success(undefined);
}
/** Descriptor reuse never accepts silent disk corruption or substitutes similarly named bytes. */
function checkExisting(
  transaction: Pick<AssetTransaction, 'readBlob'>,
  blob: StoredBlob,
  identity: Pick<IdentityPort, 'digest'>,
): Result<void> {
  const existing = resolveBlob(transaction, blob.descriptor.digest, identity);
  if (!existing.ok) return existing;
  if (existing.value.base64 !== blob.base64)
    return fail('corrupt-asset', 'digest', 'Existing bytes disagree with normalized media');
  return success(undefined);
}
/** Shared normalization path for ordinary staging and protected restore staging. */
export async function prepareBlob(
  input: StageInput,
  media: Pick<MediaRegistry, 'handlers'>,
  identity: Pick<IdentityPort, 'digest'>,
): Promise<Result<StoredBlob>> {
  const normalized = await normalizeInput(input, media);
  if (!normalized.ok) return normalized;
  return identifyBlob(normalized.value, identity);
}
/** Persist mechanically derived bytes only; Authoring consumes alt/provenance when admitting the binding. */
async function stageChecked(
  input: StageInput,
  deps: StageDependencies,
): Promise<Result<Admission>> {
  const original = deps.identity.digest(input.base64);
  if (!original.ok) return original;
  const blob = await prepareBlob(input, deps.media, deps.identity);
  if (!blob.ok) return blob;
  return commitStage(input, original.value, blob.value, deps);
}
/** Storage serialization protects duplicate staging; failures never claim a successful admission. */
function commitStage(
  input: StageInput,
  originalDigest: Admission['originalDigest'],
  blob: StoredBlob,
  deps: StageDependencies,
): Result<Admission> {
  const written = deps.storage.transact((view) => storeBlob(view, blob, deps.identity));
  if (!written.ok) return written;
  return success({
    descriptor: blob.descriptor,
    originalDigest,
    alt: input.alt,
    provenance: input.provenance,
  });
}
/** Correct malformed/unsafe input before retry; staged bytes do not create any diagram binding. */
export function stageMedia(input: unknown, deps: StageDependencies): Promise<Result<Admission>> {
  return protectAsync(async () => {
    const parsed = validateInput(input);
    if (!parsed.ok) return parsed;
    return stageChecked(parsed.value, deps);
  }, 'unsafe-media');
}
