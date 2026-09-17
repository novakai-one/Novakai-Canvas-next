# M4 STOP — terminal ruling resolved; retained visual crossing budget fails

2026-09-17, `feat/fan-in-hub`, HEAD `2f9b762`. **Not complete. No new commits, push or PR.**

All six corrected terminal exceptions are implemented and exactly verified. All 26 wires route, no wires share a terminal, every fan is planar, node size is unchanged, and the default scene differs from immutable M3 evidence only by the six computed terminal fans. The geometric global segment audit passes with **no shared-terminal exemption**. The prior STOPs are resolved.

The remaining failure is the existing visual acceptance budget, not pin capacity or routing-law coverage. The repository AGENTS requires the benchmark gates in `docs/maintenance/diagram-quality-improvements.md`, which say:

> Edge crossings budgeted per section (dense map: ≤ 6; simple flows: 0–1).

The previous milestone's `verify-m3-evidence.py` enforces that exact ceiling. M4 DoD 3a retains all M3 checks. The new brief says perpendicular junction crossings are legal, but does not explicitly retire this separate numerical quality ceiling. Legal junction geometry passes; the inherited quality budget fails. I did not silently delete or relax that gate.

## Failing output and scope of proof

`python3 output/playwright/nested-wires/verify-m4-visual-budget.py` exits **1**:

```text
MEASURE retained M3 crossing budget <=6 per section: {"section-1": 28, "section-2": 4, "section-3": 2, "section-4": 4, "world": 8}
WITNESS section-1: 28 alternating-boundary wire pairs at registered junctions
AssertionError: FAIL inherited visual crossing budget: {'section-1': 28, 'section-2': 4, 'section-3': 2, 'section-4': 4, 'world': 8}; ceiling=6
```

Full output enumerates all 28 witnesses in [m4-visual-budget-output.txt](m4-visual-budget-output.txt); coordinates, junction bounds and pair order are in [m4-visual-budget.json](m4-visual-budget.json).

The witness derives where each routed wire crosses a junction rectangle boundary and checks for four distinct alternating endpoints, A/B/A/B. Any continuous paths joining those endpoints inside that junction must intersect. All 28 S1 pairs satisfy this condition. For example, at junction bounds `(500,212,72,72)`, w02/w12, w02/w18, w09/w12, w09/w18, w12/w24 and w18/w24 alternate. Other junctions supply further independent mandatory intersections. Shuffling pin bends cannot remove these intersections while keeping the same lane approaches.

This does **not** prove every possible placement or broader routing policy impossible. It proves the current law/placement/lane assignment cannot pass the inherited budget by adjusting local junction geometry. A further placement/routing decision, or an explicit M4 exception to the numeric crossing budget, is needed. Neither changing pins again nor weakening overlap checks addresses this blocker.

## Binary DoD report

| Item | Status | Evidence |
| --- | --- | --- |
| 1 | **PASS** | `pnpm check` exits 0, 70 files / 208 tests; no new or modified `.test.ts` files. |
| 2 | **PASS** | `ok=true`, 24 nodes / 26 wires, exact w19–w24 into node-23 and w25/w26 out of node-24. |
| 3 | **FAIL aggregate** | All updated lane, ownership, distinct-pin, planar-fan, exact preservation, determinism and oracle checks PASS. The retained M3 visual crossing-budget check fails as above. |
| 4 | **PASS** | Routing 992 ≤1,000; max leg 41 ≤60; lane allocation + registry compilation 16,376 ≤20,000; road-pair discovery 0; every stage once. |
| 5 | **PASS** | Headless median 246.6 ms ≤300; 24/48-node full-op clone 22,800→40,813 =1.7900438596× ≤2.5. |
| 6 | **PASS** | Every selection item, hub/api neighborhoods, hidden labels, geometry/camera preservation and zero-recalc counter PASS. Separate headless timing median 248.7 ms. |
| 7 | **PASS candidate summary** | README appended with all measurements, oracle table, complexity/cost extrapolation, finite pin capacity and explicit STOP status. |
| 8 | **FAIL visual acceptance** | Three required headless screenshots exist and were personally inspected. The roads-off hub **does read as an organised fan, not a knot**, but the whole scene fails the retained crossing budget. |
| 9 | **FAIL incomplete** | All four 26-wire candidate JSON artifacts exist; accepted canonical M3 files were not replaced after the visual STOP. |
| 10 | **FAIL incomplete** | Correct branch, but candidate edits remain uncommitted and working tree is not clean. No completion commits were made. |

Full source-score review was not completed after this STOP; no >144/160 score or finished architecture acceptance is claimed for the candidate. The full executable gate does enforce Sonar ≤2 and capability imports and is green. No exception was added to lint, tests or routing inspection.

## Pasted passing outputs

```text
 Test Files  70 passed (70)
      Tests  208 passed (208)
```

The test-file inventory commands both return empty output:

