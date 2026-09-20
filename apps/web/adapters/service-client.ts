import { responseEnvelope } from '@novakai/canvas-service';
import type { TransportResponse } from '@novakai/canvas-service';
import type { BinaryResponse, ServiceClient } from '../contract/ports/client.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
/** Same-origin cookies authenticate each request. Redirects and non-versioned results are rejected, preserving uncertain drafts. */
async function request(
  path: string,
  method: string,
  body: string | null,
  signal?: AbortSignal,
): Promise<Result<TransportResponse>> {
  try {
    const response = await fetch(path, {
      method,
      body,
      signal: signal ?? null,
      credentials: 'same-origin',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
    });
    const input: unknown = await response.json();
    const checked = responseEnvelope.safeParse(input);
    if (!checked.success)
      return failure('invalid-response', 'The service returned an unreadable response');
    return { ok: true, value: checked.data };
  } catch {
    return failure('connection-uncertain', 'The service response could not be confirmed');
  }
}
/** Events only prompt a fresh snapshot. Event payloads never become canonical UI records. */
function changes(changed: () => void, connection: (connected: boolean) => void): () => void {
  const stream = new EventSource('/api/v1/events', { withCredentials: true });
  stream.addEventListener('connected', () => {
    connection(true);
    changed();
  });
  stream.addEventListener('committed', changed);
  stream.onerror = () => connection(false);
  return () => stream.close();
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- binary transport keeps status and envelope checks explicit.
async function bytes(
  path: string,
  input: unknown,
  signal?: AbortSignal,
): Promise<Result<BinaryResponse>> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      body: JSON.stringify(input),
      signal: signal ?? null,
      credentials: 'same-origin',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const input: unknown = await response.json();
      const checked = responseEnvelope.safeParse(input);
      if (!checked.success)
        return failure('invalid-response', 'The service returned an unreadable response');
      return checked.data.outcome.ok
        ? failure('invalid-response', 'The service returned no artifact')
        : { ok: false, error: checked.data.outcome.error };
    }
    return {
      ok: true,
      value: {
        bytes: new Uint8Array(await response.arrayBuffer()),
        mediaType: response.headers.get('Content-Type') ?? 'application/octet-stream',
        filename: parseFilename(response.headers.get('Content-Disposition')),
        revision: parseRevision(response.headers.get('X-Novakai-Export-Revision')),
      },
    };
  } catch {
    return failure('connection-uncertain', 'The artifact response could not be confirmed');
  }
}

function parseFilename(value: string | null): string | null {
  const match = value?.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- malformed revision headers fail closed.
function parseRevision(value: string | null): number | null {
  if (value === null) return null;
  const revision = Number(value);
  return Number.isInteger(revision) && revision >= 0 ? revision : null;
}
/** Bind browser effects once. Consumer owns cleanup and receipt reconciliation; there is no automatic mutation retry. */
export function createServiceClient(): ServiceClient {
  return {
    get: (path, signal) => request(path, 'GET', null, signal),
    post: (path, input, signal) => request(path, 'POST', JSON.stringify(input), signal),
    bytes,
    changes,
  };
}
