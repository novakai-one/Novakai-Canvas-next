/*
 * Export's own failure codes, diagnostic record and Result type. Export returns failures as
 * values: `exportArtifact`, `inspectBundle` and `prepareImport` never throw or reject. Export only reads and encodes, so a caller can
 * retry after fixing the input or repairing the host provider. Hosts own storage repair and
 * import admission.
 */

/**
 * Why an export, bundle inspection or import preparation failed:
 * - `invalid-input`: the export or import request, or the bundle bytes, have the wrong shape;
 *   the scene bounds are not finite and positive; or a bundle was requested for one section.
 * - `snapshot-mismatch`: the leased snapshot is not the requested collection, revision and
 *   projection.
 * - `missing-section`: the requested section is not in this revision.
 * - `limit-exceeded`: a size limit was hit (for example 512 PDF pages, 128 MiB of bytes, the
 *   raster size, or 2,000 bundle resources).
 * - `cancelled`: the caller's cancellation flag was set between stages.
 * - `encoding-failed`: an encoder failed, or a provider threw, during an export.
 * - `cleanup-failed`: releasing the lease threw. (A release that returns its own failure is
 *   passed through with that failure's code.)
 * - `invalid-bundle`: bundle bytes are not valid UTF-8, JSON or bundle shape, a hash does not
 *   match, or something threw during `inspectBundle`.
 * - `resource-rejected`: a needed resource is missing, or the resource owner changed a resource
 *   while inspecting it.
 * - `invalid-import`: the import targets the bundle's own collection ID, the bundle's source or
 *   manual snapshot does not fit its collection, or something threw during `prepareImport`
 *   (including invalid JSON in the bundle).
 */
export type ErrorCode =
  | 'invalid-input'
  | 'snapshot-mismatch'
  | 'missing-section'
  | 'limit-exceeded'
  | 'cancelled'
  | 'encoding-failed'
  | 'cleanup-failed'
  | 'invalid-bundle'
  | 'resource-rejected'
  | 'invalid-import';

/**
 * One failure. Failures created by Export always use the recovery text of {@link failure}.
 * Failures returned by a host provider are passed through unchanged, with the provider's own
 * fields.
 */
export interface Diagnostic {
  /** Why it failed; see {@link ErrorCode}. */
  readonly code: ErrorCode;

  /** Where it failed: a dotted field path, or `$` for the whole operation. */
  readonly path: string;

  /** A human-readable explanation. Callers should branch on `code`, not on this text. */
  readonly message: string;

  /** What the caller can do next. */
  readonly recovery: string;

  /**
   * A lease-release failure that happened after this (primary) failure. The host repairs
   * both.
   */
  readonly cleanup?: Diagnostic;
}

/**
 * Export's success-or-failure value: `{ ok: true, value }` or `{ ok: false, error }`. `E`
 * defaults to {@link Diagnostic}; it can carry another capability's failure record.
 */
export type Result<T, E = Diagnostic> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

/**
 * Builds a failure with Export's standard recovery text. A failed read produces no partial
 * artifact; the caller still has its original input.
 *
 * @param code - Why it failed.
 * @param path - Where it failed (`$` for the whole operation).
 * @param message - A human-readable explanation.
 * @returns A new `{ ok: false }` result whose recovery text says to correct the input or repair
 * the provider, then retry.
 */
export function failure(code: ErrorCode, path: string, message: string): Result<never> {
  return {
    ok: false,
    error: {
      code,
      path,
      message,
      recovery: 'Correct the input or repair the provider, then retry the read.',
    },
  };
}
