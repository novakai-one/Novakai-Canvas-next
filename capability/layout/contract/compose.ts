import type { ProjectionReader } from './ports/projection.js';
import type { Result } from './errors.js';
import type { Layout } from './types.js';
import type { JobHost } from '../adapters/scheduling.js';
import { createLayout } from './api.js';
import { createPlacement } from '../adapters/elk.js';
import { createSolver } from '../adapters/kiwi.js';
import { createRouting } from '../adapters/libavoid.js';
import { wasmLoader } from '../adapters/wasm-loader.js';
import { createJobControl } from '../adapters/scheduling.js';
import { failure } from './errors.js';
export interface LayoutOwners {
  readonly projection: ProjectionReader;
  readonly jobs: JobHost;
  readonly wasmResource: string;
}
/** Compose pinned open-source adapters; the host owns worker cancellation and the replaceable Wasm resource. */
export async function composeLayout(owners: LayoutOwners): Promise<Result<Layout>> {
  try {
    const routing = await createRouting(wasmLoader(owners.wasmResource));
    if (!routing.ok) return routing;
    return {
      ok: true,
      value: createLayout({
        projection: owners.projection,
        jobs: createJobControl(owners.jobs),
        placement: createPlacement(),
        solver: createSolver(),
        routing: routing.value,
      }),
    };
  } catch {
    return failure('engine-failed', 'composition', 'Layout dependencies could not be composed');
  }
}
