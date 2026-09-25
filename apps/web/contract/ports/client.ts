import type { Result } from '../errors.js';
export interface BinaryResponse {
  readonly bytes: Uint8Array;
  readonly mediaType: string;
  readonly filename: string | null;
  readonly revision: number | null;
}
import type { TransportResponse } from '../records/owners.js';
/** Browser transport relies exclusively on the HttpOnly same-origin cookie. No bearer credential reaches JavaScript. */
export interface ServiceClient {
  get(
    path: string,
    signal?: AbortSignal,
  ): Promise<Result<TransportResponse>>;
  post(
    path: string,
    input: unknown,
    signal?: AbortSignal,
  ): Promise<Result<TransportResponse>>;
  bytes?: (path: string, input: unknown, signal?: AbortSignal) => Promise<Result<BinaryResponse>>;
  changes(
    changed: () => void,
    connection: (connected: boolean) => void,
  ): () => void;
}
