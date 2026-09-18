import type { Scene } from './scene.js';
import type { Target } from './selection.js';

export type Emphasis = 'normal' | 'primary' | 'secondary' | 'muted';
export type DetailTier = 'overview' | 'names' | 'members';
export type FocusSource = 'none' | 'selection' | 'hover';

/** Input references let camera-only projections reuse the already-scanned one-hop graph result. */
export interface FocusInputs {
  readonly scene: Scene;
  readonly selection: readonly Target[];
  readonly hover: Target | null;
}

/** Scoped target keys prevent equal canonical IDs in separate sections from sharing focus. */
export interface FocusProjection {
  readonly source: FocusSource;
  readonly primary: ReadonlySet<string>;
  readonly secondary: ReadonlySet<string>;
  readonly inputs: FocusInputs;
}
