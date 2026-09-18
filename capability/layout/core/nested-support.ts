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
    return compile(request);
  } catch (error) {
    return failure(error);
  }
}
function compile(request: NestedSupportRequest): NestedSupportResult {
  const input = retainSupportInput(request),
    graph = supportGraph();
  const lines = supportStructure(graph, input);
  const paths = supportPaths(graph, lines, input, request.scene);
  const gates = supportMouths({
    graph,
    lines,
    input,
    scene: request.scene,
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
    ok: true,
    value: {
      status: 'admitted-with-reservation-evidence',
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
    },
  };
}

function failure(error: unknown): NestedSupportResult {
  if (error instanceof SupportRejection) return { ok: false, error: error.evidence };
  throw error;
}
