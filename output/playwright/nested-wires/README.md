# M3 status — STOP on straight-through junction crossing (2026-09-17)

The corrected **w01/w15** prerequisite and parallel-travel interpretation now pass, as do all 18 routes and the three gate-sequence equalities. The old w02/w15 STOP is resolved.

The resumed lane candidate exposed a different conflict with Part 2.6: **w05 and w06 cross at a junction where neither wire turns**. This is reproduced in the accepted M2 fixture, current 18-wire source, and capacity/lane candidate. Separate offsets move the intersection but cannot remove it under the unchanged law. The brief permits junction crossings only where wires genuinely turn; implementation stopped without silently broadening that exemption.

Read [the current STOP report](m3-junction-blocker.md), [executable reproduction output](m3-junction-output.txt), and [corrected topology output](m3-topology-output.txt). The unaccepted candidate is preserved in [m3-lane-candidate.patch](m3-lane-candidate.patch), with a separate [candidate scene](m3-candidate-scene.json) and [candidate verification](m3-candidate-verification.txt). It is **not installed in application source**. The two accepted commits remain intact. No new test files, push, PR or Vite restart.

The candidate used lane pitch 6 and **width = 12 + 12 × lane count**, equally for streets and driveways, with no extra driveway margin. This is candidate design evidence, not a completed M3 implementation or scaling claim. The canonical `scene.json`, `oracle.json`, `calculations.json`, `metrics.json` and the M1.5 measurements below remain historical; none is presented as completed M3 evidence.

# M1.5 — construction-owned routing

Branch `feat/nested-wires-efficient`, based on `feat/nested-wires` / `266a96c`. No push or PR. The original Vite server remains on http://127.0.0.1:5188/roads-prototype.html?nested.

## Construction and route law

Scene construction records actual frame/grid crossings and driveway endpoints. A coordinate-keyed street registry resolves each event to its owners; it never enumerates road pairs. Each road's ordered junction/mouth events cut its lanes and register the lane endpoints. Junction merging sweeps events belonging to the same road. Lane connections consume those registered endpoints. The seven-node and two-node builders use the same compiler with their construction events.

Before routing, a measured `wire-registry` stage builds road-owned ordered crossings, node terminals and gate accesses. No route is cached or precomputed there. Each requested wire uses direct access/road lookups. `coverPath` assigns segments through their named road entries; endpoint ownership follows the registered crossings/mouths and the reserved track width. The independent inspector checks the named rectangle's actual bounds, orthogonality, node interiors, continuity and gate positions.

`pair()` is unchanged: band → shared road → quadrant corner. Ports, gate sequences, containment ownership and wire families match M1. Highways are selected only from shared registered crossings, minimizing travel within the same highway family. This shortens w06 from 1203 to 723 and w12 from 5974 to 5302; every other length is unchanged. Fixed 3-unit street-track spacing and exact driveway/gate centerlines remain. The complete scene excluding wiring (including all lane/junction/connection/example records) is byte-identical to `1716111:output/playwright/nested/scene.json`.

## Binary operation ceilings

The M1 definition is unchanged: one executed numeric +, subtraction, Math.abs or numeric comparison = one operation; Math.min/max charge n−1 comparisons. Multiplication, division, modulo, sqrt, identity/string comparisons, lookups, allocation and native collection iteration/sort internals are excluded. Sort comparator arithmetic is counted. The TypeScript AST meter instruments all reachable Layout core modules, compares both 22- and 44-node output with the normal public builder, and asserts the ceilings. It separately brackets every actual `lawLeg` execution, including rejected gate attempts. No arithmetic is moved into uninstrumented helpers.

| Wire | Before | After | Ceiling | Result |
|---|---:|---:|---:|---|
| w01 | 1010 | 13 | 60 | PASS |
| w02 | 1000 | 17 | 60 | PASS |
| w03 | 1072 | 17 | 60 | PASS |
| w04 | 1218 | 13 | 60 | PASS |
| w05 | 1356 | 17 | 60 | PASS |
| w06 | 4625 | 36 | 60 | PASS |
| w07 | 4871 | 34 | 60 | PASS |
| w08 | 1636 | 17 | 60 | PASS |
| w09 | 5228 | 28 | 120 | PASS |
| w10 | 7890 | 74 | 180 | PASS |
| w11 | 7272 | 43 | 120 | PASS |
| w12 | 11699 | 108 | 180 | PASS |
| Wire total | 48877 | 417 | 1200 | PASS |
| Lane compilation | 280133 | 11575 | 12000 | PASS |
| Road-pair discovery checks | 9453 | 0 | exactly 0 | PASS |

Maximum executed leg: **43 ≤ 60 operations**. Full per-leg traces, including failed attempts, are in `calculations.json`. Construction contacts, lane endpoint registration, connection paths and crossing demonstrations are included in the lane-compile measurement. One-time wire indexing is separately visible, not hidden from the report: **868 operations**. All other construction stages and the 44-node probe stages are retained in `metrics.json` under the explicit `before` / `after` comparison.

