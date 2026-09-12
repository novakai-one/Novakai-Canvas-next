import type { Result } from './errors.js';
import type { PresetId, Digest } from './brands.js';
import type { Catalog, Pin, Preset } from './records/preset.js';
import type { RecipePort, ThemePort } from './ports/codecs.js';
import type { IdentityPort } from './ports/identity.js';
export interface Dependencies<T> {
  readonly recipe: RecipePort<T>;
  readonly theme: ThemePort;
  readonly identity: IdentityPort;
}
export interface PresetPlan {
  readonly candidate: Catalog;
  readonly pin: Pin;
  readonly changed: boolean;
}
export interface Summary {
  readonly pin: Pin;
  readonly title: string;
  readonly description: string;
  readonly family: string | null;
}
export interface Expansion<T> {
  readonly pin: Pin;
  readonly namespace: PresetId;
  readonly intent: T;
  readonly assets: readonly Digest[];
  readonly themes: readonly Pin[];
}
/** Stateless policy facade. Authoring owns admission/commit/retry; no durable writes occur here. */
export interface Templates<T> {
  readCatalog(input: unknown): Result<Catalog>;
  validatePreset(catalog: unknown, input: unknown): Result<Preset>;
  planAdmission(catalog: unknown, input: unknown): Result<PresetPlan>;
  list(catalog: unknown, query: unknown): Result<readonly Summary[]>;
  read(catalog: unknown, selection: unknown): Result<Preset>;
  instantiate(catalog: unknown, request: unknown): Result<Expansion<T>>;
}
