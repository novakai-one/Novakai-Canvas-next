# Stage 2 — Build, acceptance and review

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| ID | Given / action | Expected observable condition |
| --- | --- | --- |
| S2-A | Figure-led story | Prominent figure + short caption, at least one frame-free actor and one grouped panel; visible hierarchy superior to baseline. |
| S2-B | Transfer | Use the same intents in a software architecture and comparison diagram without a new renderer. |
| S2-C | Round trip | Create, full print, patch, replace and unset preserve/reset documented fields. Replacement retains supplied fields; omitted object fields reset to defaults and omitted view overrides inherit. |
| S2-D | Growth/export | Longer text and portrait figure remain unclipped; actual SVG and visible Canvas agree. |

## Frozen test budget

One focused parameterized public-contract case per row; reuse existing fixtures and extend existing suites where sufficient. This budget supersedes Doc6 speculative test-file counts; file names remain a guide.

| # | Case / bug caught | Tier/type | Loop/nightly allowance | Maintenance | Why add / confidence | Against / confidence | Existing coverage | Retirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | composition admission: Reject missing media/unknown intent and resolve inherited/group overrides, including filtered-media rejection | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Model content/sections tests cover old records, not new intent | Behavior removed or superseded by the same public-contract coverage |
| 2 | composition DSL roundtrip: Create/print/set/unset/replace retains frame/composition/caption role | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Language roundtrip covers old vocabulary | Behavior removed or superseded by the same public-contract coverage |
| 3 | measured composition: Two orientations, long text, portrait media, member anchors and no clipping | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Presentation sizing/media cases cover stacked content only | Behavior removed or superseded by the same public-contract coverage |
| 4 | render/export agreement: Measured primitives/font identities survive renderer and actual SVG encoder | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Existing rendering/export cases lack new primitives | Behavior removed or superseded by the same public-contract coverage |
| **Total** | **4 cases** | fast; slow/guard/e2e=0 | **2.0s / 2.0s** | | | | | |

## Execution

1. Record word/line baseline, run one scoped eight-minute pressure review, verify findings and fix once (≤20% growth).
2. Build through owning contracts. Author the small proof set below; inspect the visible browser and actual export where applicable. Repair failed author checks without reopening audits.
3. Run affected public-contract cases and necessary type/lint/format/import/token/build gates; no mechanical command substitutes for >144/160 evidence.
4. One A1 spec/coding/visual and one A2 correctness review, eight minutes each, ≤5 source targets each. Verify before one findings fix; no re-audit loop.
5. Record receipts, readouts, source/code revisions, captures, gaps, review dispositions and PR. Continue under standing authority.

Proofs: `story-water-treatment.canvas`, `modules-document-publishing.canvas`, `grid-research-methods.canvas`

Private implementation preferences are nonblocking. Material return/invariant/coding/visual violations are blocking. All references remain targets; intermediate readability alone is not final benchmark quality.

Builder correction: case 4 also verifies actual PNG dimensions for fractional scene bounds at non-integer scale; the native encoder preserves the public ceil(bounds × scale) contract. No new case or E2E. Actual file scope and observed visual gaps are recorded in the stage evidence README.
