# M4.5 STOP — corrected S1 ceiling 16 is below the certified floor 17

The original independent-endpoint lower bound **14 stands**. A stronger second
layer finds **three additional crossings** forced by incompatible orders along
shared roads. Therefore **S1 >= 17 > 16**, under the retained per-road lane model.
The corrected target was applied exactly; the withdrawn <=11 gate is gone.
Implementation stopped under the brief's explicit STOP rule. **M4.5 is not done.**

The achieved scene remains **S1=28, S2=4, S3=2, S4=4, world=8; J21=6**.
No lane-assignment implementation or geometry change was made. This is an
impossibility certificate, not a failed heuristic search or a claim that 17 is
attainable. Current S1 certificate coverage is 17/28; **11 S1 crossings remain
uncertified**, so zero-uncertified acceptance is also explicitly unmet.

## Why the additional three are unavoidable

A wire has one assigned lane index on each road. The standing lane verifier
checks every lane-bearing segment against that one constant centerline.
Reassigning that index and its derived pins is allowed; changing relative order
between two junctions on the same road is not possible without a lane change.
This is the existing per-road assignment invariant, not frozen M4 wire-ID order.

1. **w02/w09:** let H mean w02 has the smaller index on
   `section-1:horizontal:248:200`, and V mean the same on
   `section-1:vertical:536:248`. Avoiding their crossing at J21 requires H=V;
   avoiding J22 requires H=false; avoiding J49 requires V=true.
   All three cannot hold. At least **one** crossing occurs in J21/J22/J49.
   With J21's ceiling already consumed by its two original forced pairs, that
   extra crossing must be at J22 or J49.
2. **w10/w21:** on `section-1:horizontal:1048:200`, avoiding J37 requires
   w10's index < w21's; avoiding J38 requires the reverse. At least **one**.
3. **w16/w21:** the same incompatible requirements at J37 and J38. At least **one**.

These three wire pairs are distinct from every pair in the original 14
certificates. The verifier checks rectangle disjointness within each counted
pair and pair disjointness between proof layers. Counts therefore add:
**14 + 1 + 1 + 1 = 17**. Coincident multi-wire crossings would still count by
wire pair under the unchanged crossing metric.

The updated prover discovers constraints from boundary events, rather than
hard-coding these wire IDs/junctions. It enumerates every Boolean road-pair
order, relaxing transitivity between three or more wires. A separate control
enumerates **1,530 legal physical-slot combinations**, including spare slots,
to validate that rank magnitudes cannot change those truth tables. Negative
controls reject compatible requirements and independently reorderable roads.
The current scene hash and complete endpoint ranges/tables are in
[m45-topological-bound.json](m45-topological-bound.json). Immutable M4 boundary
arms are checked; no M4 lane index is frozen. All enumeration is offline proof
work, never application routing-time search.

## Every DoD item

FAIL includes explicitly unperformed work after STOP; historical output is not
presented as a fresh M4.5 performance/browser measurement.

| DoD | Status | Fresh evidence / reason |
| --- | --- | --- |
| 1 | PASS | `pnpm check` exit 0: 70 files, 208 tests. Zero new `*.test.ts` files. |
| 2 | PASS | Structural verifier exit 0: nodes, sections, road ids+bounds, wire road sequences, gates byte-identical to 0e5f21e; lane-index diffs 0; deterministic complete serialization. |
| 3 | **FAIL — impossible under constant per-road lanes** | Prover exit 1: certified floor 17 >16. Actual S1=28 and J21=6. Other totals unchanged, budgeted=0. Eleven current S1 crossings lack certificates. |
| 4 | PASS for unchanged scene | Fresh lane, invariant, and budget runs exit 0; containment, distinct pins, planar fans, no overlap, right-hand lanes, deterministic regeneration. The invariant runner's legacy negative controls exercise 18 wires; the lane runner checks the full unchanged 26-wire scene. |
| 5 | FAIL — not rerun after STOP | No new operation-count or stage-count evidence. No production algorithm changed. |
| 6 | FAIL — not rerun after STOP | No five-load sample or 48-node growth probe. |
| 7 | FAIL — not rerun after STOP | No browser opened; selection runner unchanged. |
| 8 | FAIL — not produced after STOP | No improved geometry exists; no M4.5 screenshots fabricated. |
| 9 | FAIL — no new traversals | Canonical scene/oracle/calculations/metrics retained as M4; current full scene identity verified. README records new counts and STOP. |
| 10 | FAIL — clean-tree condition unmet | Correct branch; proof/report committed in logical slices. Two inherited M4 selection-evidence edits remain untouched and uncommitted. |

