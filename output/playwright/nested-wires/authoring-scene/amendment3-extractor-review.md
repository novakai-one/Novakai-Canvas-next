# Amendment 3 — extractor source review: STOP

Target: `apps/web/cli/extract-authoring-scene.ts`, whole file, against `docs/standards/CODING-STANDARDS.md`. Read the target, its layout public contract and `NestedSectionSpec` declaration, generated-artifact shape, and independent `verify-extraction.ts` consumer. This review does not reverse the existing extraction correctness evidence.

| Principle | Score | Target-line evidence |
| --- | ---: | --- |
| SRP | 10 | 13–158: one CLI purpose, extracting Authoring source into traceable semantic artifacts. |
| OCP | 6 | 24–44, 127–158: fixed inventory/parse/write pipeline; no step seam. Required cap applies. |
| LSP | 7 | No subtype implementation or shared implementation suite: not demonstrated. |
| ISP | 10 | 7, 46–53: declaration-only layout dependency; no unused behavioral port methods. |
| DIP | 0 | 3, 9–24, 116–125, 150–155: extraction logic directly binds concrete filesystem operations; no owned injected abstractions. |
| DRY | 9 | 9, 35: capability-root identity repeated; remaining symbol extraction uses named helpers. |
| KISS | 10 | 13–22, 46–125: direct traversal and flat AST helpers; no nested condition machinery. |
| YAGNI | 10 | 9–158: single requested capability and artifacts, no speculative framework. |
| Typed error outcomes | 5 | 11, 15, 119, 150–155: assertion errors and filesystem errors have classes/codes, but no typed public failure signature. Line 1 names Node reporting, not a typed domain-failure result. |
| Idempotency/failure semantics | 10 | 1, 150–155: rerun recovery is explicitly named; deterministic overwrite regenerates both files. This is not a claim of atomic two-file publication. |
| Depth/information hiding | 9 | 13–149: rich hidden traversal/parsing behavior behind a CLI; import-time execution also performs writes (24, 150–155), limiting reuse. |
| Demeter | 10 | 108, 113, 117–125: direct TypeScript collaborator calls and data reads. |
| Immutability | 10 | 24–149: const bindings and derived collections; sorting is on newly allocated arrays, no subsequent shared-state updates. |
| Type safety | 10 | 4, 7, 46, 55–101: typed AST narrowing; no any or unchecked casts. |
| Cognitive style | 10 | 13–125: flat guards; no nested/spread ternary idioms. Fresh full ESLint passed <=2. |
| Testability | 0 | 9–24, 119, 150–155: ambient cwd and real filesystem required; no injected filesystem or callable pure extraction boundary. |

**Total: 126/160; required >144/160. FAIL.**

Worst three findings: concrete infrastructure coupling (0), real-filesystem-only execution (0), untyped public failures (5). The same source issue can reduce several principles: the rubric explicitly forbids deduplicating deductions.

Even granting 10 on every other row, OCP=6, LSP=7, typed errors=5 and testability=0 cap the score at **138/160**, still below the gate. A green repository suite does not override this review.

The brief explicitly scores the extractor as product source (ruling #22). Amendment 3 authorizes shipping verified parts, but does not waive this scoring requirement. Changing dependency/error boundaries is not lint, typecheck, formatting or cognitive-complexity fallout. Under the explicit judgment-call STOP, no refactor or scoring exemption was attempted.
