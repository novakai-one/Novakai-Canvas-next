import type { Digest } from '../brands.js';
import type { Result } from '../errors.js';
import type { WorkspaceState } from '../records/storage.js';
/** Assets verifies exact digest/bytes. No default success provider is permitted in production. */
export type VerifyBlob = (digest: Digest, base64: string) => Promise<Result<void>>;
/** All requested existing bytes stay protected until release, including failed backup attempts. */
export interface ResourceLease {
  read(digest: Digest): Promise<Result<string>>;
  release(): Promise<Result<void>>;
}
export interface BackupResources {
  acquire(digests: readonly Digest[]): Promise<Result<ResourceLease>>;
  verify: VerifyBlob;
}
/** Destination reservation protects newly staged bytes from GC through document installation. */
export interface RestoreLease {
  stage(digest: Digest, base64: string): Promise<Result<void>>;
  release(): Promise<Result<void>>;
}
export interface RestoreResources {
  verify: VerifyBlob;
  reserve(digests: readonly Digest[]): Promise<Result<RestoreLease>>;
}
/** Host binds Model/Library plus cross-record and resource-reference verification. */
export type ValidateDomain = (state: WorkspaceState) => Promise<Result<void>>;
