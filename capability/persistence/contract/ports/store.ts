import type { Result } from '../errors.js';
import type { WorkspaceState } from '../records/storage.js';
/** Only a successful synchronous decision is installed atomically; adapter owns rollback. */
export interface Decision<T> {
  readonly state: WorkspaceState;
  readonly value: T;
}
/** Narrow storage seam; callback may see damaged raw data and must validate before use. */
export interface StorePort {
  transact<T>(decide: (raw: unknown) => Result<Decision<T>>): Result<T>;
  close(): Result<void>;
}
