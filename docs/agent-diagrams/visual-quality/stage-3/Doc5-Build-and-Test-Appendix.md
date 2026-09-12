# Stage 3 — Build, acceptance and review

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| ID | Given / action | Expected observable condition |
| --- | --- | --- |
| S3-A | First full benchmark | Water-treatment infographic meets References.md hierarchy, figure, relationship and surface criteria in actual browser/export. A connected but generic card grid does not pass. |
| S3-B | Routing transfer | Research fork/join/return and module member endpoints demonstrate the same general routing behavior. |
| S3-C | Annotations | Step badge and labelled wire are adjacent, legible and non-overlapping after content growth. |
| S3-D | Failure/stability | Impossible locked case rejects with structured diagnostics; reroute keeps fixed nodes; successful retry does not duplicate data. |

## Frozen test budget

One focused parameterized public-contract case per row; reuse existing fixtures and extend existing suites where sufficient. This budget supersedes Doc6 speculative test-file counts; file names remain a guide.

| # | Case / bug caught | Tier/type | Loop/nightly allowance | Maintenance | Why add / confidence | Against / confidence | Existing coverage | Retirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | annotation DSL: Positive step accepts; invalid step rejects; print/patch keeps label and step | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Existing wire roundtrip covers labels only | Behavior removed or superseded by the same public-contract coverage |
| 2 | annotation measurement: Badge plus long label reserves actual combined footprint | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Presentation notation lacks badges | Behavior removed or superseded by the same public-contract coverage |
| 3 | routing families: Fan-out/join, return, group/member endpoint, impossible lock, foreign-route annotation collision and obscuring shared-run vectors | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Existing routing suite covers simpler corridors | Behavior removed or superseded by the same public-contract coverage |
| 4 | route/render retention: Reroute holds node positions; actual export preserves route/annotation primitives | fast / contract | 0.5s / 0.5s | medium | New observable contract otherwise unguarded (90%) | May overlap existing vectors (30%) | Existing export routing lacks badge footprint | Behavior removed or superseded by the same public-contract coverage |
| **Total** | **4 cases** | fast; slow/guard/e2e=0 | **2.0s / 2.0s** | | | | | |

## Execution

1. Record word/line baseline, run one scoped eight-minute pressure review, verify findings and fix once (≤20% growth).
2. Build through owning contracts. Author the small proof set below; inspect the visible browser and actual export where applicable. Repair failed author checks without reopening audits.
3. Run affected public-contract cases and necessary type/lint/format/import/token/build gates; no mechanical command substitutes for >144/160 evidence.
4. One A1 spec/coding/visual and one A2 correctness review, eight minutes each, ≤5 source targets each. Verify before one findings fix; no re-audit loop.
5. Record receipts, readouts, source/code revisions, captures, gaps, review dispositions and PR. Continue under standing authority.

Proofs: `story-water-treatment.canvas`, `flow-research-approval.canvas`, `modules-document-publishing.canvas`

Private implementation preferences are nonblocking. Material return/invariant/coding/visual violations are blocking. All references remain targets; intermediate readability alone is not final benchmark quality.
