import type { Result } from '../errors.js';
import type { WorkspaceState } from '../records/storage.js';

/**
 * A successful decision: the state to install and the value to return to the caller.
 * Only a successful decision is installed, atomically; the adapter rolls back everything else.
 */
export interface Decision<T> {
  readonly state: WorkspaceState;
  readonly value: T;
}

/**
 * The narrow storage seam the Persistence service runs on (implemented by the SQLite adapter).
 */
export interface StorePort {
  /**
   * Runs one synchronous decision inside one storage transaction.
   *
   * `decide` receives the raw stored value, which may be damaged, and must validate it before
   * use. A successful decision's state is installed and its value returned; a failure is rolled
   * back and returned.
   */
  transact<T>(decide: (raw: unknown) => Result<Decision<T>>): Result<T>;
  /** Closes the underlying database. */
  close(): Result<void>;
}
