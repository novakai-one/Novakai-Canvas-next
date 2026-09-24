import { createHash } from 'node:crypto';
import { vi } from 'vitest';
import type { Mock } from 'vitest';
import type { Result, Digest } from '../contract/index.js';

/**
 * Verifies fixture bytes with an independent SHA-256, standing in for the Assets verifier.
 *
 * @returns Success when the bytes hash to `identity`; otherwise a `corrupt-record` failure.
 */
export async function verifyBytes(identity: Digest, base64: string): Promise<Result<void>> {
  const actual = createHash('sha256').update(Buffer.from(base64, 'base64')).digest('hex');
  if (actual !== identity) {
    return failure('corrupt-record');
  }
  return { ok: true, value: undefined };
}

/**
 * A provider failure with `code`. Tests assert the code only, never this fixed message.
 */
export function failure<T>(
  code: 'corrupt-record' | 'missing-resource' | 'storage-unavailable',
): Result<T> {
  return {
    ok: false,
    error: { code, path: 'fixture', message: 'Injected failure', recovery: 'Retry fixture' },
  };
}

/**
 * Mock Assets providers for backup and restore. Every call is recorded, so tests can check lease
 * lifetimes and the exact bytes passed.
 */
export interface ResourceFixture {
  readonly read: Mock<() => Promise<Result<string>>>;
  readonly release: Mock<() => Promise<Result<void>>>;
  readonly stage: Mock<() => Promise<Result<void>>>;
  readonly acquire: Mock<
    () => Promise<Result<{ read: ResourceFixture['read']; release: ResourceFixture['release'] }>>
  >;
  readonly reserve: Mock<
    () => Promise<Result<{ stage: ResourceFixture['stage']; release: ResourceFixture['release'] }>>
  >;
  readonly verify: typeof verifyBytes;
}

/**
 * Creates the mock providers. By default every call succeeds: `read` returns the bytes `abc`
 * (base64 `YWJj`), and `acquire`/`reserve` hand out leases built from the same `read`, `stage`
 * and `release` mocks, so one `release` mock counts releases of both kinds of lease.
 */
export function resources(): ResourceFixture {
  const read = vi.fn(async (): Promise<Result<string>> => ({ ok: true, value: 'YWJj' }));
  const release = vi.fn(async (): Promise<Result<void>> => ({ ok: true, value: undefined }));
  const stage = vi.fn(async (): Promise<Result<void>> => ({ ok: true, value: undefined }));
  const acquire = vi.fn(
    async (): Promise<Result<{ read: typeof read; release: typeof release }>> => ({
      ok: true,
      value: { read, release },
    }),
  );
  const reserve = vi.fn(
    async (): Promise<Result<{ stage: typeof stage; release: typeof release }>> => ({
      ok: true,
      value: { stage, release },
    }),
  );
  return { read, release, stage, acquire, reserve, verify: verifyBytes };
}
