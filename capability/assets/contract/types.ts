import type { Digest, LeaseId } from './brands.js';
import type { Result } from './errors.js';
import type { Admission, StoredBlob } from './records/media.js';
import type { AssetStorage } from './ports/storage.js';
import type { IdentityPort } from './ports/identity.js';
import type { MediaRegistry } from './ports/media.js';
import type { ReachabilityReader } from './ports/reachability.js';
export interface ReadLease {
  readonly id: LeaseId;
  read(digest: unknown): Result<StoredBlob>;
  release(): Result<void>;
}
export interface WriteLease {
  readonly id: LeaseId;
  stage(digest: unknown, base64: unknown): Promise<Result<void>>;
  release(): Result<void>;
}
export interface CollectionReport {
  readonly removed: readonly Digest[];
  readonly retained: readonly Digest[];
}
/** Capability dependencies are bound once; callers receive the deep Assets contract only. */
export interface AssetDependencies {
  readonly storage: AssetStorage;
  readonly identity: IdentityPort;
  readonly media: MediaRegistry;
}
export interface Assets {
  stage(input: unknown): Promise<Result<Admission>>;
  resolve(digest: unknown): Result<StoredBlob>;
  acquire(digests: unknown): Result<ReadLease>;
  reserve(digests: unknown): Result<WriteLease>;
  verify(digest: unknown, base64: unknown): Promise<Result<void>>;
  collectUnreferenced(readReachability: ReachabilityReader): Result<CollectionReport>;
  close(): Result<void>;
}
