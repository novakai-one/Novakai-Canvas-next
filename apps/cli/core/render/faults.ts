/*
 * The render fault boundary: owner failures stay structured until the CLI prints them, and no
 * partial render is reported as success. accepted() throws the typed RenderFault; evidence()
 * converts whatever arrives at the entry point. Shared by core/render and the edge adapter.
 */
import {
  headlessFault,
  nativeErrorDetail,
  type HeadlessSource,
} from '../../contract/records/headless.js';
import type { Result } from '../../contract/errors.js';

/** The typed fault that terminates one render; the entry point converts it to a failure. */
export class RenderFault extends Error {
  constructor(readonly evidence: HeadlessSource) {
    super('Headless render rejected');
  }
}

/** Unwrap an owner result; a failure terminates the render with its structured evidence. */
export function accepted<T>(result: Result<T, HeadlessSource>): T {
  if (!result.ok) throw new RenderFault(result.error);
  return result.value;
}

/** Preserve owner diagnostics; unexpected filesystem failures become terminal CLI evidence. */
export function evidence(error: unknown): HeadlessSource {
  if (error instanceof RenderFault) return error.evidence;
  return headlessFault.parse({
    code: 'provider-failed',
    message: providerMessage(error),
    detail: nativeDetail(error),
  });
}

/** The error's message as human context; no machine-readable fields are invented. */
function providerMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The fault schema checks and freezes these renamed fields; absent OS evidence stays absent. */
function nativeDetail(error: unknown): {
  readonly path: string | undefined;
  readonly systemCode: string | undefined;
  readonly syscall: string | undefined;
} {
  const native = nativeErrorDetail.safeParse(error);
  return {
    path: native.data?.path,
    systemCode: native.data?.code,
    syscall: native.data?.syscall,
  };
}
