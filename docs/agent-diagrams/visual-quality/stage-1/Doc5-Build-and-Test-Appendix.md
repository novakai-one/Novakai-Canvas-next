# Stage 1 — Build, acceptance and review

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| ID | Given / action | Expected observable condition |
| --- | --- | --- |
| S1-A | Water diagram | Trace water, residuals and monitoring from labelled edges; source-risk caveat visible. |
| S1-B | Research flow | Trace both reviews, approval and revision loop without reading source. |
| S1-C | Module diagram | Identify caller, interface, implementation, function and external dependency. Module implements the complete displayed interface; caller invokes a compatible function. Data inputs cannot masquerade as callable implementations. |
| S1-D | Real DSL path | Create all three. Use actual full readout as replacement source; change one label. Compare committed readout before/after: only that label changes; IDs, endpoints, kinds, other labels, groups and visible wires remain. Retain receipt and visible update. No coordinate authoring. |
| S1-E | Evidence | Record presentable captures and specific remaining composition/routing gaps. Do not claim benchmark completion. |

## Frozen test budget

New automated tests: **0**; production code changes: **0**. Run existing Language/Model contract suites if needed to distinguish invalid source from rendering failure. A2 audits the three source→receipt→capture assertions and attempts three false-pass scenarios. Manual browser/export operations are evidence, not a new E2E test suite.

## Execution

1. Record word/line baseline, run one scoped eight-minute pressure review, verify findings and fix once (≤20% growth).
2. Build through owning contracts. Author the small proof set below; inspect the visible browser and actual export where applicable. Repair failed author checks without reopening audits.
3. Run affected public-contract cases and necessary type/lint/format/import/token/build gates; no mechanical command substitutes for >144/160 evidence.
4. One A1 spec/coding/visual and one A2 correctness review, eight minutes each, ≤5 source targets each. Verify before one findings fix; no re-audit loop.
5. Record receipts, readouts, source/code revisions, captures, gaps, review dispositions and PR. Continue under standing authority.

Proofs: `story-water-treatment.canvas`, `flow-research-approval.canvas`, `modules-document-publishing.canvas`

Private implementation preferences are nonblocking. Material return/invariant/coding/visual violations are blocking. All references remain targets; intermediate readability alone is not final benchmark quality.
