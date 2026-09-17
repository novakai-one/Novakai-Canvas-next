# M6 placement source review

Target: `capability/layout/core/prototype-nested-placement.ts`, whole-file review against `docs/standards/CODING-STANDARDS.md`. Read the semantic scene records, node geometry, nested roads, and public scene builder as collaborators. This is a source assessment, not milestone acceptance: the real graph still fails the frozen projection invariants.

| Principle | Score | Evidence in target |
| --- | ---: | --- |
| SRP | 10 | Lines 51–103 size content; 121–201 place that content. One placement policy, no routing or renderer responsibility. |
| OCP | 6 | Grid/packing policy is fixed in 51–103 and 175–201; changing that owned axis requires edits. |
| LSP | 7 | Not demonstrated: no subtype implementation. |
| ISP | 10 | Readonly section/node/bounds records only; no unused behavioral port surface. |
| DIP | 10 | Lines 2–7, 22–25 import own core node geometry and declaration records only. |
| DRY | 10 | Pitch, padding and clearance centralized at 9–21; recursive sizing and placement have single definitions. |
| KISS | 9 | Bottom-up dimensions then top-down placement are explicit; inherited clone-number offsets at 179–185, 203–218 add a second traversal concern to follow. |
| YAGNI | 10 | Only required zero-direct-node guards and documented empty-section rejection; no fallback node, new geometry rule or retry. |
| Typed outcomes | 5 | Lines 53–54 use distinguishable `RangeError`, but the exception is absent from the return signature. Explicit spec error is permitted by the brief; it is not a Result. |
| Retry/failure semantics | 10 | Line 95 names caller-owned correction/rebuild. Pure reconstruction publishes no mutation when a degenerate section throws. |
| Depth / information hiding | 10 | Sizing and placement entries hide recursion, padding, rows, clone numbering and child layout from the scene pipeline. |
| Demeter | 10 | Only direct record reads and array operations; no collaborator navigation or indirect mutation. |
| Immutability | 8 | Readonly inputs/fresh records; local x/y accumulation at 161–166 and 188–198 costs two points. |
| Type safety | 10 | No any or unchecked cast; literal `as const` port definitions preserve exact discriminants. |
| Cognitive style | 10 | No spread-ternary optional fields, nested ternaries, or other named style smells. The single row-count ternary is direct scalar selection. Sonar ≤2 is separately enforced. |
| Testability | 10 | No ambient IO, clock, randomness or DOM; new public-builder runner reproduces the nested-only bug and checks finite geometry and empty rejection. |
| **Total** | **145/160** | **Above 144; no pre-awarded score.** |

Worst three findings: fixed packing extension axis (OCP 6); spec error is a class rather than typed result (5); inherited local placement counters mutate (8). No changes outside the authorized zero-node path were made to improve these scores.

The minimal public-builder command first failed with `AssertionError: nested-only section bounds must be finite`; the same case now passes in `verify-templates-scene.mjs`. Existing canonical nested output remains byte-identical under the unchanged structural verifier. The real templates failure demonstrates why a green regression and suite cannot establish diagram validity.

The `.mts` extractor and `.mjs` runner are terminal evidence tools, following the retained M3–M4.5 review scope rather than application modules. Their process-level assertion/IO failures are intentional: extraction has real AST provenance and consecutive-run diffs; the runner retains failing public-output checks and writes exact witnesses. It is explicitly a partial STOP runner, not a complete DoD-4 certificate prover or a placeholder passing test. No test file, lint rule, dependency or existing verifier was added/changed to hide a failure.
