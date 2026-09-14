import type { ProjectionReader } from './ports/projection.js';
import type { Result } from './errors.js';
import type { Layout } from './types.js';
import type { JobHost } from '../adapters/scheduling.js';
import { createLayout } from './api.js';
import { failure } from './errors.js';
export interface LayoutOwners {
  readonly projection: ProjectionReader;
  readonly jobs: JobHost;
  readonly wasmResource: string;
}
/** Compose pinned open-source adapters; the host owns worker cancellation and the replaceable Wasm resource. */
export async function composeLayout(owners: LayoutOwners): Promise<Result<Layout>> {
  try {
    const [elk, kiwi, avoid, wasm, scheduling] = await Promise.all([
      import('../adapters/elk.js'),
      import('../adapters/kiwi.js'),
      import('../adapters/libavoid.js'),
      import('../adapters/wasm-loader.js'),
      import('../adapters/scheduling.js'),
    ]);
    const routing = await avoid.createRouting(wasm.wasmLoader(owners.wasmResource));
    if (!routing.ok) return routing;
    return {
      ok: true,
      value: createLayout({
        projection: owners.projection,
        jobs: scheduling.createJobControl(owners.jobs),
        placement: elk.createPlacement(),
        solver: kiwi.createSolver(),
        routing: routing.value,
      }),
    };
  } catch {
    return failure('engine-failed', 'composition', 'Layout dependencies could not be composed');
  }
}
