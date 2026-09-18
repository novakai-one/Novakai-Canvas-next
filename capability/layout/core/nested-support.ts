import type {
  NestedSupportRequest,
  NestedSupportResult,
} from '../contract/records/nested-support.js';
import { retainSupportInput } from './nested-support-input.js';
import { supportGraph, admitSupportGraph, SupportRejection } from './nested-support-graph.js';
import { supportStructure } from './nested-support-structure.js';
import { supportPaths } from './nested-support-paths.js';
import { supportMouths } from './nested-support-mouths.js';

/** Read-only admission, never a legality claim. Callers reconstruct their request to retry.
 * Unexpected programming errors propagate; only typed domain rejections become failure data.
 */
export function preflightNestedSupports(request: NestedSupportRequest): NestedSupportResult {
  try {
    return { ok: true, value: compileNestedSupports(request).ledger };
  } catch (error) {
    return failure(error);
  }
}
/** Shared single compilation; callers own typed rejection conversion and reconstruction. */
export function compileNestedSupports(request: NestedSupportRequest) {
  const input = retainSupportInput(request);
  return { input, ledger: compileSupportInput(input, request.scene) };
}

/** Compile the retained builder input once; caller owns typed rejection and reconstruction. */
export function compileSupportInput(
  input: ReturnType<typeof retainSupportInput>,
  scene: NestedSupportRequest['scene'],
) {
  const graph = supportGraph();
  const lines = supportStructure(graph, input);
  const paths = supportPaths(graph, lines, input, scene);
  const gates = supportMouths({
    graph,
    lines,
    input,
    scene,
    footprints: paths.footprints,
  });
  const admitted = admitSupportGraph(graph);
  const envelopeSpills = [
    ...new Set(
      admitted.constraints
        .filter((c) => c.kind === 'envelope' && c.deficit > 0)
        .map((c) => c.provenance[0] ?? ''),
    ),
  ];
  return {
    status: 'admitted-with-reservation-evidence' as const,
    populations: input.populations,
    travels: input.travels,
    contacts: input.retainedContacts,
    ...admitted,
    ...paths,
    gates,
    envelopeSpills,
    counts: {
      T: input.travels.length,
      C: input.contacts.length,
      G: gates.length,
      V: admitted.vertices.length,
      E: admitted.constraints.length,
    },
  };
}

function failure(error: unknown): NestedSupportResult {
  if (error instanceof SupportRejection) return { ok: false, error: error.evidence };
  throw error;
}
