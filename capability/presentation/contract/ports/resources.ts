import type { InputCollection } from '../records/input.js';
import type { ResolvedStyle, VisualAsset } from '../records/style.js';
import type { Result } from '../errors.js';
/** Resolve this exact collection pin through the token owner; UI preference scope is not an input. */
export interface ThemeResolver {
  resolve(pin: InputCollection['theme']): Result<ResolvedStyle>;
}
/** Read verified immutable bytes; imported source URI is never an authority to fetch. */
export interface AssetReader {
  read(digest: string): Result<VisualAsset>;
}
