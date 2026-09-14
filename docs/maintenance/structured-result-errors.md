# Structured Result errors

## Scope and acceptance

- Every capability declares `Result<T, E = ItsError>` locally: success has `value`; failure has `error`. No shared Result import/kernel.
- Model, Library and Language validation failures carry a non-empty diagnostic tuple inside `error` with code `validation-failed`.
- Adapters translate the primary error vocabulary while preserving the complete upstream failure in `error.source`. Language enrichment retains the original Model issue in each diagnostic's `source`.
- Export preserves the primary error and attaches a failed release as `error.cleanup`.
- Source evidence is a consumer-owned record contract, declared locally. Originating owners retain their closed code vocabularies. A consumer accepts foreign codes as data; widening source codes does not widen its own primary ErrorCode. No foreign behavior or shared kernel is imported.
- Runtime schemas preserve source evidence through Authoring warnings/receipts, worker replies and HTTP. Invalid/empty validation evidence is rejected, never silently stripped.
- Private typed exceptions remain supported behind Result-returning public boundaries.
- Formatting is a terminal/browser display concern. Callers do not recover by parsing message strings.

## Frozen test budget

Three new focused boundary cases; retain all existing test definitions:

1. Two real Model violations (different codes and paths) survive the Model planner -> Authoring -> JSON transport path. No proposal is produced.
2. A two-diagnostic compiler failure preserves spans, targets, expected values, recovery and original Model issues through Language readout/transport. Empty evidence is rejected by runtime schemas.
3. Library validation retains the same diagnostic batch through the browser Library reader. Successful reads retain the unchanged Result shape.

Extend the existing Language domain-lowering assertion to verify its original Model issue. Extend the existing Export dual-failure assertion for cleanup inside error. No E2E/browser automation or new audit round.

## Verification

- `pnpm check`: passed (typecheck, ESLint including cognitive complexity <= 2, formatting, import/cycle boundaries, 180 tests across 54 files; test execution 15.82 s).
- Three new boundary cases passed. Existing Language and Export assertions retained and extended; no E2E test added.
- `pnpm tokens:check`: passed; generated token artifact unchanged.
- `pnpm --filter @novakai/canvas-web build`: passed. Existing Node externalization and bundle-size warnings remain.
- Manual CLI display probe: malformed DSL produced the original syntax code, source location, expected input and recovery text at the terminal formatter.
- `git diff --check`: passed.

## Compatibility

Model/Library/Language consumers now read `result.error.diagnostics`. Export consumers read `result.error.cleanup`. Source parsing is additive for ordinary existing errors, but rejects malformed new evidence. Canonical diagram/DSL/storage formats are unchanged. Historical evidence documents are retained as historical snapshots; the current builder SOP and Model README describe the new contract.
