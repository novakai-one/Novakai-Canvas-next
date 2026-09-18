# M10a Amendment 12 — product-source review STOP

Reviewed 2026-09-18 under the full brief, Amendments 1–12, AGENTS.md, and docs/standards/CODING-STANDARDS.md. Amendment 12 is applied: **no scoring or quality refactoring of timing-ab.mjs, diff.mjs, or other output/playwright evidence scripts.** Their historical scores are superseded as release gates.

The mandated review unit is the **entire target file**, not only changed lines. First completed product target: [RoadPrototype.tsx](../../../../../capability/canvas/adapters/react-flow/RoadPrototype.tsx). Direct collaborators inspected: Canvas composition/React contracts, the web prototype host, shared Presentation label renderer/contracts, the paired CSS and token diff. Collaborator internals are not charged unless this target chooses or propagates the issue.

**Result: 121/160 — FAIL. Required: strictly >144/160.** No source remediation was attempted after this judgment-based failure.

| Principle | Score | Printed evidence |
|---|---:|---|
| SRP | 5 | Paint, camera/selection, diagnostic proof inspectors, and shell header/footer layout have independent reasons to change: RoadPrototype.tsx:269–316, 565–822, 1084–1104, 1332–1368. AGENTS.md assigns shell panel layout separately from Canvas camera/gestures. |
| OCP | 6 | inspectTravel, auditCoverage and scheduleSpotlight are injected (565–581), but owned view/paint steps and kinds are fixed in nodeTypes (178), the node assembly (621–643), and the component tree (742–821). Adding a step edits this file. The rubric caps this case at 6. |
| LSP | 7 | No substitute implementation sharing a behavioral contract suite is demonstrated for this target. React props and component typing are not a shared substitution suite; mandatory not-demonstrated anchor: 7. |
| ISP | 10 | The four injected callable dependencies are consumed: inspectTravel through inspectors (791–803), auditCoverage through RoadCoverage (812; 552–560), scheduleSpotlight (601; 1237–1247), and onReady (764; 910–915). focusProof uses both methods of its narrow camera port (1084–1103). No unused broad service port found. |
| DIP | 10 | This is a React/React Flow detail adapter (1–32), not core. Layout arrives as records and injected domain operations (13–30, 565–581); it does not construct a domain service or import foreign private behavior. Framework imports at this adapter boundary are not charged as core violations. |
| DRY | 5 | Repeated node-view construction sets id/type/position/width/height/style/draggable/selectable across junctionNode, blockNode and roadNode (180–246). Arrow marker geometry is duplicated across RoutePreview and ProofPaths (495–521, 955–981). Leaf-label policy repeats within this target in Block and toolbar tabs (132, 675). |
| KISS | 8 | Two localized reading costs: choice layers several repeated searches and fallback predicates (340–358); RoadPrototype assembles interdependent proof, focus, selection and node state before rendering (583–653). No deduction is based on file length alone. |
| YAGNI | 10 | Road inspection, proof navigation, selection/hover, density and label paint all have concrete rendered controls or consumers (269–316, 650–821, 1125–1219, 1332–1368). No speculative plugin framework or unused future option was identified. |
| Typed error outcomes | 5 | inspectTravel returns a structured PrototypeTravelResult and verdicts switch on error.code (35, 263–265, 377–380). The public component returns ReactElement (565–581); camera promises are discarded (1096–1103), and browser effects lack a declared error outcome (1335–1349). The host startup catch at apps/web/cli/roads-prototype.ts:95–97 does not cover later React effects. A complete typed public failure boundary or named effect-failure handler is not demonstrated; only domain failure kinds are programmatically distinguished. |
| Idempotency / failure semantics | 8 | The entry comment documents safe reload (564); selection copies records (1288–1305), hover cancels on replacement/unmount (1236–1247), and LabelPaint disconnects on unmount (1328–1349). Recovery ownership for asynchronous camera/effect failures is not named in the public component contract (565–581, 1084–1104), so the perfect recovery anchor is not met. |
| Deep module / information hiding | 10 | One exported component (565) hides node adaptation, inspection, camera focus, wire paint and typography (67–1368). Its consumers pass scene records and narrow functions; apps/web/cli/roads-prototype.ts:83–92 does not reproduce these internals. |
| Law of Demeter | 10 | Layout access traverses data records, not collaborator service chains (185–246, 583–653). Camera calls target the directly supplied port (1096–1103). DOM observer/element operations are direct adapter collaborators (1335–1367). |
| Immutability | 5 | Invocation-local Map mutation in convergingWireIds (1227–1228), mutable cancellation ref (1239–1243), and callback mutation of remaining in wireMidpoint (1313–1317). Copying selection records does not erase these mutations; the rubric local-mutation anchor is 5. |
| Type safety | 10 | No explicit any or unchecked type assertion in this target. The as const at 258 narrows a newly constructed literal rather than asserting unchecked input. Props and callback results are declared; optional lookups are checked or defaulted (340–358, 1272–1286, 1315–1320). |
| Cognitive complexity | 7 | Return-conditional idioms occur in sectionLayer (1106–1107), spotlightClass (1263–1265), secondaryClass (1285–1286), and selectionNode (1305). The manual rubric assigns 7 for a named conditional idiom in a return. This is distinct from the fresh passing Sonar <=2 gate. |
| Testability | 5 | Domain operations and scheduling accept fakes (565–581), but LabelPaint directly reads computed style and constructs ResizeObserver (1340, 1346); measureLabelFit reads live client/offset dimensions (1354–1361). Whole-file behavior therefore retains ambient browser dependencies: injectable, but ambient reads remain, the explicit 5 anchor. |
| **Total** | **121/160** | **FAIL** |

## Decisive bound

Independently of the other twelve rows: OCP 6 + mandatory LSP 7 + immutability 5 + testability 5 + twelve hypothetical 10s = **143/160**. Those twelve hypothetical tens are an upper-bound calculation, not awarded scores. Reconsidering the error-outcome or SRP deductions cannot make the target pass while these four anchors hold.

## Worst three findings

1. **Immutability — 5:** mutable Map, cancellation ref, and callback accumulator (1227–1243, 1313–1317).
2. **Testability — 5:** direct CSSOM/layout measurements and ResizeObserver despite injected domain functions (1340–1361).
3. **SRP — 5:** diagram paint, shell layout, camera and diagnostic inspector responsibilities coexist (269–316, 565–822, 1084–1104, 1332–1368).

These include inherited code. The rubric explicitly reviews the whole file; Amendment 12 changes the eligible file set, not that unit. No inherited-code exemption or changed-lines-only score was inferred. Fixing these requires design judgment, outside Amendment 10's lint/type/format/complexity self-correction allowance.

## Review coverage at mandatory STOP

RoadPrototype.tsx is the first completed score. The remaining product files were inventoried/read as applicable but **are not assigned completed scores** after the failed gate: SectionFrame.tsx; definitions.tokens.json and its four generated product outputs; NodeContent.tsx; ContentBlocks.tsx; svg/nodes.tsx; svg/scene.tsx; export/contract/render-types.ts; presentation/contract/react-types.ts; RoadPrototype.module.css. No all-product passing review is claimed.

The fresh full pnpm check started while review was in progress and completed successfully: exit 0, 70 test files, 208/208 tests. [Complete check output](pnpm-check-amendment-12.txt). This verifies the mechanical gates, not a passing source-quality score. No product or evidence-script source changed in this run. The literal STOP clause prevents commit, push and PR after the score failure.
