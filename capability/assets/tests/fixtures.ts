import { expect } from 'vitest';
import { digest } from '../contract/index.js';
import type { Result, StageInput, MediaRegistry, ReachabilityReader } from '../contract/index.js';

/** A 2 × 3 pixel PNG, base64 encoded. */
export const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWMwTpv5H4QZMBgAqdcNJ8E3/6kAAAAASUVORK5CYII=';

/** A safe 180 × 100 SVG (viewBox only) with a local arrow marker and escaped text. */
export const svg =
  '<svg viewBox="0 0 180 100"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5"><path d="M0 0 L10 5 L0 10Z"/></marker></defs><rect x="4" y="4" width="80" height="40"/><path d="M85 25 L160 25" marker-end="url(#arrow)"/><text x="10" y="75">Authoring &amp; validation</text></svg>';

/** A valid digest that no test stores. */
export const missing = digest.parse('f'.repeat(64));

/** A reachability reader that reports no referenced digests, so collection keeps only leased bytes. */
export const noReferences: ReachabilityReader = () => ({ ok: true, value: [] });

/**
 * Encodes text as base64, for building fixtures. Staged input must still pass the canonical base64
 * checks.
 *
 * @param text - UTF-8 text.
 * @returns The base64 encoding.
 */
export function encoded(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64');
}

/**
 * Builds a staging request with fixed alt text ("A blue two by three image") and provenance. The
 * metadata is written here, never derived from Assets' own output.
 *
 * @param base64 - The bytes. Defaults to {@link png}.
 * @param mediaType - The declared type. Defaults to `image/png`.
 * @returns The request.
 */
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

/**
 * Asserts a result succeeded and returns its value.
 *
 * @param result - The result.
 * @returns The success value.
 * @throws The failure's message when the result failed, after the assertion records it.
 */
export function value<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

/**
 * Asserts a result failed with the given code. Messages are not asserted.
 *
 * @param result - The result.
 * @param code - The expected failure code.
 */
export function rejects(result: Result<unknown>, code: string): void {
  expect(result).toMatchObject({ ok: false, error: { code } });
}

/**
 * Builds a `storage-unavailable` failure at `fixture`, for providers that fail on purpose.
 *
 * @returns The failure.
 */
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

/**
 * Wraps a media registry so every processor waits for `pause` before normalizing. Tests use it to
 * release a lease while staging is still waiting.
 *
 * @param media - The real registry.
 * @param pause - Resolves when processing may continue.
 * @returns The delayed registry. Detection is not delayed.
 */
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
