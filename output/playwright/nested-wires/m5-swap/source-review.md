# M5 application-source review

Reviewed the complete two changed application files and their direct public collaborators against `docs/standards/CODING-STANDARDS.md`. Order: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes, retry/failure semantics, depth, Demeter, immutability, type safety, cognitive style, testability. These are evidence-based file scores, not pre-awarded repository grades. The separate executable Sonar maximum is 2 per function, without new exceptions.

| File | Sixteen scores | Total |
|---|---|---:|
| `apps/web/cli/roads-prototype.ts` | 10,6,7,10,10,10,10,10,10,10,10,10,8,10,10,5 | 146 |
| `capability/canvas/adapters/react-flow/RoadPrototype.tsx` | 10,6,7,10,10,9,10,10,10,10,10,10,8,10,10,5 | 145 |

Evidence for every dimension:

- **SRP:** host lines 48–96 mounts and operates an isolated semantic fixture; renderer lines 545–779 owns its paint, camera, inspection and view gestures. Neither implements routing or production workspace persistence.
- **OCP 6:** the host's boot/interaction sequence and renderer's fixed set of diagnostic views require edits to extend. The injected inspection/readiness/swap slots do not close every owned extension axis. No YAGNI exemption is claimed.
- **LSP 7:** not demonstrated; these targets do not supply alternative implementations of a shared behavioral contract.
- **ISP:** host supplies narrow single-operation callbacks; renderer's camera reference is `Pick<ReactFlowInstance, 'screenToFlowPosition'>` (562), and its separate camera helper consumes both declared fit operations (1058–1080). All callback roles are used.
- **DIP:** host composes only public capability entries (4–21). Renderer imports public declaration types for geometry and receives domain inspection and semantic swap behavior through callbacks. React/React Flow imports belong to this adapter, not core. No core or sibling-adapter behavior import was added.
- **DRY:** host reconstructs semantic order in one recursive path (118–140), without an independent placement equation. Renderer uses one bounds predicate and one event-coordinate reader (1229–1254); inherited repeated SVG arrow markup in RoutePreview/ProofPaths/NestedWirePaths is the one DRY deduction (9).
- **KISS:** boot is sequential; semantic replacement uses explicit early exits and immutable maps. Renderer separates committed nodes from React Flow transient nodes, resets at drop, maps the cursor through the camera, and emits two identities (606–627). Each local flow is direct; file length itself is not a deduction.
- **YAGNI:** no incremental recompute, caching framework, new route law, alternate topology, speculative adapter, or new test file. The scene diagnostic is used by independent acceptance to check the complete result.
- **Typed outcomes:** host consumes existing style and wiring discriminated outcomes (54–56, 81–84); rejected routing retains the last admitted state. Renderer consumes `PrototypeTravelResult` (248–310, 365–427), typed optional drop targets (1236–1246), and nullable inspection paths. No new application `throw`, string-parsed failure or untyped error channel is introduced.
- **Retry/failure semantics:** boot names reload recovery (98–100), interaction names prior-state retention (74), and semantic fixture scope is explicit (117). A retry reconstructs fresh geometry; same-cell, empty and cross-section targets do not mutate order. This isolated demo does not claim a durable transaction.
- **Depth:** the host hides semantic order, builder invocation and readiness behind the renderer's two-identity callback. The renderer hides screen/world conversion, transient reset, selection and diagnostic painting behind finished scene data. Neither pushes wire repair into its consumer.
- **Demeter:** accesses are to direct scene/spec records or declared callbacks; there is no navigation into another capability's behavior internals.
- **Immutability 8:** all semantic arrays and scenes are replaced, never mutated; React owns `{scene,spec}` state (76–84). Host browser diagnostics intentionally mutate (29,63,65,80,83). Renderer retains a camera ref and an invocation-local arc-length cursor (562,724,1215–1220). Those bounded imperative details are deducted; no mutable scene geometry is shared across events.
- **Type safety:** no `any`, unchecked runtime `as`, non-null assertions, or suppressed errors added. Missing touches, camera, target and array values have explicit outcomes. Readonly public geometry/spec records are retained; literal `as const` declarations only narrow known literals.
- **Cognitive style:** no nested ternaries, conditional spread assembly or new hidden mutation expression. Small named helpers separate conditions; the executable Sonar ≤2 gate passes across application and JavaScript audit sources.
- **Testability 5:** these are real browser boundaries with ambient DOM, performance, animation frames and React state; they are not pure injectable core units. Headless public-contract/mouse acceptance is required and supplied. This deduction is not waived because browser automation passes.

Worst three limitations: fixed extension axes (OCP 6); browser dependence for timing and gestures (testability 5); repeated inherited SVG marker declarations (renderer DRY 9). The coverage footer explicitly stops claiming the initial audit applies after a swap; the expensive standalone coverage audit is not part of the drag layout pipeline.

Audit MJS/Python programs retain the established terminal-tool scope documented in `../m4-source-review.md`: assertions/I/O failures terminate their process; they are not application APIs assigned these application-source scores. They remain covered by the existing JavaScript lint gate, with no suppression. Supplied-scene verifiers preserve default checks, independently regenerate from the semantic spec, and relax all physical lane ranks for certification. No topology/search behavior moved into application code.
