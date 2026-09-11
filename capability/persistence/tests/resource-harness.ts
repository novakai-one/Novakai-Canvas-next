import { createHash } from 'node:crypto';
import { vi } from 'vitest';
import type { Mock } from 'vitest';
import type { Result, Digest } from '../contract/index.js';
/** Independent SHA256 verification of fixture bytes; mismatched blob returns typed corruption. */
export async function verifyBytes(identity: Digest, base64: string): Promise<Result<void>> {
  const actual = createHash('sha256').update(Buffer.from(base64, 'base64')).digest('hex');
  if (actual !== identity) return failure('corrupt-record');
  return { ok: true, value: undefined };
}
/** Provider-failure fixture; assertions check code, not this test-only explanatory string. */
export function failure<T>(
  code: 'corrupt-record' | 'missing-resource' | 'storage-unavailable',
): Result<T> {
  return {
    ok: false,
    error: { code, path: 'fixture', message: 'Injected failure', recovery: 'Retry fixture' },
  };
}
/** Fixture providers expose their calls so lease lifetime and exact byte inputs can be asserted. */
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
/** Test lease providers expose typed calls; Vitest owns assertion and mock recovery. */
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
