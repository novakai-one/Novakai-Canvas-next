import { it, expect, vi, afterEach } from 'vitest';
import { createWireDryRun, dryRunFor, failure } from '../contract/index.js';
import type { Result } from '../contract/index.js';
import type { WireDraft } from '../contract/records/wire-editor.js';

afterEach(() => {
  vi.useRealTimers();
});
/** Only identity, key and revision matter to the dry run; the rest of a draft is opaque here. */
function draft(key: string, revision = 1): WireDraft {
  return { key, collection: { revision } } as unknown as WireDraft;
}
/** A preview whose answers the test releases by hand, recording each call and its signal. */
function manualPreview() {
  const calls: { draft: WireDraft; signal: AbortSignal; answer(result: Result<void>): void }[] = [];
  const preview = (value: WireDraft, signal: AbortSignal) =>
    new Promise<Result<void>>((resolve) => {
      calls.push({ draft: value, signal, answer: resolve });
    });
  return { calls, preview };
}
const flush = () => vi.advanceTimersByTimeAsync(0);

it('asks the server once per settled draft and keeps Apply off until it answers', async () => {
  vi.useFakeTimers();
  const { calls, preview } = manualPreview();
  const run = createWireDryRun(preview, 300);
  const first = draft('a');
  const second = draft('a');
  run.check(first);
  await vi.advanceTimersByTimeAsync(200);
  run.check(second);
  expect(dryRunFor(run.getSnapshot(), second).state).toBe('checking');
  await vi.advanceTimersByTimeAsync(300);
  expect(calls.map((call) => call.draft)).toEqual([second]);
  calls[0]?.answer({ ok: true, value: undefined });
  await flush();
  expect(dryRunFor(run.getSnapshot(), second).state).toBe('ok');
  expect(dryRunFor(run.getSnapshot(), first).state).toBe('checking');
});

it('drops a late answer for an older draft and aborts its request', async () => {
  vi.useFakeTimers();
  const { calls, preview } = manualPreview();
  const run = createWireDryRun(preview, 10);
  const older = draft('a');
  const newer = draft('a');
  run.check(older);
  await vi.advanceTimersByTimeAsync(10);
  run.check(newer);
  expect(calls[0]?.signal.aborted).toBe(true);
  calls[0]?.answer(failure('constraint-conflict', 'late'));
  await flush();
  expect(run.getSnapshot()).toMatchObject({ state: 'checking', draft: newer });
  await vi.advanceTimersByTimeAsync(10);
  calls[1]?.answer(failure('constraint-conflict', 'Candidate route violates a port'));
  await flush();
  expect(run.getSnapshot()).toMatchObject({ state: 'rejected', draft: newer });
});

it('a verdict for another revision of the same draft does not count', async () => {
  vi.useFakeTimers();
  const { calls, preview } = manualPreview();
  const run = createWireDryRun(preview, 0);
  const value = draft('a', 1);
  run.check(value);
  await vi.advanceTimersByTimeAsync(0);
  calls[0]?.answer({ ok: true, value: undefined });
  await flush();
  const moved = { ...run.getSnapshot(), revision: 2 } as ReturnType<typeof run.getSnapshot>;
  expect(dryRunFor(moved, value).state).toBe('checking');
});

it('a local block or unmount cancels the timer and the request in flight', async () => {
  vi.useFakeTimers();
  const { calls, preview } = manualPreview();
  const run = createWireDryRun(preview, 50);
  run.check(draft('a'));
  run.check(null);
  await vi.advanceTimersByTimeAsync(100);
  expect(calls).toHaveLength(0);
  expect(run.getSnapshot().state).toBe('idle');
  run.check(draft('b'));
  await vi.advanceTimersByTimeAsync(50);
  run.dispose();
  expect(calls[0]?.signal.aborted).toBe(true);
  calls[0]?.answer({ ok: true, value: undefined });
  await flush();
  expect(run.getSnapshot().state).toBe('checking');
});
