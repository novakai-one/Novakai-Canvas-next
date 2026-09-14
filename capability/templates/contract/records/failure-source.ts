/** Original record-owner issue. The consumer preserves the owner's code without interpreting its prose. */
export type RecordSource = {
  readonly code: string;
  readonly path: string;
  readonly message: string;
};
/** Exact source coordinates retained through compiler and transport boundaries. */
type Position = { readonly offset: number; readonly line: number; readonly column: number };
/** Compiler evidence includes correction guidance and any original record-owner issue. */
type LanguageSource = {
  readonly code: string;
  readonly span: { readonly start: Position; readonly end: Position };
  readonly target: string;
  readonly expected: string;
  readonly message: string;
  readonly recovery: string;
  readonly source?: RecordSource | undefined;
};
/** Validation failure is evidence-bearing: an empty batch cannot inhabit this type. */
export type ValidationSource = {
  readonly code: 'validation-failed';
  readonly diagnostics: readonly [
    RecordSource | LanguageSource,
    ...(RecordSource | LanguageSource)[],
  ];
};
/** Operational evidence retains every supported owner field, including nested or cleanup failures. */
export type OperationSource = {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly recovery: string;
  readonly targets?: readonly string[] | undefined;
  readonly expected?: string | undefined;
  readonly traceId?: string | null | undefined;
  readonly source?: FailureSource | undefined;
  readonly cleanup?: OperationSource | undefined;
};
/** Consumer-owned evidence under the primary error; no shared kernel or foreign behavior dependency. */
export type FailureSource = ValidationSource | OperationSource;
