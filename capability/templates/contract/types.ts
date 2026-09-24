import type { Result } from './errors.js';
import type { PresetId, Digest } from './brands.js';
import type { Catalog, Pin, Preset } from './records/preset.js';
import type { RecipePort, ThemePort } from './ports/codecs.js';
import type { IdentityPort } from './ports/identity.js';

/**
 * The providers Templates needs. The host supplies the recipe and theme codecs; `identity` hashes
 * content. `T` is the diagram intent type a recipe expands into.
 */
export interface Dependencies<T> {
  /** Checks recipe source and expands it into intent (owned by Language). */
  readonly recipe: RecipePort<T>;
  /** Resolves theme token input into complete values (owned by Design System). */
  readonly theme: ThemePort;
  /** Hashes canonical content into a digest. */
  readonly identity: IdentityPort;
}

/**
 * The result of planning one admission. Templates never saves it; Authoring commits
 * `candidate` if it chooses to.
 */
export interface PresetPlan {
  /** The whole catalog after admission: unchanged when `changed` is false. */
  readonly candidate: Catalog;
  /** The pin of the admitted (or already present) version. */
  readonly pin: Pin;
  /** False when the same version with the same content already existed. */
  readonly changed: boolean;
}

/** One catalog entry as `list` returns it: its pin and readable metadata, without the payload. */
export interface Summary {
  readonly pin: Pin;
  readonly title: string;
  readonly description: string;
  /** The recipe's diagram family; `null` for themes. */
  readonly family: string | null;
}

/** The result of instantiating a recipe. Nothing is placed; Authoring merges `intent`. */
export interface Expansion<T> {
  /** The recipe pin that was requested. */
  readonly pin: Pin;
  /** The namespace every recipe alias was remapped into. */
  readonly namespace: PresetId;
  /** The editable diagram intent the recipe codec returned. */
  readonly intent: T;
  /** Media digests the recipe needs: its own assets plus fonts of every reachable theme, sorted and without duplicates. */
  readonly assets: readonly Digest[];
  /** Pins of every theme the recipe reaches, including inherited bases. */
  readonly themes: readonly Pin[];
}

/**
 * The Templates facade. Every method takes the catalog as plain input, checks it in full, and
 * never saves anything; Authoring owns admission commits and retries. Every method returns a
 * frozen copy on success and a `Diagnostic` on failure; none throws.
 */
export interface Templates<T> {
  /** Checks a whole catalog (schemas, digests, pins, duplicates, cycles) and returns it frozen. */
  readCatalog(input: unknown): Result<Catalog>;
  /** Checks that `input` could be admitted into `catalog` and returns the admitted preset. */
  validatePreset(catalog: unknown, input: unknown): Result<Preset>;
  /** Admits `input` into `catalog` and returns the resulting catalog as a plan. */
  planAdmission(catalog: unknown, input: unknown): Result<PresetPlan>;
  /** Returns summaries of presets that match `query`, ordered by kind/id then version. */
  list(catalog: unknown, query: unknown): Result<readonly Summary[]>;
  /** Returns one preset: the named version, or the latest when none is given; a given digest must match. */
  read(catalog: unknown, selection: unknown): Result<Preset>;
  /** Expands a pinned recipe into diagram intent under a namespace. */
  instantiate(catalog: unknown, request: unknown): Result<Expansion<T>>;
}