## Scaling probe and 100-node interpretation

The user clarified the probe: duplicate the **entire four-section, 22-node fixture**, using the same capacity/placement/road/compiler builders. `createNestedRoadScene({ copies: 2 })` produces exactly **44 nodes and eight sections**; sections 5–8 preserve the original nesting and are offset **1920 units south**. The world-road builder merges adjoining frame spans as usual. Measurements: **22 nodes = 11575 lane-compile operations; 44 nodes = 23597; ratio = 2.0386177105831536 ≤ 2.5**.

At 100 nodes the dominant number is approximately **52614 lane-compile operations** under a linear extrapolation of this repeated fixture. The construction/output work grows linearly because each added section contributes a bounded set of actual contacts, lane pieces and junction-local connections, rather than comparisons against every existing road. This is an estimate (`11575 × 100 / 22`), not a measured 100-node result or a universal linear-time claim: contact ordering and per-road event sorting retain an O(E log E) worst-case term. The measured twofold scene grew 2.0386×, with **zero** quadratic road-pair discovery. Denser junction degree or more containment legs changes the workload; the twelve-track allocation is still a bounded fixture policy.

## Independent oracle

`verify-oracle.py` constructs a rectilinear visibility graph from actual road rectangle boundaries and port axes. Streets are bidirectional across their full width; driveways are directed along their centerline through the exact owner ports. Wire coordinates refine the grid without removing alternatives. Dijkstra can choose different gates; it does not read the routing law, construction registry or selected route. This is stronger than a centerline-only oracle. Every reported path is within 10%, and no new path is longer than M1.

| Wire | Length | Oracle | Detour |
|---|---:|---:|---:|
| w01 | 144 | 144 | 0.0000% |
| w02 | 304 | 304 | 0.0000% |
| w03 | 304 | 304 | 0.0000% |
| w04 | 144 | 144 | 0.0000% |
| w05 | 144 | 144 | 0.0000% |
| w06 | 723 | 672 | 7.5893% |
| w07 | 717 | 672 | 6.6964% |
| w08 | 144 | 144 | 0.0000% |
| w09 | 576 | 576 | 0.0000% |
| w10 | 1912 | 1912 | 0.0000% |
| w11 | 656 | 656 | 0.0000% |
| w12 | 5302 | 4856 | 9.1845% |

## Browser and visual evidence

Five consecutive Chromium development loads at 1920×1440: **308.5, 250.4, 226.3, 218.3, 220.7 ms**. Median **226.3 ms ≤ 239.2 ms**. Measurement remains navigation start → fonts ready plus two animation frames, including the coverage audit. Every raw User Timing entry is in `browser.json`; no claim about GPU paint duration is made.

Regenerated and personally inspected `overview.png` and `w01.png`–`w12.png`, alongside the M1 overview and retained AWS/Docker references in `docs/agent-diagrams/visual-quality/References.md`. The four-section composition, nested S2, all ports and route families are preserved. The only visible route changes are the nearer highway for w06 and the nearer vertical crossing for w12. Their endpoints and arrows are fully visible. The overview contains all 22 nodes, 4 sections and 12 wires; each focused screenshot includes its complete route.

The new paths have **zero shared positive-length segments, zero self-overlaps, zero wire-label collisions and zero label/node collisions**. There is **one crossing in S2**, within the dense-map budget of six. Wire-label halo contrast is at least **5.89:1**, heading/body ratio **1.4875**. Road dividers and section borders remain contextual separators. Inherited sparse section padding and plain rectangular actors remain the frozen M1 fixture; this milestone does not claim the infographic imagery/panel-density bar. No reference assets were changed, and no subagents were used.

## Reproduce

Run from the repository root, leaving port 5188 running:

```sh
pnpm check
pnpm exec tsx apps/web/cli/verify-nested-wires.ts
pnpm exec tsx output/playwright/nested-wires/count-operations.mjs
pnpm exec tsx output/playwright/nested-wires/verify-invariants.mjs
python3 output/playwright/nested-wires/verify-static.py
python3 output/playwright/nested-wires/verify-oracle.py
python3 output/playwright/nested-wires/capture-browser.py
python3 output/playwright/nested-wires/verify-evidence.py
```

After deliberately replacing the five-load sample, update the timing paragraph and run `verify-evidence.py --write` to refresh the comparison. Its assertions enforce every numeric ceiling without rounding. `before.json` is the untouched M1 metrics from `266a96c`. `static-proof.txt` contains the grep commands/results and the unchanged-law assertion. `verification.txt` contains the acceptance output. `checks.txt` records the successful full gate: **208 tests, zero new test files**, with `capability/layout/tests/nested-wires.test.ts` deleted. All six valuable cases now run in the new committed `verify-invariants.mjs`: complete admission, determinism and four deliberate corruptions. Per-file standards evidence is in `source-review.md`.
