import { responseEnvelope } from '@novakai/canvas-service';
import type { TransportResponse } from '@novakai/canvas-service';
import type { ServiceClient } from '../contract/ports/client.js';
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
/** Bind browser effects once. Consumer owns cleanup and receipt reconciliation; there is no automatic mutation retry. */
export function createServiceClient(): ServiceClient {
  return {
    get: (path, signal) => request(path, 'GET', null, signal),
    post: (path, input, signal) => request(path, 'POST', JSON.stringify(input), signal),
    changes,
  };
}
