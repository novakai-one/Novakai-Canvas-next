# PR2 implementation — partial acceptance report

Implementation and automated verification are complete within the single isolated `feat/diagram-typography` worktree. **Overall acceptance remains incomplete:** two whole-file rubric scores do not clear >144/160, and browser/A1/A2 acceptance belongs to the orchestrator. No independent review round, subagent, browser, shared service, push, panel or editor work was performed.

The frozen public `TextMetric`, `DiagramTypography`, `SizeBand` and `ContentSizing` types are exported by both capabilities. Presentation rejects the old scalar style shape, inverted width bands, and role/font mismatches. Design System projects absolute line heights from the existing heading/body/annotation tokens; body and mono use their exact pinned byte identities. The sole service constructor consumes these absolute metrics directly. PR3 can consume this shape; CLI/resource admission remains its work. No PR1 contract or main DI modification was needed.

Content measurement expands headings within their selected interior band; structured atoms and table columns can exceed requested widths. Signature groups bind opening text, commas and result punctuation, retaining canonical outlines and anchors. ER fields and table cells retain aligned starts and complete identifiers. Row minimums apply before vertical padding. Compact modes size their visible content while preserving canonical outlines. Represented groups reserve the entire measured object content above children; ordinary engineering cards retain their header separators. Media slots center inside the final interior; images are bounded at a square and icons use semantic box sizes. The shared SVG renderer clips cover images and retains alt text.

## Verification

|Gate|Observed result|
|---|---|
|Focused Design System/Presentation/Layout/Export/service suites|17 files, 50 tests passed; `focused-tests.log`|
|Full check|Types, lint, Prettier, architecture and 51 files / 162 tests passed; `full-check.log`|
|Generated artifacts|Compiler verification passed; `generated-token-check.log`|
|Per-function Sonar|Maximum 2 across all changed TS/TSX, including new files; `complexity.json`|
|Test definition budget|157 direct `it`/`test` definitions before and after; runtime includes parameterized cases (162). Zero new definitions and no added skip/todo/only flags.|
|Frozen document growth|728 words / 73 lines versus baseline 664 / 69 (+9.64% / +5.80%), below both 20% limits.|
|Actual source inventory|29 files in Doc2's expanded paths and `source-inventory.json`; content-context.ts and text.ts remain unchanged.|
|Allowlist|Only Presentation, typography Design System artifacts/tests, the two fixture constructors and service style constructor changed.|
|Whole-file literal rubric|27 files pass; Export fixture 130/160 and Layout fixture 144/160 remain blocked.|

Source hashes and definition counts are recorded in `verification-inventory.json`. Every file has all 16 literal principle rows and deductions in [file-scores.md](file-scores.md). These author judgments are not substitutes for orchestrator A1/A2.

## Remaining work and scope conflict

The Export fixture's [unchecked bundle decoding](../../../capability/export/tests/fixtures.ts:433), [mutable lease counter](../../../capability/export/tests/fixtures.ts:405), and filesystem/native dependencies are pre-existing whole-file deductions. Layout's [native fixture setup](../../../capability/layout/tests/fixtures.ts:226) and value-returning assertion helpers likewise retain deductions. Correcting those behaviors would exceed the explicit constructor-only migration allowance. No score was raised to hide this conflict, and the flagged code was left intact. Orchestrator must resolve this gate before declaring PR2 accepted.

[readability.canvas](readability.canvas) was lowered through the public Language/Model contracts and rendered through the actual shared Presentation renderer with Design System metrics and pinned font bytes. [customer.svg](customer.svg), [dispatch.svg](dispatch.svg), and [readability-metrics.json](readability-metrics.json) are review artifacts. They were generated without browser use; this is not a claim of browser visual acceptance. Orchestrator still owns dense mixed-scene browser acceptance, represented-child placement confirmation, and independent A1/A2.

The frozen plans received only the requested concrete inventory update; the prior single review/disposition remains unchanged. No further approval is requested by this report.
