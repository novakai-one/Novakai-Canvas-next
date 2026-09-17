<!-- Verifier contract: verify-evidence.py asserts current routing/lane totals, EVERY per-wire total, median formatted .1f, and literal "100 nodes". Generate numbers from its computed bundle; preserve these strings. -->
# Nested-wires evidence index

## 1. Current state

| Milestone | Accepted status / limits | Kept report |
| --- | --- | --- |
| M3 | Historical lane-capacity acceptance; superseded scene | [Source review](m3-source-review.md), `m3-verification.txt` |
| M4 | Accepted under ruling #3; 24 nodes / 26 wires | [Completion](m4-completion-report.md) |
| M4.5 | Accepted; 23 certified crossings / 0 uncertified | [Completion](m45-completion-report.md) |
| M6 | Repairs evidenced; M5 regression and visual sign-off open | [Second resume](templates-scene/resume2-report.md) |
| M6.5a | Scoped styling accepted; frozen evidence | [Styling](presentation/styling/report.md) |
| M6.5b | Scoped declutter accepted; general visual limits remain | [Declutter](presentation/declutter/report.md) |
| M7 | Incomplete: left-edge A/B validity and selection timing STOP | [Ruling #5](scale-scene/ruling5-report.md) |
| M7.6 | Ruling #10 implementation retained; dropdown screenshot STOP | [Amended report](presentation/m76/amended-report.md) |
| M9a | Scoped paint-only spotlight accepted; visual limits retained | [Acceptance](presentation/m9a/report.md) |

## 2. M3 acceptance lineage and current verifier numbers

Historical M3: 18 wires; routing **668 ≤700**; maximum leg **43 ≤60**; compilation **13,922 ≤15,000**; discovery **0**.
Five M3 loads **[282, 279.1, 239.8, 260.7, 249.9] ms**; median **260.700 ms**; total-op clone **19,563 →36,124**, **1.8465470531× ≤2.5**.
Current canonical scene is M4-era: 24 nodes / 4 sections / 26 wires. The following strings come from `verify-evidence.py`'s computed values, under rulings #15–#16.

| Current measurement | Exact accepted value |
| --- | ---: |
| Wire-routing total | 992 |
| Lane-network total | 19768 |
| Road-pair discovery / candidates | 0 / 0 |
| Maximum law leg | 41 |
| Historical browser median (ms, pinned .1f) | 226.3 |
| Probe nodes; total operations; ratio | 24→48; 27184→46177; 1.698683048852266 |

| Per-wire routing ops | Per-wire routing ops | Per-wire routing ops | Per-wire routing ops |
| --- | --- | --- | --- |
| w01: 11 | w02: 32 | w03: 14 | w04: 11 |
| w05: 15 | w06: 34 | w07: 32 | w08: 15 |
| w09: 34 | w10: 71 | w11: 42 | w12: 103 |
| w13: 32 | w14: 11 | w15: 15 | w16: 72 |
| w17: 46 | w18: 104 | w19: 15 | w20: 11 |
| w21: 43 | w22: 33 | w23: 65 | w24: 51 |
| w25: 27 | w26: 53 | — | — |

The root browser/12-closeup evidence is historical, not a new 26-wire capture; current M9a browser evidence is separately scoped in its report.
**100 nodes** remains an extrapolation, not a measured fixture or acceptance claim. Sorting depends on road congestion; no arbitrary-density or 150-node readiness claim.

## 3. Canonical artifacts

- `scene.json`, `calculations.json`, `oracle.json`: current geometry, operation counters and independent assigned-gate oracle; 26 wires, all detours within 10%.
- `metrics.json`: verifier-generated bundle with exact-current ceilings; `before.json`: frozen M1 baseline from `266a96c`.
- `browser.json`, `overview.png`, `w01.png`–`w12.png`: retained historical five-load and visual evidence; no GPU-paint claim.
- `m45-topological-bound.json`, `m4-visual-budget.json`, `m45-browser.json`: M4.5 certification and milestone evidence.
- `templates-scene/`, `scale-scene/`, `presentation/m9a/`: scene-specific evidence; [prune audit](docs-prune-report.md) records scope, provenance and gates.

## 4. Standing rulings and re-entry maps

Ruling #3 excludes legal junction crossings from the old visual budget; M4.5 certifies every remaining crossing. Uncertified crossings must equal zero.
Ruling #10 pins compile/routing/discovery: nested 19768/992/0; templates 28443/1626/0; scale 43876/2088/0.
Rulings #14–#16 modernize only the root verifier, regenerate metrics through `--write`, and preserve current computed README strings.
Restored maps describe rejected experiments. Follow their banner to the source branch for relative links and artifacts; no experimental runtime is imported here.

- M7.5: [compacting STOP](compacting/stop-report.md), [M7.5b STOP](compacting/m75b/stop-report.md) — `feat/m75-compacting`.
- M8: [authoring STOP](authoring-scene/stop-report.md), [M8b STOP](authoring-scene/m8b/stop-report.md) — `feat/m8-authoring-scene`.
- Earlier scale constraints: [scale-up STOP](scale-up/stop-report.md), [scale-scene STOP](scale-scene/stop-report.md).

## 5. Conventions and reproduction

Agents author semantic DSL, never coordinates. Preserve routing law, scene identity, zero discovery and certification; do not treat historical STOP narratives as current acceptance.
One numeric add/subtract/abs/comparison is one op; min/max charge n−1 comparisons. Counts include all reachable instrumented layout stages; initialization is separately reported.
Run from repository root, serially; `pnpm check` must run alone:

```sh
python3 output/playwright/nested-wires/verify-evidence.py
python3 output/playwright/nested-wires/presentation/m9a/verify-offline.py
pnpm check
```

M9a offline replay writes logs and derived artifacts: use a disposable snapshot when preserving frozen evidence; see the prune audit.
`presentation/declutter/verify-audit.py` cannot run on this branch: it requires `feat/m65b-declutter`; its actual assertion output is in the prune audit.
Do not run historical metric writers over the current bundle. Approved visual references remain unchanged; retained reviews document outstanding visual limitations.
