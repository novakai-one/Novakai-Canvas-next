import type { Result } from '../errors.js';
import type { TransportResponse } from '../records/owners.js';
/** Browser transport relies exclusively on the HttpOnly same-origin cookie. No bearer credential reaches JavaScript. */
export interface ServiceClient {
  get(path: string, signal?: AbortSignal): Promise<Result<TransportResponse>>;
  post(path: string, input: unknown, signal?: AbortSignal): Promise<Result<TransportResponse>>;
  changes(changed: () => void, connection: (connected: boolean) => void): () => void;
}
