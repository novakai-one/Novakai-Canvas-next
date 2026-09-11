import { expect } from 'vitest';
import { digest } from '../contract/index.js';
import type { Result, StageInput, MediaRegistry } from '../contract/index.js';
export const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWMwTpv5H4QZMBgAqdcNJ8E3/6kAAAAASUVORK5CYII=';
export const svg =
  '<svg viewBox="0 0 180 100"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5"><path d="M0 0 L10 5 L0 10Z"/></marker></defs><rect x="4" y="4" width="80" height="40"/><path d="M85 25 L160 25" marker-end="url(#arrow)"/><text x="10" y="75">Authoring &amp; validation</text></svg>';
export const missing = digest.parse('f'.repeat(64));
/** Fixture conversion only; actual storage input must pass canonical base64 admission. */
export function encoded(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64');
}
/** Independent input metadata, never derived from private validation/normalization output. */
export function submission(
  base64 = png,
  mediaType: StageInput['mediaType'] = 'image/png',
): StageInput {
  return {
    base64,
    mediaType,
    alt: 'A blue two by three image',
    provenance: { source: 'local-test', license: 'Test-authored' },
  };
}
/** Vitest owns assertion exceptions; failures never unwrap to fabricated successful fixture values. */
export function value<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
/** Expected error codes are independently specified; localized messages are not part of assertions. */
export function rejects(result: Result<unknown>, code: string): void {
  expect(result).toMatchObject({ ok: false, error: { code } });
}
/** Deliberate provider failure belongs to the declared result channel. */
export function unavailable<T>(): Result<T> {
  return {
    ok: false,
    error: {
      code: 'storage-unavailable',
      path: 'fixture',
      message: 'Unavailable',
      recovery: 'Retry fixture',
    },
  };
}
/** Delay native processing through its public handler contract to exercise a released-while-awaiting lease. */
export function delayedMedia(media: MediaRegistry, pause: Promise<void>): MediaRegistry {
  return {
    detect: media.detect,
    handlers: media.handlers.map((handler) => ({
      mediaTypes: handler.mediaTypes,
      normalize: async (base64, declared) => {
        await pause;
        return handler.normalize(base64, declared);
      },
    })),
  };
}
