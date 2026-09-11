import type { Dependencies, Layout, Inspection } from './types.js';
import type { Result } from './errors.js';
import type { Scene } from './records/geometry.js';
import { readArrangement, readInspection, readRoute, readKey } from '../core/validation/input.js';
import { execute, protect } from '../core/validation/outcomes.js';
import { requestKey } from '../core/arrangement/keys.js';
import { arrange, inspect, reroute } from '../core/arrangement/pipeline.js';
/** Bind required owner/native roles once; every public operation snapshots inputs and returns a typed outcome. */
export function createLayout(dependencies: Dependencies): Layout {
  /** Compute the full key before the host registers its current job; route-only uses fixed as previous here. */
  function key(input: unknown): Result<string> {
    return protect(() => requestKey(readKey(input, dependencies.projection), dependencies));
  }
  /** Derive all geometry atomically; Authoring retains the prior committed scene on rejection. */
  function arrangeScene(input: unknown): Promise<Result<Scene>> {
    return execute(() => arrange(readArrangement(input, dependencies.projection), dependencies));
  }
  /** Recompute wires around fixed boxes without granting permission to reposition nodes or section origins. */
  function route(input: unknown): Promise<Result<Scene>> {
    return execute(() => reroute(readRoute(input, dependencies.projection), dependencies));
  }
  /** Recheck authoritative content and required geometry without invoking any native placement/router. */
  function inspectScene(input: unknown): Result<Inspection> {
    return protect(() => inspect(readInspection(input, dependencies.projection), dependencies));
  }
  return Object.freeze({ key, arrange: arrangeScene, route, inspect: inspectScene });
}

export { toCollection, toSection, toParent } from '../core/geometry/coordinates.js';
