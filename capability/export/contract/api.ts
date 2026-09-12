import type { Export, Dependencies } from './types.js';
import type { Result } from './errors.js';
import type { Artifact } from './records/artifact.js';
import type { Cancellation } from './records/input.js';
import { requestSchema } from './records/input.js';
import { importSchema } from './records/bundle.js';
import type { PreparedImport } from './records/bundle.js';
import { parse, protect } from '../core/validation/outcomes.js';
import { produce } from '../core/artifacts/produce.js';
import { inspectBundle } from '../core/bundles/inspect.js';
import { prepareImport } from '../core/bundles/prepare.js';
/** Unknown request rejection occurs before revision retention or native encoding. */
async function exportInput(
  input: unknown,
  deps: Dependencies,
  signal?: Cancellation,
): Promise<Result<Artifact>> {
  const request = parse(requestSchema, input);
  if (!request.ok) return request;
  return produce(request.value, deps, signal);
}
/** Import preparation never commits resources or canonical data. Caller submits through Authoring. */
async function importInput(input: unknown, deps: Dependencies): Promise<Result<PreparedImport>> {
  const request = parse(importSchema, input);
  if (!request.ok) return request;
  return prepareImport(request.value, deps);
}
/** Bind required owner roles once. Failed reads are safe to retry; hosts own provider repair and writes. */
export function createExport(deps: Dependencies): Export {
  return Object.freeze({
    exportArtifact: (input, signal) => protect(() => exportInput(input, deps, signal)),
    inspectBundle: (bytes) => protect(() => inspectBundle(bytes, deps), 'invalid-bundle'),
    prepareImport: (input) => protect(() => importInput(input, deps), 'invalid-import'),
  } satisfies Export);
}
