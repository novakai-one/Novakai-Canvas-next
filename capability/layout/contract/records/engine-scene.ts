import type { NestedSceneSpec } from './nested-scene-spec.js';
import type { PrototypeLayoutOptions, RoadPrototypeScene } from './road-prototype.js';
/** Request mirrors the in-repo engine entry point without binding core from a declaration module. */
export type NestedEngineRequest = Pick<PrototypeLayoutOptions, 'measure' | 'sectionInPortsLeft'> & {
  readonly copies?: 1 | 2;
  readonly spec?: NestedSceneSpec;
};
/** Nested-roads engine slot: a version stamp plus scene derivation; pipeline dispatches modules sections to it. */
export interface NestedEngine {
  readonly version: string;
  arrange(request?: NestedEngineRequest): RoadPrototypeScene;
}
/** Deterministic identity map between app scene identities and engine ordinals; scene-in builds it, scene-out consumes it. */
export interface EngineSceneMap {
  /** App node identity by engine node number minus one, in spec order. */
  readonly nodes: readonly string[];
  /** App container node identity by engine section number minus one; the root scope entry is null. */
  readonly containers: readonly (string | null)[];
  /** App wire identity by engine request ordinal, in section wire order. */
  readonly wires: readonly string[];
}
