# Stage 5 — Build, acceptance and review

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| ID | Given / action | Expected observable condition |
| --- | --- | --- |
| S5-A | Batch 1 | Finish first original example per family; preserve prior stage successes. |
| S5-B | Batch 2 | Second structure/subject per family, reuse existing features without image-specific code. |
| S5-C | Batch 3 | Third structure per family and at least one mixed-family collection; each source ≤300 lines. |
| S5-D | Final workflow | Real DSL edit in open browser, longer text, refresh/restart, exported artifact inspection and complete evidence manifest. |
| S5-E | Final quality | All examples meet applicable References.md criteria and README overall done. Record residuals honestly; any material gap keeps goal active. |

## Frozen test budget

One focused parameterized public-contract case per row; reuse existing fixtures and extend existing suites where sufficient. This budget supersedes Doc6 speculative test-file counts; file names remain a guide.

| # | Case / bug caught | Tier/type | Loop/nightly allowance | Maintenance | Why add / confidence | Against / confidence | Existing coverage | Retirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | corpus semantic roundtrip: All 24 source read/print/edit operations preserve meaning through public contracts | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Existing Language roundtrip covers individual fixtures | Behavior removed or superseded by the same public-contract coverage |
| 2 | corpus encoded fidelity: All family outputs preserve admitted content/notation/resource references | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Existing Export artifact tests cover fewer families | Behavior removed or superseded by the same public-contract coverage |
| **Total** | **2 cases** | fast; slow/guard/e2e=0 | **1.0s / 1.0s** | | | | | |

## Execution

1. Record word/line baseline, run one scoped eight-minute pressure review, verify findings and fix once (≤20% growth).
2. Build through owning contracts. Author the small proof set below; inspect the visible browser and actual export where applicable. Repair failed author checks without reopening audits.
3. Run affected public-contract cases and necessary type/lint/format/import/token/build gates; no mechanical command substitutes for >144/160 evidence.
4. One A1 spec/coding/visual and one A2 correctness review, eight minutes each, ≤5 source targets each. Verify before one findings fix; no re-audit loop.
5. Record receipts, readouts, source/code revisions, captures, gaps, review dispositions and PR. Continue under standing authority.

Proofs: Existing 24-source corpus in three eight-example batches; preserve coherent ≤300-line sources.

Private implementation preferences are nonblocking. Material return/invariant/coding/visual violations are blocking. All references remain targets; intermediate readability alone is not final benchmark quality.
