# Stage 4 — Build, acceptance and review

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| ID | Given / action | Expected observable condition |
| --- | --- | --- |
| S4-A | ER | Viewer can identify composite key membership, optional vs mandatory relationships, and FK destinations. |
| S4-B | Modules | Viewer traces labelled dependencies through typed interface and function nodes, including an external boundary. |
| S4-C | Other engineering | Nested sequence fragments, guarded recovery and uneven trees remain readable and semantically correct. |
| S4-D | Density/export | Long signatures/field names grow safely; actual exported notation agrees with canvas. |

## Frozen test budget

One focused parameterized public-contract case per row; reuse existing fixtures and extend existing suites where sufficient. This budget supersedes Doc6 speculative test-file counts; file names remain a guide.

| # | Case / bug caught | Tier/type | Loop/nightly allowance | Maintenance | Why add / confidence | Against / confidence | Existing coverage | Retirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | engineering density: Long types/composite PK/FK badges keep aligned rows and unchanged member anchors | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Existing fields/signature tests cover shorter examples | Behavior removed or superseded by the same public-contract coverage |
| 2 | cardinality and compartments: Both ER endpoint vectors and canonical module/interface/function headers retain meaning under frame overrides | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Extend existing notation cases; avoid duplicate fixtures | Behavior removed or superseded by the same public-contract coverage |
| 3 | sequence/tree geometry: Nested fragments and uneven parent/reference topology fit measured content | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Reuse existing nested-sequence case 6; add uneven tree/reference vector | Behavior removed or superseded by the same public-contract coverage |
| **Total** | **3 cases** | fast; slow/guard/e2e=0 | **1.5s / 1.5s** | | | | | |

## Execution

1. Record word/line baseline, run one scoped eight-minute pressure review, verify findings and fix once (≤20% growth).
2. Build through owning contracts. Author the small proof set below; inspect the visible browser and actual export where applicable. Repair failed author checks without reopening audits.
3. Run affected public-contract cases and necessary type/lint/format/import/token/build gates; no mechanical command substitutes for >144/160 evidence.
4. One A1 spec/coding/visual and one A2 correctness review, eight minutes each, ≤5 source targets each. Verify before one findings fix; no re-audit loop.
5. Record receipts, readouts, source/code revisions, captures, gaps, review dispositions and PR. Continue under standing authority.

Builder correction: actual export exposed inherited stroke on sequence text and faint message paths. Extend existing Export case 4 (no new case) to require foreground strokes and unstroked labels.

Proofs: `er-museum-loans.canvas`, `modules-document-publishing.canvas`, `sequence-payment-settlement.canvas`, `state-batch-job.canvas`, `tree-field-research.canvas`

Private implementation preferences are nonblocking. Material return/invariant/coding/visual violations are blocking. All references remain targets; intermediate readability alone is not final benchmark quality.
