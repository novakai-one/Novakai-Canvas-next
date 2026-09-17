# M4.5 STOP — corrected lane-assignment scope still has an S1 lower bound of 14

The 2026-09-17 ORCHESTRATOR CORRECTION was applied to this feasibility audit.
Lane indices and derived pins are **not frozen**. Nevertheless, **DoD 3 cannot
hold**: frozen routes and right-hand traffic force at least **14** S1 crossings,
while the hard target is **<=11**. Implementation stopped under the brief's
explicit STOP rule. This is a lower bound, **not a claim that 14 is attainable**.

## Why reassignment cannot remove these 14

The immutable baseline is `0e5f21e:output/playwright/nested-wires/scene.json`.
Frozen road routes fix which junction arms each wire traverses. Right-hand
traffic fixes the relative order of opposite directions on each shared arm.
The audit lets every endpoint independently occupy **any pitch-6 position
fitting its traffic half**, including unused slots, with no requirement that
opposite ends of a road choose the same index or that wires use distinct slots.
This is strictly more freedom than a legal coordinated lane assignment.

For each certified pair, its four allowed endpoint ranges are disjoint and
alternate A/B/A/B clockwise. Two continuous paths joining alternating boundary
endpoints in a rectangle must intersect. The six rectangles are disjoint, so
their crossing lower bounds add. The audit does not assume M4 wire-ID order,
current terminal positions, the current bridge implementation, or a fixed
index at any endpoint. Same-direction ranges that can reorder are explicitly
rejected as certificates by a negative control.

| Junction | Forced pairs | Wires |
| --- | ---: | --- |
| J21 | 2 | w12/w24, w18/w24 |
| J36 | 2 | w21/w26, w22/w26 |
| J44 | 4 | w03/w09, w03/w24, w09/w23, w23/w24 |
| J46 | 2 | w03/w23, w15/w23 |
| J49 | 3 | w01/w09, w01/w24, w02/w24 |
| J50 | 1 | w09/w24 |
| **Total** | **14** | **Greater than 11** |

At the requested worst junction J21 `(500,212,72,72)`, four of the old six
witnesses are not certified by this stronger proof and may be removable.
However, `w24` still crosses `w12` and `w18`: its east-arm westbound endpoint
is above both eastbound endpoints, and its south exit interleaves with their
west entries. Reassigning either eastbound wire's index does not change this.
The obstruction is the sum across S1, not all six original J21 crossings.

## Reproduction and pasted output

`python3 output/playwright/nested-wires/verify-m45-topological-bound.py`

Expected **exit 1** is an explicit DoD 3 rejection, not a successful milestone.
The JSON includes full junction ids, bounds, allowed indices, allowed coordinates,
clockwise ranges, and individual justifications.

```text
PASS controls: disjoint ABAB accepted; reorderable ranges and AABB rejected
FORCED J21 w12/w24: w24:E[245.0,239.0,233.0,227.0,221.0,215.0] -> w12:E[251.0,257.0,263.0,269.0,275.0,281.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0] -> w12:W[251.0,257.0,263.0,269.0,275.0,281.0]
FORCED J21 w18/w24: w24:E[245.0,239.0,233.0,227.0,221.0,215.0] -> w18:E[251.0,257.0,263.0,269.0,275.0,281.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0] -> w18:W[251.0,257.0,263.0,269.0,275.0,281.0]
FORCED J36 w21/w26: w26:N[1037.0,1031.0] -> w21:E[1045.0,1039.0,1033.0,1027.0,1021.0,1015.0] -> w26:E[1051.0,1057.0,1063.0,1069.0,1075.0,1081.0] -> w21:W[1045.0,1039.0,1033.0,1027.0,1021.0,1015.0]
FORCED J36 w22/w26: w26:N[1037.0,1031.0] -> w22:E[1045.0,1039.0,1033.0,1027.0,1021.0,1015.0] -> w26:E[1051.0,1057.0,1063.0,1069.0,1075.0,1081.0] -> w22:W[1045.0,1039.0,1033.0,1027.0,1021.0,1015.0]
FORCED J44 w03/w09: w09:N[539.0,545.0,551.0,557.0,563.0,569.0] -> w03:E[645.0,639.0,633.0] -> w09:S[539.0,545.0,551.0,557.0,563.0,569.0] -> w03:W[645.0,639.0,633.0]
FORCED J44 w03/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0] -> w03:E[645.0,639.0,633.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0] -> w03:W[645.0,639.0,633.0]
FORCED J44 w09/w23: w09:N[539.0,545.0,551.0,557.0,563.0,569.0] -> w23:E[651.0,657.0,663.0] -> w09:S[539.0,545.0,551.0,557.0,563.0,569.0] -> w23:W[651.0,657.0,663.0]
FORCED J44 w23/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0] -> w23:E[651.0,657.0,663.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0] -> w23:W[651.0,657.0,663.0]
FORCED J46 w03/w23: w03:E[645.0,639.0,633.0] -> w23:E[651.0,657.0,663.0] -> w03:S[365.0,359.0,353.0] -> w23:W[651.0,657.0,663.0]
FORCED J46 w15/w23: w15:N[365.0,359.0] -> w23:E[651.0,657.0,663.0] -> w15:S[365.0,359.0,353.0] -> w23:W[651.0,657.0,663.0]
FORCED J49 w01/w09: w09:N[539.0,545.0,551.0,557.0,563.0,569.0] -> w01:E[451.0,457.0] -> w09:S[539.0,545.0,551.0,557.0,563.0,569.0] -> w01:W[451.0,457.0,463.0]
FORCED J49 w01/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0] -> w01:E[451.0,457.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0] -> w01:W[451.0,457.0,463.0]
FORCED J49 w02/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0] -> w02:N[539.0,545.0,551.0,557.0,563.0,569.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0] -> w02:W[451.0,457.0,463.0]
FORCED J50 w09/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0] -> w09:N[539.0,545.0,551.0,557.0,563.0,569.0] -> w24:E[851.0,857.0,863.0,869.0,875.0] -> w09:W[851.0,857.0,863.0]
PASS 6 disjoint junction rectangles; witness counts are additive
MEASURE section-1 unavoidable crossings >= 14; target <= 11
FAIL DoD 3: lane reassignment alone cannot meet S1 <= 11 with frozen routes and right-hand traffic
```

