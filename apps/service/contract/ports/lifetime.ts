import type { Result } from '../errors.js';
/** Shutdown rejects new work, drains every admitted operation and closes owners only after physical settlement. */
export interface SessionLifetime {
  run<T>(
    operation: () => Promise<T>,
    unavailable: () => T,
  ): Promise<T>;
  close(): Promise<Result<void>>;
}
