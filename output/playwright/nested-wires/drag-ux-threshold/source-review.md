# Threshold change: application-source review

Reviewed the entire `capability/canvas/adapters/react-flow/RoadPrototype.tsx`, its host `apps/web/cli/roads-prototype.ts`, the public Layout scene/travel declarations, and installed React Flow gesture code. The sole application change is a shared 3 CSS px constant (61–62), supplied to both public gesture props (719–720). No dependency patch, new event handler, geometry correction, import, or test file.

Scored against `docs/standards/CODING-STANDARDS.md`; the executable Sonar gate remains ≤2 per function. The target file is the unit of review, not just the changed lines.

| Principle | Score | Target-file evidence |
| --- | ---: | --- |
| SRP | 10 | Diagnostic scene adapter owns painting, inspection and view gestures; domain validation is injected (548–568, 620–627). |
| OCP | 6 | Inspection/readiness/swap callbacks vary; adding diagnostic views still edits the fixed composition (633–781). This owned axis lacks a seam. |
| LSP | 7 | Not demonstrated: no alternative renderer implementation sharing a behavioral contract suite. |
| ISP | 10 | Each declared callback is consumed; camera uses only `screenToFlowPosition` (565, 624); focus helper uses both operations of its declared role (1061–1083). |
| DIP | 10 | Adapter imports framework and public Layout declarations, injects domain operations, and never imports foreign core or sibling adapter behavior (1–31, 548–568). |
| DRY | 9 | Threshold knowledge appears once (62, 719–720); existing SVG arrow-marker idioms repeat across RoutePreview, ProofPaths and NestedWirePaths. |
| KISS | 10 | Two documented library props perform discrimination; direct selection callback and drop early returns remain unchanged (620–627, 734–737). |
| YAGNI | 10 | No event state machine, library fork, speculative port or cursor correction. Fixed value is exactly the requested tolerance. |
| Typed outcomes | 10 | Travel failures consumed through `PrototypeTravelResult` and typed codes (250–269, 367–379); absent drop target is explicit `undefined` (1240–1249). No error-string recovery or new throw. |
| Retry/failure semantics | 10 | Entry doc names reload recovery (547); drop resets transient nodes before optional target admission (622–627). Gesture settings have no effectful retry. |
| Depth / hiding | 10 | Finished-scene/callback surface hides DOM painting, transient flow nodes, camera mapping, selection and no-op drop behavior (548–632). |
| Demeter | 10 | Reads direct scene records and declared callbacks; the camera ref exposes a single method (624), without foreign behavior traversal. |
| Immutability | 8 | Scene/selection arrays are replaced; bounded imperative camera ref and local arc-length cursor remain (565, 725, 1218–1223). |
| Type safety | 10 | Explicit readonly data and optional targets, no `any`, unchecked runtime cast or non-null assertion; constant inferred as literal 3. |
| Cognitive style | 10 | No nested ternaries or conditional-spread assembly; helpers keep branches shallow. Threshold adds no function or conditional. `pnpm check` enforces Sonar ≤2. |
| Testability | 5 | Browser adapter retains React/DOM/User Timing dependence (620–627, 872–887); trusted headless mouse acceptance exercises it, but pure fakes alone cannot. |
| **Total** | **145/160** | **Strictly >144; full check passed.** |

Worst limitations: browser dependence (testability 5), fixed composition extension axis (OCP 6), repeated SVG markers (DRY 9). No silent exception is introduced.

MJS/Python files are terminal acceptance programs under the existing scope in `../m4-source-review.md` and `../m5-swap/source-review.md`, not application APIs assigned application-source scores. Their failures retain CLI/JSON evidence, and strict threshold/timing modes reject non-PASS results. Existing JS lint applies without new exemptions. Track B's original observation runner still exits 0 for a completed DIVERGENCE; that exit is not treated as a passed cursor gate.