`node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs`

Exit **0**:

```text
PASS frozen nodes: byte-identical to 0e5f21e
PASS frozen sections: byte-identical to 0e5f21e
PASS frozen road ids + bounds: byte-identical to 0e5f21e
PASS frozen wire routes (ordered road sequences): byte-identical to 0e5f21e
PASS frozen gates: byte-identical to 0e5f21e
MEASURE per-wire lane-index diffs=0
PASS deterministic regeneration: two fresh scene serializations byte-identical
PASS current canonical scene matches fresh public builder: 24 nodes / 26 wires
PASS zero new tracked *.test.ts files
```

`pnpm check` — exit **0**; full output: [m45-check-output.txt](m45-check-output.txt).

```text
Typecheck, ESLint, Prettier and dependency-cruiser passed.
Test Files  70 passed (70)
     Tests  208 passed (208)
```

## Every DoD item

FAIL below means the requested item was not delivered, including explicit
not-run items after the STOP. No historical performance or browser output is
presented as a fresh M4.5 run.

| DoD | Status | Evidence / reason |
| --- | --- | --- |
| 1 | PASS | `pnpm check` exit 0, 70 files / 208 tests; zero new `*.test.ts` files. Only standalone audits and documentation added. |
| 2 | PASS | Structural verifier exit 0 against immutable M4: nodes, sections, road ids+bounds, ordered wire road sequences, gates; lane-index diffs 0. |
| 3 | **FAIL — impossible** | Certified S1 lower bound 14 > 11 even allowing spare lane slots independently. Baseline remains S1=28, S2=4, S3=2, S4=4, world=8; budgeted=0. These unchanged counts are baseline evidence, not a new reduced scene. |
| 4 | FAIL — not rerun after STOP | `verify-lanes.mjs`, `verify-invariants.mjs`, and M4 budget verifier not rerun. Fresh full scene byte identity and regeneration determinism passed. |
| 5 | FAIL — not rerun after STOP | No fresh operation-count run; no production algorithm changed. |
| 6 | FAIL — not rerun after STOP | No five-load measurement or 48-node probe run. |
| 7 | FAIL — not rerun after STOP | No browser session opened; unchanged selection runner not rerun. |
| 8 | FAIL — not produced after STOP | No improved scene exists; no before/after or M4.5 overview screenshots fabricated. |
| 9 | FAIL — no new traversal evidence | Canonical scene/oracle/calculations/metrics remain M4. README records this STOP. |
| 10 | FAIL — full condition not met | Correct branch, local evidence commits; working tree retains two pre-existing selection-evidence edits. They were not overwritten or committed. |

## Workspace and next constraint decision

No production code, canonical geometry, routing law, or approved reference image
changed. No push, PR, subagent, real-browser interaction, or Vite restart/kill.
The two already-dirty files at task entry remain untouched:

```text
 M output/playwright/nested-wires/m4-selection-output.txt
 M output/playwright/nested-wires/m4-selection.json
```

A feasible revised brief must relax the frozen routes or right-hand traffic,
or raise the S1 ceiling to **at least 14**. Raising it to 14 alone is not proven
sufficient: other ordering constraints could impose a larger minimum.
The current <=11 target was not weakened and no implementation is claimed.
