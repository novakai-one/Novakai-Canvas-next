import { toEngineScene } from '../core/scene-in.js';
import { toAppSection } from '../core/scene-out.js';
import { nativeEngineVersions, nestedEngineVersions } from './records/engines.js';
import type { PrototypeLayoutMeasure } from './records/road-prototype.js';
import type { ProjectionReader } from './ports/projection.js';
import type { Result } from './errors.js';
import type { RoutingProblem } from './records/problem.js';
import type { Layout } from './types.js';
import type { JobHost } from '../adapters/scheduling.js';
import { createLayout } from './api.js';
import { failure } from './errors.js';
export interface LayoutOwners {
  readonly engine?: 'nested' | 'legacy';
  readonly measure?: PrototypeLayoutMeasure;
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
    const measure = owners.measure ?? ((_stage, run) => run());
    const placement = elk.createPlacement(),
      solver = kiwi.createSolver();
    let routing: ReturnType<typeof avoid.createRouting> | undefined;
    const nativeRouting = {
      version: nativeEngineVersions.routing,
      route: async (problem: RoutingProblem) => {
        const loaded = await (routing ??= avoid.createRouting(
          wasm.wasmLoader(owners.wasmResource),
        ));
        if (!loaded.ok) return loaded;
        return measure('native-routing', () => loaded.value.route(problem));
      },
    };
    return {
      ok: true,
      value: createLayout({
        projection: owners.projection,
        jobs: scheduling.createJobControl(owners.jobs),
        placement: {
          version: placement.version,
          place: (problem) => measure('native-placement', () => placement.place(problem)),
        },
        solver: {
          version: solver.version,
          solve: (problem) => measure('native-solver', () => solver.solve(problem)),
        },
        routing: nativeRouting,
        ...(owners.engine === 'legacy'
          ? {}
          : {
              nested: {
                version: nestedEngineVersions[0] ?? 'nested-roads-1',
                section: (source, metrics, options, versions) =>
                  toAppSection(
                    toEngineScene(source, metrics, owners.measure),
                    source,
                    metrics,
                    options,
                    versions,
                  ),
              },
            }),
      }),
    };
  } catch {
    return failure('engine-failed', 'composition', 'Layout dependencies could not be composed');
  }
}