```sh
git diff --name-only -- '*.test.ts'
git ls-files --others --exclude-standard -- '*.test.ts'
```

```text
PASS 3b node-1:exit-right: order=w01,w15; exact pins=[{"x":632,"y":445},{"x":632,"y":451}]; pitch=6; centered
PASS 3b node-5:exit-right: order=w04,w13; exact pins=[{"x":1440,"y":549},{"x":1440,"y":555}]; pitch=6; centered
PASS 3b node-11:exit-right: order=w07,w14; exact pins=[{"x":464,"y":1485},{"x":464,"y":1491}]; pitch=6; centered
PASS 3b node-12:exit-bottom: order=w12,w18; exact pins=[{"x":707,"y":1536},{"x":701,"y":1536}]; pitch=6; centered
PASS 3b node-16:exit-right: order=w11,w17; exact pins=[{"x":1136,"y":1725},{"x":1136,"y":1731}]; pitch=6; centered
PASS 3b node-18:entry-top: order=w10,w17; exact pins=[{"x":1987,"y":1440},{"x":1981,"y":1440}]; pitch=6; centered
PASS 3b complete default serialization equals immutable M3 plus ONLY the six exact computed terminal fans; every other byte preserved
PASS M4 exactly 24 nodes / 26 wires; six hub imports and two api exports
PASS hub capacity: drive:node-23:entry-left; lanes=4; width=60; order=w20,w21,w22,w24
PASS 3a global segment audit: zero same-axis overlap or parallel touch; perpendicular junction crossings only; NO shared terminal exemption
PASS 3c/d all pin rows exact, centered, ordered, pitch 6, >=6 end margins; 192x96 nodes; single-wire pins unchanged; globally unique terminals
PASS routing total=992 <=1000; maximum law leg=41 <=60
PASS lane allocation + registry compilation=16376 <=20000; components={"wire-registry":928,"lane-allocation":1414,"network":11021,"lane-projection":3013}
PASS per-wire road-pair discovery checks=0
PASS 24/48 nodes: total ops=22800/40813; growth=1.7900438596491228 <=2.5; byte-identical instrumented scenes
PASS one-way pipeline: every recorded construction/allocation/projection stage executes exactly once
PASS M4 five loads=[299.1999999284744, 246.60000002384186, 246.20000004768372, 250.29999995231628, 241.39999997615814]; median=246.600 ms; M2=243.7 ms; ceiling=300 ms
PASS 24 nodes, 26 wires, one layout calculation; three M4 screenshots captured
PASS hub node-23: exactly w19–w24 and their six sources secondary; no labels
PASS 3/hub layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS api node-24: exactly w25/w26 and node-8/node-20 secondary; no labels
PASS 3/api layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS M4 timing loads=[297.39999997615814, 248.20000004768372, 247.29999995231628, 248.69999992847443, 252.39999997615814]; median=248.700 ms <=300; M2=243.7 ms
PASS w19: length=322; oracle=310; detour=3.8710%
PASS w20: length=168; oracle=156; detour=7.6923%
PASS w21: length=2865; oracle=2763; detour=3.6916%
PASS w22: length=2038; oracle=1978; detour=3.0334%
PASS w23: length=3333; oracle=3285; detour=1.4612%
PASS w24: length=4825; oracle=4663; detour=3.4742%
PASS w25: length=639; oracle=621; detour=2.8986%
PASS w26: length=2340; oracle=2274; detour=2.9024%
```

Complete output, including all wire counts and unchanged selection assertions: [m4-verification.txt](m4-verification.txt). The independent oracle flags existing w02 at 10.3576% on the allowed re-gridded scene; no new wire exceeds 10%.

## Evidence and workspace retained

- `m4-candidate-scene.json`, `m4-candidate-oracle.json`, `m4-candidate-calculations.json`, `m4-candidate-metrics.json` retain the current candidate; metrics explicitly say STOP.
- `scene.json`, `oracle.json`, `calculations.json`, `metrics.json` remain byte-identical to accepted M3 evidence at `2f9b762`.
- `m4-overview.png`, `m4-hub-closeup.png`, `m4-roads-off.png` are the inspected candidate screenshots. Roads-off is a real headless checkbox interaction.
- Previous uncommitted edits were built upon; the four pre-existing selection PNG changes were retained untouched.
- Original Vite listener remains PID 13216 on 127.0.0.1:5188. Browser sessions were headless and closed by their runners. No real browser was touched.

`git log --oneline -6`:

```text
2f9b762 test(layout): run selection verification headless
5aeb348 docs(layout): publish M3 capacity metrics screenshots and verification evidence
b8223f1 test(layout): verify M3 lane geometry operations and selection topology
9b955b5 feat(layout): allocate directional wire lanes and size final corridors from demand
e84df66 docs(layout): preserve lane candidate and straight-junction STOP evidence
f81368e test(layout): correct M3 parallel-sharing topology expectation
```
