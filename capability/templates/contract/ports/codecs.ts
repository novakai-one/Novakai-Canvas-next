import type { PresetId } from '../brands.js';
import type { Result } from '../errors.js';
import type { RecipePayload, ThemePayload, ThemePreset } from '../records/preset.js';
/** Host binds Language's public semantic parser/remapper, never a regex source replacement. */
export interface RecipePort<T> {
  /** Validate complete pinned canvas1, compute canonical source and exact asset/theme references. No IO. */
  inspect(source: string, family: RecipePayload['family']): Result<RecipePayload>;
  /** Remap all collection-scoped aliases and references. Same namespace/pin is deterministic; return ordinary editable JSON intent. */
  expand(source: string, namespace: PresetId): Result<T>;
}
/** DesignSystem owns known token IDs, bounds and contrast; Templates owns immutable pin correspondence. */
export interface ThemePort {
  /** Resolve delta to complete values using exact available bases. All font aliases become admitted digests. */
  resolve(raw: unknown, availableThemes: readonly ThemePreset[]): Result<ThemePayload>;
}
