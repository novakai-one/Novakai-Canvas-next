# M7.6 changed runtime source review

Manual file review against all sixteen anchors in `docs/standards/CODING-STANDARDS.md`; reviewed direct Layout records/audit, scene decorators, Canvas composition and the inherited selection runner. These are bounded prototype reviews, not production/arbitrary-input certification. No pre-awarded prior review scores are reused. `pnpm-check-amended.txt` verifies the enforced <=2 Sonar complexity and import/type/format gates.

Principles in order: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes, idempotency/recovery, information hiding, Demeter, immutability, type safety, cognitive complexity, testability.

| Principle | Host `apps/web/cli/roads-prototype.ts` | Renderer `capability/canvas/adapters/react-flow/RoadPrototype.tsx` |
| --- | --- | --- |
| SRP | 10: lines 53–88 bootstrap the one prototype; timings describe that bootstrap | 8: RoadPrototype (548) and LaneProof/JunctionProof/AtlasInspector combine multiple inspector presentations |
| OCP | 6: builder (93) and main own a fixed set of modes/steps | 6: nodeTypes (162), RoadPrototype toolbar and Inspection own fixed presentations, though audit/travel are injected |
| LSP | 7: no substitution contract suite; not demonstrated | 7: no shared renderer subtype contract suite; not demonstrated |
| ISP | 10: measure invokes its single operation; supplied callbacks have one role | 10: auditCoverage (534), inspectTravel and onReady are single-callable roles |
| DIP | 10: lines 3–20 enter public capability surfaces and own host decorators | 10: public Layout records plus injected travel/audit; adapter legitimately owns React |
| DRY | 10: measure/recordReady/auditCoverage each own their timing semantics | 9: junctionNode/blockNode/roadNode repeat React Flow geometry assignments |
| KISS | 10: main (53–88) is sequential composition | 9: choice (321) chains four fallbacks; lazy RoadCoverage itself is one memoized call |
| YAGNI | 10: no added modes, flags, caches or instrumentation globals | 10: roads state mounts one audit, filename map is scene-local; no new selector framework |
| Typed outcomes | 8: styles failure typed (59); import failures use named terminal main.catch (89), not a typed host result | 10: travel failures use PrototypeTravelResult; coverage gaps are fields of PrototypeRoadCoverage; missing routing is the existing typed scene outcome |
| Idempotency / recovery | 10: fresh bootstrap resets counter (27); catch (89–90) explicitly names reload recovery | 10: frozen input, local view state; entry comment (546) names reload reconstruction; audit remount recomputes without scene writes |
| Information hiding | 10: main hides URL choice, dynamic loading, clocks, readiness and callback composition from renderer | 10: RoadPrototype hides React Flow records, selection neighbourhoods, camera, inspectors and lazy audit lifecycle behind scene/callback props |
| Demeter | 10: direct public calls, record reads, browser host primitives | 10: direct callback calls and data reads; no collaborator object navigation chains |
| Immutability | 9: window counter (27,68) is shared instrumentation mutation | 9: convergingWireIds and wireMidpoint use local accumulators; scene remains unchanged |
| Type safety | 10: no any or unchecked casts | 10: typed props/records, only literal `as const` in movement |
| Cognitive complexity | 10: no named spread-ternary idioms; enforced <=2 passes | 10: no nested/spread ternary idioms; enforced <=2 passes |
| Testability | 5: ambient window/document/location/performance in host (27–48,53–90) | 10: scene, audit, travel and readiness supplied as props; deterministic selection/point helpers need no external service |
| **Total** | **145/160** | **148/160** |

CSS review: `RoadPrototype.module.css` changes only flex wrapping, flex sizing and max-width. Existing token-based gaps, colors, padding and typography remain; zero new visual literals. No layout metric, position, routing or sizing algorithm changes. Header bounds and all thirteen buttons (Overview + twelve sections) fit 1920px with document scrollWidth=innerWidth.

Worst three: fixed presentation/mode axes (OCP 6); ambient host environment (testability 5); combined legacy/new inspector responsibilities (SRP 8). These are retained limitations, not claimed resolved by scheduling.

Verification scripts under this evidence directory are standalone acceptance artifacts, outside the first-party runtime source inventory; they use real browser/process assertions and deliberately fail closed. No new `*.test.ts` was created.
