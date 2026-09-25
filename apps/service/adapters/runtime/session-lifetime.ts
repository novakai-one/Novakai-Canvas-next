import type { SessionLifetime } from '../../contract/ports/lifetime.js';
import { failure, type Result } from '../../contract/errors.js';
/** Physical owner shutdown is terminal before the returned result; caller retains the workspace on any failed close. */
async function shutdown(
  active: readonly Promise<unknown>[],
  close: () => Promise<Result<void>>,
): Promise<Result<void>> {
  await Promise.allSettled(active);
  try {
    return await close();
  } catch {
    return failure('unavailable', 'shutdown', 'Workspace owners could not close cleanly');
  }
}
/** Session-local operation tracking is lifecycle state, never canonical diagram data or a second admission mechanism. */
export function createSessionLifetime(close: () => Promise<Result<void>>): SessionLifetime {
  const active = new Set<Promise<unknown>>();
  let closing: Promise<Result<void>> | null = null;
  return {
    async run<T>(operation: () => Promise<T>, unavailable: () => T): Promise<T> {
      if (closing !== null) return unavailable();
      const pending = Promise.resolve().then(operation);
      active.add(pending);
      try {
        return await pending;
      } finally {
        active.delete(pending);
      }
    },
    close(): Promise<Result<void>> {
      if (closing === null) closing = shutdown([...active], close);
      return closing;
    },
  };
}
