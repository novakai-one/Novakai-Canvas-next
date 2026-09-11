/** Public Assets boundary; caller-specific bindings remain behind Authoring, never inside byte storage. */
export { openAssets } from './compose.js';
export { createAssets } from './api.js';
export { digest, leaseId } from './brands.js';
export type { Digest, LeaseId } from './brands.js';
export type { Result, AssetError, ErrorCode } from './errors.js';
export type {
  Assets,
  AssetDependencies,
  ReadLease,
  WriteLease,
  CollectionReport,
} from './types.js';
export type {
  Admission,
  BlobDescriptor,
  StoredBlob,
  NormalizedMedia,
  SupportedMedia,
  StageInput,
} from './records/media.js';
export type { LeaseRecord } from './records/lease.js';
export type { AssetStorage, AssetTransaction } from './ports/storage.js';
export type { MediaHandler, MediaRegistry } from './ports/media.js';
export type { IdentityPort } from './ports/identity.js';
export type { ReachabilityReader } from './ports/reachability.js';
export type { AssetDatabase, AssetStatement, BlobFiles } from './ports/native.js';
