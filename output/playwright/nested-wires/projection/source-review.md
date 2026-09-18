# Rejected clamp candidate — diff review

Scope: only the changed expression at `capability/layout/core/nested-lane-projection.ts:334`, against b9e098a, under the brief's ruling #23 legacy ratchet. Reviewed the enclosing forward clamp, median bridge, connection emission, terminal fan/owned stem, assigned-travel records and terminal pins. Scores use all sixteen local coding-standard anchors; audit scripts remain ruling #22 evidence. This source score is **not approval of the candidate's behavior**: its mission verifier fails.

| Principle | Score | Evidence |
| --- | ---: | --- |
| SRP | 10 | :334 changes only which dogleg column the existing clamp moves. |
| OCP | 6 | :327–334 fixed projection policy; no extension seam, mandatory cap. |
| LSP | 7 | No subtyping demonstrated; fixed anchor. |
| ISP | 10 | :323–325 consumes supplied connection/travel records; no new behavioral port. |
| DIP | 10 | No imports/dependencies added; core uses its own records and geometry. |
| DRY | 10 | Original column comparison occurs once; existing axis/start calculation reused. |
| KISS | 9 | Coordinate equality encodes column membership; the relationship needs context from medianBridge. |
| YAGNI | 10 | One observed clamp defect; no retry, generalized router or speculative option. |
| Typed outcomes | 10 | No throw or new failure channel; original public inspection still reports all emitted defects. This does not assert feasibility. |
| Idempotency/recovery | 10 | Pure reconstruction and original missing-plan failure owner documented at :346; no side effects added. |
| Depth/hiding | 10 | Connection topology remains hidden behind the existing projector entry. |
| Demeter | 10 | Only direct point/connection fields are read. |
| Immutability | 10 | New from/via records; original points retained or copied without mutation. |
| Type safety | 10 | No casts, any or unchecked optional access introduced. |
| Cognitive style | 7 | Ternary in returned map expression; apply the lower return-expression anchor. Sonar checked separately. |
| Testability | 10 | Public semantic scene builder and inspector expose the exact failure; retained differential checks detect geometry spread. |
| **Total** | **149/160** | **Diff style threshold only; mission acceptance FAIL.** |

Worst findings: fixed policy (OCP 6), unproven substitutability (LSP 7), conditional return idiom (cognitive style 7). Beyond that style score, the decisive behavioral findings are the new real overlap and changed protected body/contact catalogs, documented in the STOP report. No exception or acceptance waiver is claimed.
