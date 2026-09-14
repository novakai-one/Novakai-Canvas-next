import type { Result } from '../errors.js';
import type { NormalizedMedia, SupportedMedia } from '../records/media.js';
/** Bounded media processors are swappable; they never commit bindings or fetch external resources. */
export interface MediaHandler {
  readonly mediaTypes: readonly SupportedMedia[];
  normalize(base64: string, declared: SupportedMedia): Promise<Result<NormalizedMedia>>;
}
export interface MediaRegistry {
  readonly handlers: readonly MediaHandler[];
  detect(base64: string): Result<SupportedMedia>;
}
