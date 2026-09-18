import type { NestedSceneSpec } from './nested-scene-spec.js';
import type { PrototypeLayoutOptions, RoadPrototypeScene } from './road-prototype.js';
/** Request mirrors the in-repo engine entry point without binding core from a declaration module. */
export type NestedEngineRequest = Pick<
  PrototypeLayoutOptions,
  'measure' | 'sectionInPortsLeft'
> & {
  readonly copies?: 1 | 2;
  readonly spec?: NestedSceneSpec;
};
/** Nested-roads engine slot: a version stamp plus scene derivation. Dispatch is a later task. */
export interface NestedEngine {
  readonly version: string;
  arrange(request?: NestedEngineRequest): RoadPrototypeScene;
}