## Pasted output

`python3 output/playwright/nested-wires/verify-m45-topological-bound.py` — **exit 1**:

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
PASS linked-order controls: opposite requirements force 1; compatible orders and independent roads force 0
PASS current canonical scene boundary arms agree with immutable M4; no baseline indices frozen
FORCED-LINKED w02/w09 >= 1: J21, J22, J49
  ORDER {"assignment": {"section-1:horizontal:248:200": false, "section-1:vertical:536:248": false}, "crossings": 1, "mandatoryCrossingsAt": ["J49"]}
  ORDER {"assignment": {"section-1:horizontal:248:200": false, "section-1:vertical:536:248": true}, "crossings": 1, "mandatoryCrossingsAt": ["J21"]}
  ORDER {"assignment": {"section-1:horizontal:248:200": true, "section-1:vertical:536:248": false}, "crossings": 3, "mandatoryCrossingsAt": ["J21", "J22", "J49"]}
  ORDER {"assignment": {"section-1:horizontal:248:200": true, "section-1:vertical:536:248": true}, "crossings": 1, "mandatoryCrossingsAt": ["J22"]}
FORCED-LINKED w10/w21 >= 1: J37, J38
  ORDER {"assignment": {"section-1:horizontal:1048:200": false}, "crossings": 1, "mandatoryCrossingsAt": ["J37"]}
  ORDER {"assignment": {"section-1:horizontal:1048:200": true}, "crossings": 1, "mandatoryCrossingsAt": ["J38"]}
FORCED-LINKED w16/w21 >= 1: J37, J38
  ORDER {"assignment": {"section-1:horizontal:1048:200": false}, "crossings": 1, "mandatoryCrossingsAt": ["J37"]}
  ORDER {"assignment": {"section-1:horizontal:1048:200": true}, "crossings": 1, "mandatoryCrossingsAt": ["J38"]}
PASS exhaustive rank-magnitude control: 1530 legal physical-slot combinations match linked truth tables
PASS additive certificates: 14 independent-endpoint + 3 linked-road-order
MEASURE section-1 unavoidable crossings >= 17; corrected target <= 16
FAIL DoD 3: certified lower bound 17 > 16 with frozen routes, right-hand traffic, and constant road lanes
```

`node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs` — **exit 0**:

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

`pnpm check` — **exit 0**. Typecheck, lint, format and architecture gates passed.
Full output: [m45-check-output.txt](m45-check-output.txt).

```text
Test Files  70 passed (70)
     Tests  208 passed (208)
