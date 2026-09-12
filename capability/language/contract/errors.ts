import type { Span } from './records/syntax.js';
export type DiagnosticCode =
  | 'syntax'
  | 'unsupported-version'
  | 'invalid-input'
  | 'unknown-property'
  | 'invalid-value'
  | 'unknown-target'
  | 'missing-resource'
  | 'resource-mismatch'
  | 'domain'
  | 'display-only'
  | 'limit'
  | 'provider-failure'
  | 'unrepresentable';
export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly span: Span;
  readonly target: string;
  readonly expected: string;
  readonly message: string;
  readonly recovery: string;
  /** Original domain evidence survives source-span translation. */
  readonly source?: OwnerDiagnostic;
}
/** Validation rejects with at least one actionable diagnostic; no partial value is exposed. */
export interface ValidationError {
  readonly code: 'validation-failed';
  readonly diagnostics: readonly [Diagnostic, ...Diagnostic[]];
}
/** Locally owned envelope; E belongs to this capability, never a shared Result kernel. */
export type Result<T, E = ValidationError> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
/** Private compiler rejection; public Language methods convert it to a typed diagnostic. */
export class LanguageFault extends Error {
  /** Preserve structured correction data. Language owns recovery before Authoring admission. */
  constructor(readonly diagnostics: readonly [Diagnostic, ...Diagnostic[]]) {
    super('Language rejected input');
  }
}

/** Narrow consumer-owned record failure; Model owns the vocabulary and validation behavior. */
export interface OwnerDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}
