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
}
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };
/** Private compiler rejection; public Language methods convert it to a typed diagnostic. */
export class LanguageFault extends Error {
  /** Preserve structured correction data. Language owns recovery before Authoring admission. */
  constructor(readonly diagnostics: readonly Diagnostic[]) {
    super('Language rejected input');
  }
}
