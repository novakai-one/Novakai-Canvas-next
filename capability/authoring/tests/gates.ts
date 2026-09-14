import { assert, vi } from 'vitest';
import {
  createAuthoring,
  type Result,
  type Receipt,
  type Request,
  type FeasibilityReport,
} from '../contract/index.js';
import type { Dependencies } from '../contract/index.js';
export interface Gate {
  readonly promise: Promise<void>;
  open(): void;
}
/** Explicit test synchronization; no sleeps or poll timing. Vitest owns misuse failures. */
export function gate(): Gate {
  let release: (() => void) | null = null;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  /** Open the already constructed promise; idempotent Promise resolution is the test synchronization contract. */
  function open(): void {
    assert(release);
    release();
  }
  return { promise, open };
}
/** Hold both candidates after snapshots, then let real SQLite choose one atomic winner. */
export async function race(
  deps: Dependencies,
  first: Request,
  second: Request,
): Promise<readonly Result<Receipt>[]> {
  const arrived = gate();
  const release = gate();
  const check = vi.fn(async (): Promise<Result<FeasibilityReport>> => {
    if (check.mock.calls.length === 2) arrived.open();
    await release.promise;
    return { ok: true, value: { warnings: [], diff: [], preview: null } };
  });
  const api = createAuthoring({ ...deps, feasibility: { check } });
  const pending = [api.apply(first), api.apply(second)];
  await arrived.promise;
  release.open();
  return Promise.all(pending);
}