```

`node output/playwright/nested-wires/verify-lanes.mjs` — **exit 0**:

```text
PASS DoD 2: tracked source, ok=true, wires=18; exact six addendum pairs
PASS DoD 2: w10/w16 gates=["section-2:exit-bottom","section-1:exit-bottom","section-4:entry-top"]
PASS DoD 2: w11/w17 gates=["section-3:exit-right","section-4:entry-left"]
PASS DoD 2: w12/w18 gates=["section-3:exit-bottom","section-1:entry-left","section-2:entry-top"]
PASS DoD 3c: w04/w13 shared=["drive:node-5:exit-right"]; required>=1
PASS DoD 3c: w07/w14 shared=["drive:node-11:exit-right"]; required>=1
PASS DoD 3c: w01/w15 shared=["drive:node-1:exit-right"]; required>=1
PASS DoD 3c: w10/w16 shared=["drive:section-2:exit-bottom","section-1:horizontal:1048:368","drive:section-1:exit-bottom","world:horizontal:1184:64","drive:section-4:entry-top"]; required>=2
PASS DoD 3c: w11/w17 shared=["drive:node-16:exit-right","section-3:vertical:1208:1368","drive:section-3:exit-right","drive:section-4:entry-left","section-4:vertical:1480:1368"]; required>=2
PASS DoD 3c: w12/w18 shared=["section-3:vertical:536:1368","drive:node-12:exit-bottom","section-3:horizontal:1608:200","section-3:horizontal:1848:200","drive:section-3:exit-bottom","world:horizontal:1984:64","world:vertical:64:64","drive:section-1:entry-left","section-1:vertical:368:248","section-1:horizontal:248:368","drive:section-2:entry-top","section-2:horizontal:432:1176"]; required>=2
PASS DoD 3g: complete scene regeneration is byte-identical
PASS 3b node-1:exit-right: order=w01,w15; exact pins=[{"x":632,"y":445},{"x":632,"y":451}]; pitch=6; centered
PASS 3b node-5:exit-right: order=w04,w13; exact pins=[{"x":1440,"y":549},{"x":1440,"y":555}]; pitch=6; centered
PASS 3b node-11:exit-right: order=w07,w14; exact pins=[{"x":464,"y":1485},{"x":464,"y":1491}]; pitch=6; centered
PASS 3b node-12:exit-bottom: order=w12,w18; exact pins=[{"x":707,"y":1536},{"x":701,"y":1536}]; pitch=6; centered
PASS 3b node-16:exit-right: order=w11,w17; exact pins=[{"x":1136,"y":1725},{"x":1136,"y":1731}]; pitch=6; centered
PASS 3b node-18:entry-top: order=w10,w17; exact pins=[{"x":1987,"y":1440},{"x":1981,"y":1440}]; pitch=6; centered
PASS 3b complete default serialization equals immutable M3 plus ONLY the six exact computed terminal fans; every other byte preserved
PASS 3a every assigned road/driveway lane distinct; actual centrelines match the assignment; shared gate positions distinct inside mouths
PASS 3b opposite directions occupy opposite sides; same-direction lanes stack outward in wire-ID order at pitch 6
PASS 3d every road and every node/gate driveway width = 12 + 12 × lane count
PASS 3e no road/driveway node overlap; streets respect boundaries; only registered junctions overlap; all wire containment, terminal and gate-lane invariants
PASS 3a global segment audit: zero same-axis overlap or parallel touch; perpendicular junction crossings only; NO shared terminal exemption
PASS 3g two complete scene JSON serialisations are byte-identical
PASS M4 exactly 24 nodes / 26 wires; six hub imports and two api exports
PASS hub capacity: drive:node-23:entry-left; lanes=4; width=60; order=w20,w21,w22,w24
PASS M4 hub driveway >=3 lanes, width = 12 + 12*lanes, arrival lane order ascending
PASS M4 every terminal and node driveway belongs to its own source/target
PASS M4 hub entry driveways never merge and form planar fans to distinct pins
WITNESS w20/w21 final stems: null
PASS M4 hub final stems have no positive-length overlap
PASS 3c/d all pin rows exact, centered, ordered, pitch 6, >=6 end margins; 192x96 nodes; single-wire pins unchanged; globally unique terminals
PASS DoD 9 canonical scene matches full regenerated M4 serialization
PASS exemption controls: registered perpendicular only; >=60 threshold; outside/shallow/overlap retained; ceiling rejects 7
MEASURE all crossings per section: {"section-1": 28, "section-2": 4, "section-3": 2, "section-4": 4, "world": 8}
MEASURE junction crossings per section (health metric, no M4 ceiling): {"section-1": 28, "section-2": 4, "section-3": 2, "section-4": 4, "world": 8}
MEASURE budgeted crossings per section (ceiling <=6): {"section-1": 0, "section-2": 0, "section-3": 0, "section-4": 0, "world": 0}
PASS DoD 3f retained crossing-budget gate under ruling #3; legal junction crossings reported, excluded with reasons
PASS DoD 3f amended visual crossing budget
```

`node --import tsx output/playwright/nested-wires/verify-invariants.mjs` — **exit 0**:

```text
PASS retained six fixture cases: 18-wire admission, determinism, off-road rejection, node-body rejection, nongate rejection, disconnected-path rejection.
PASS gate mouth refinement: wrong lane inside the permitted mouth is rejected; exact assigned lanes accepted.
```

## Workspace and constraints

No production code, route law, canonical scene geometry, reference image, or
selection runner changed. No push, PR, subagent, browser, Vite restart or kill.
HTTP health check of port 5188 returned **200**.
The original two working-tree modifications remain untouched:

```text
 M output/playwright/nested-wires/m4-selection-output.txt
 M output/playwright/nested-wires/m4-selection.json
```

A feasible next brief needs to account for the stronger floor or explicitly
change the constant-per-road lane model. **17 is only a lower bound, not a
promise of attainability.** No target or invariant has been silently relaxed.
