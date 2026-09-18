# Amendment 2 — placement source review

Target: `capability/layout/core/prototype-nested-placement.ts`, whole file, reviewed against `docs/standards/CODING-STANDARDS.md`. Direct collaborators read: `prototype-road-nodes.ts`, declaration records `road-prototype.ts` and `nested-scene-spec.ts`; consumer `prototype-nested-scene.ts` read to establish reconstruction ownership. This is a source review, not visual or routing acceptance.

| Principle | Score | Target-line evidence |
| --- | ---: | --- |
| SRP | 10 | 52–102, 141–209: content-first section sizing and placement; no routing execution. |
| OCP | 6 | 52–76, 104–125: sizing and port-layout policy require edits; no policy injection seam. |
| LSP | 7 | 27–51: data interfaces, no subtype implementation/contract suite; not demonstrated. |
| ISP | 10 | 2–8, 23–26: data records and two used pure node helpers; no unused behavioral port methods. |
| DIP | 10 | 2–8, 23–26: own core and declaration-only contracts; all changing scene data arrives as arguments. No infrastructure/framework dependency. |
| DRY | 9 | 60–61, 215–216, 226: section identity/label formatting and prefix parsing repeat. Shared spacing and node dimensions otherwise have named sources (10–22). |
| KISS | 9 | 187–218: recursive copy/renumber traversal needs a second reading; empty-only node stride is internally negative infinity, but no node consumes it. |
| YAGNI | 10 | 52–209: existing sizing/placement paths; change removes a rejection, adds no option or abstraction. |
| Typed error outcomes | 10 | 52–102, 182–209: pure typed record construction, no declared domain failure operation or throw; the removed RangeError was the empty-leaf failure. Does not certify arbitrary invalid numeric inputs. |
| Idempotency/failure | 10 | 94–102: caller-owned reconstruction documented; 147–175, 189–218 build fresh records without committed state. |
| Depth/information hiding | 10 | 95–102, 182–209: sizing/placement entry points hide recursive packing, offsets, ports and node distribution. |
| Demeter | 10 | 127–175: direct data-field reads and pure helper calls, no collaborator navigation chains. |
| Immutability | 5 | 168–171, 196–206: local x/y counters mutate during traversal. Readonly interfaces do not erase that deduction. |
| Type safety | 10 | 27–51, 104–125: readonly typed records; literal `as const` narrowing only, no unchecked cast or `any`. |
| Cognitive style | 10 | 52–226: flat guards and simple ternaries; no nested ternary/spread-ternary idioms. Targeted ESLint passes Sonar <=2. |
| Testability | 10 | 95, 182: arguments supply all state; pure arithmetic/helper dependencies, no clock, DOM, filesystem or external service. |

**Total: 146/160 (>144).** No score was inferred from the test suite or inherited from the prior review.

Worst three findings: local traversal mutation (5); fixed sizing/port-policy axes (6); substitutability not demonstrated (7). These are recorded without exemption. Existing empty-root-list semantics and arbitrary malformed numeric input are not covered by the empty-leaf claim.

Behavior evidence: `amendment2-empty-leaf-output.txt` and the public-contract regression in `templates-scene/verify-templates-scene.mjs` establish a labelled 128×176 empty section, zero nodes and successful empty wiring. `amendment2-baseline-identity.txt` establishes full serialized scene equality for default, nested-default, nested-hub, templates and scale before/after this change. No routing/capacity source changed. The real scene nevertheless fails routing invariants; see the STOP report.

The extractor and scene-host review remains outstanding from the earlier run. This review covers the engine file changed in Amendment 2 only and is not a milestone-wide scoring claim.
