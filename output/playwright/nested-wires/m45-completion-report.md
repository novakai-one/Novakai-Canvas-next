# M4.5 completion report — final ruling, 2026-09-17

**PASS: S1 18, J21 2, budgeted 0, uncertified 0.** The 17-crossing S1 bound remains accepted and unchanged (14 independent endpoints + the three linked-road-order certificates). All 23 actual crossings across the complete scene are certified; two additional linked certificates span S1/S2 and do not claim a stronger S1-only floor.

The exact 24-node/26-wire fixture is retained. No routing-law, node, section, road-ID/bounds, route or gate change. The only geometry changes are assigned lanes, their derived terminal rows, and junction traversals. The same pipeline runs once; no backtracking, rerouting or per-junction ID tuning.

| DoD | Status | Evidence |
|---|---|---|
| 1 | PASS | `pnpm check` exit 0; 70 files / 208 tests; zero new `.test.ts`; source scores 146–152/160; Sonar ≤2. |
| 2 | PASS | All frozen fields byte-identical to `0e5f21e`; all 37 per-wire lane-index changes printed below; fresh deterministic canonical scene. |
| 3 | PASS | S1 28→18; J21 6→2; S2 4→2; S3 2→0; S4 4→3; world 8→0. Budgeted 0 everywhere. **23 certified, 0 uncertified**. |
| 4 | PASS | Lanes, exact pins, planar fans, zero same-axis overlap/touch, containment, corruption controls and byte determinism; 865 nonjunction/nonterminal intervals on exact assigned lanes. |
| 5 | PASS | Routing 992≤1050; allocation+registry/geometry compile 19683≤20000; road-pair discovery 0; every stage exactly once. |
| 6 | PASS | Five loads and 284.200 ms median below; 24/48 clone operations 26107/44120, 1.6899682077603708×≤2.5. |
| 7 | PASS | **Unchanged** M4 selection runner, all assertions pass; each interaction counter 1→1, geometry/camera unchanged. |
| 8 | PASS | Required overview, roads-off and before/after PNGs generated headlessly and personally inspected; baseline polylines verified against immutable M4. See `m45-visual-review.md`. |
| 9 | PASS | `scene.json`, `oracle.json`, `calculations.json`, `metrics.json` regenerated and reconciled; README updated. |
| 10 | PASS after publication check | Local `feat/lane-continuity` sliced commits; final clean-status and `git log --oneline -4` printed by `verify-m45-evidence.py --final` after committing this report, and pasted in the delivery response. Both original proof commits remain ancestors. |

Timing is a complete five-load batch, not selected samples. The failed 312.6 ms development batch is retained in `m45-browser-attempts.json`. Final browser work ran after source changes and full checks. Clone growth doubles scene nodes, retaining the specified 26 requests; it is not a dense-traffic scaling guarantee.

The corrected brief permits lane/pin reordering. Only the old verifier assumptions that required wire-ID lane order or frozen derived pins were replaced; exact row equations, fan planarity, margins, physical centers, containment and corruption controls remain. The historical M4 pin-preservation verifier remains untouched. The M4 selection runner and browser assertion source are byte-identical to M4.

No push, PR, subagent, real-browser attachment, headed browser, Vite restart or port-5188 termination. The two pre-existing modified selection output files were backed up under `.local/m45/` before the requested unchanged runner regenerated them.

## Pasted output

### 1 — pnpm check (exit 0)

```text
pnpm check exited 0: typecheck, lint, formatting, architecture and tests passed.
(Use `node --trace-warnings ...` to show where the warning was created)

 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  15:07:39
   Duration  21.43s (tests 75%, import 14%, transform 9%, environment 2%)
```

### 2 — frozen structure, all lane diffs, determinism

```text
PASS frozen nodes: byte-identical to 0e5f21e
PASS frozen sections: byte-identical to 0e5f21e
PASS frozen road ids + bounds: byte-identical to 0e5f21e
PASS frozen wire routes (ordered road sequences): byte-identical to 0e5f21e
PASS frozen gates: byte-identical to 0e5f21e
LANE w02 drive:node-1:exit-right: 1 -> 0
LANE w01 drive:node-1:exit-right: 0 -> 1
LANE w09 section-1:vertical:536:248: 1 -> 0
LANE w02 section-1:vertical:536:248: 0 -> 1
LANE w12 section-1:horizontal:248:200: 2 -> 0
LANE w18 section-1:horizontal:248:200: 3 -> 1
LANE w09 section-1:horizontal:248:200: 1 -> 2
LANE w02 section-1:horizontal:248:200: 0 -> 3
LANE w19 drive:node-2:exit-bottom: 1 -> 0
LANE w03 drive:node-2:exit-bottom: 0 -> 1
LANE w13 drive:node-5:exit-right: 1 -> 0
LANE w04 drive:node-5:exit-right: 0 -> 1
LANE w13 section-2:vertical:1680:432: 1 -> 0
LANE w06 section-2:vertical:1680:432: 0 -> 1
LANE w13 section-2:vertical:2016:432: 1 -> 0
LANE w06 section-2:vertical:2016:432: 0 -> 1
LANE w12 drive:section-2:entry-top: 1 -> 0
LANE w18 drive:section-2:entry-top: 2 -> 1
LANE w09 drive:section-2:entry-top: 0 -> 2
LANE w18 section-2:horizontal:432:1344: 1 -> 0
LANE w09 section-2:horizontal:432:1344: 0 -> 1
LANE w22 drive:section-2:exit-bottom: 2 -> 1
LANE w16 drive:section-2:exit-bottom: 1 -> 2
LANE w17 drive:node-16:exit-right: 1 -> 0
LANE w11 drive:node-16:exit-right: 0 -> 1
LANE w17 section-3:vertical:1208:1368: 1 -> 0
LANE w11 section-3:vertical:1208:1368: 0 -> 1
LANE w23 drive:section-3:exit-right: 2 -> 0
LANE w11 drive:section-3:exit-right: 0 -> 2
LANE w17 drive:section-4:entry-left: 1 -> 0
LANE w11 drive:section-4:entry-left: 0 -> 1
LANE w17 section-4:vertical:1480:1368: 1 -> 0
LANE w11 section-4:vertical:1480:1368: 0 -> 1
LANE w24 drive:node-23:entry-left: 3 -> 0
LANE w20 drive:node-23:entry-left: 0 -> 1
LANE w21 drive:node-23:entry-left: 1 -> 2
LANE w22 drive:node-23:entry-left: 2 -> 3
MEASURE per-wire lane-index diffs=37
PASS deterministic regeneration: two fresh scene serializations byte-identical
PASS current canonical scene matches fresh public builder: 24 nodes / 26 wires
PASS zero new tracked *.test.ts files
```

### 3 — full bound and every remaining crossing certificate

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
PASS additive S1 certificates: 14 independent-endpoint + 3 linked-road-order
MEASURE section-1 unavoidable crossings >= 17; accepted target <= 20
PASS certification negative controls: unknown pair and duplicate crossing rejected
CERTIFIED J49 w01/w09 at [539.0, 457.0]: endpoint-alternation
CERTIFIED J49 w01/w24 at [533.0, 457.0]: endpoint-alternation
CERTIFIED J49 w02/w09 at [539.0, 449.5]: linked-road-order
CERTIFIED J49 w02/w24 at [533.0, 449.5]: endpoint-alternation
CERTIFIED J44 w03/w09 at [539.0, 645.0]: endpoint-alternation
CERTIFIED J46 w03/w23 at [365.0, 651.0]: endpoint-alternation
CERTIFIED J44 w03/w24 at [533.0, 645.0]: endpoint-alternation
CERTIFIED J81 w05/w06 at [1845.0, 675.0]: endpoint-alternation
CERTIFIED J60 w09/w18 at [1509.0, 429.0]: linked-road-order
CERTIFIED J44 w09/w23 at [539.0, 651.0]: endpoint-alternation
CERTIFIED J50 w09/w24 at [534.5, 849.5]: endpoint-alternation
CERTIFIED J38 w10/w21 at [1845.0, 1033.0]: linked-road-order
CERTIFIED J134 w11/w26 at [1477.0, 1591.5]: endpoint-alternation
CERTIFIED J21 w12/w24 at [533.0, 251.0]: endpoint-alternation
CERTIFIED J46 w15/w23 at [359.0, 651.0]: endpoint-alternation
CERTIFIED J121 w16/w17 at [1645.0, 1371.0]: endpoint-alternation
CERTIFIED J38 w16/w21 at [1833.0, 1033.0]: linked-road-order
CERTIFIED J38 w16/w22 at [1833.0, 1027.0]: linked-road-order
CERTIFIED J134 w17/w26 at [1477.0, 1585.5]: endpoint-alternation
CERTIFIED J21 w18/w24 at [533.0, 257.0]: endpoint-alternation
CERTIFIED J36 w21/w26 at [1038.5, 1033.0]: endpoint-alternation
CERTIFIED J36 w22/w26 at [1038.5, 1027.0]: endpoint-alternation
CERTIFIED J44 w23/w24 at [533.0, 651.0]: endpoint-alternation
MEASURE crossings={'section-1': 18, 'section-2': 2, 'section-3': 0, 'section-4': 3, 'world': 0}; J21=2; budgeted={'section-1': 0, 'section-2': 0, 'section-3': 0, 'section-4': 0, 'world': 0}
MEASURE certified=23; uncertified=0; global floor=23
PASS DoD 3: all ceilings, budgeted zero, ZERO uncertified crossings
```

### 4 — lane and pin/fan checks

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
PASS M4.5 derived pins: 18 wires; 30 exact centered rows in assigned lane order; pitch 6
PASS M4.5 derived pins: 26 wires; 37 exact centered rows in assigned lane order; pitch 6
PASS 3a every assigned road/driveway lane distinct; actual centrelines match the assignment; shared gate positions distinct inside mouths
PASS 3b opposite directions occupy opposite sides; same-direction lanes stack outward in junction-aware assigned order at pitch 6
PASS 3d every road and every node/gate driveway width = 12 + 12 × lane count
PASS 3e no road/driveway node overlap; streets respect boundaries; only registered junctions overlap; all wire containment, terminal and gate-lane invariants
PASS 3a global segment audit: zero same-axis overlap or parallel touch; perpendicular junction crossings only; NO shared terminal exemption
PASS 3g two complete scene JSON serialisations are byte-identical
PASS M4 exactly 24 nodes / 26 wires; six hub imports and two api exports
PASS hub capacity: drive:node-23:entry-left; lanes=4; width=60; order=w24,w20,w21,w22
PASS M4 hub driveway >=3 lanes, width = 12 + 12*lanes, assigned arrival ranks contiguous
PASS M4 every terminal and node driveway belongs to its own source/target
PASS M4 hub entry driveways never merge and form planar fans to distinct pins
WITNESS w20/w21 final stems: null
PASS M4 hub final stems have no positive-length overlap
PASS 3c/d all pin rows exact, centered, ordered, pitch 6, >=6 end margins; 192x96 nodes; single-wire pins unchanged; globally unique terminals
PASS DoD 9 canonical scene matches full regenerated M4 serialization
PASS exemption controls: registered perpendicular only; >=60 threshold; outside/shallow/overlap retained; ceiling rejects 7
MEASURE all crossings per section: {"section-1": 18, "section-2": 2, "section-3": 0, "section-4": 3, "world": 0}
MEASURE junction crossings per section (health metric, no M4 ceiling): {"section-1": 18, "section-2": 2, "section-3": 0, "section-4": 3, "world": 0}
MEASURE budgeted crossings per section (ceiling <=6): {"section-1": 0, "section-2": 0, "section-3": 0, "section-4": 0, "world": 0}
PASS DoD 3f retained crossing-budget gate under ruling #3; legal junction crossings reported, excluded with reasons
PASS DoD 3f amended visual crossing budget
```

### 4 — invariant corruption controls

```text
PASS retained six fixture cases: 18-wire admission, determinism, off-road rejection, node-body rejection, nongate rejection, disconnected-path rejection.
PASS gate mouth refinement: wrong lane inside the permitted mouth is rejected; exact assigned lanes accepted.
```

### 4 — off-junction geometry scope

```text
PASS geometry scope: 865 nonjunction/nonterminal intervals lie exactly on their assigned road lanes; turns confined to registered junctions
```

### 5/6 — operations, stage counts and clone

```text
MEASURE routing=992; compile=19683; total=26107,44120; maxLeg=41; stages={"capacity":1,"nodes":1,"ports":1,"topology":1,"wire-registry":1,"wire:w01":1,"wire:w02":1,"wire:w03":1,"wire:w04":1,"wire:w05":1,"wire:w06":1,"wire:w07":1,"wire:w08":1,"wire:w09":1,"wire:w10":1,"wire:w11":1,"wire:w12":1,"wire:w13":1,"wire:w14":1,"wire:w15":1,"wire:w16":1,"wire:w17":1,"wire:w18":1,"wire:w19":1,"wire:w20":1,"wire:w21":1,"wire:w22":1,"wire:w23":1,"wire:w24":1,"wire:w25":1,"wire:w26":1,"lane-allocation":1,"main-roads":1,"driveways":1,"network":1,"lane-projection":1}
PASS w01: 11 routing ops; executed legs 8
PASS w02: 32 routing ops; executed legs 29
PASS w03: 14 routing ops; executed legs 11
PASS w04: 11 routing ops; executed legs 8
PASS w05: 15 routing ops; executed legs 12
PASS w06: 34 routing ops; executed legs 31
PASS w07: 32 routing ops; executed legs 29
PASS w08: 15 routing ops; executed legs 12
PASS w09: 34 routing ops; executed legs 11,11
PASS w10: 71 routing ops; executed legs 11,11,11,12
PASS w11: 42 routing ops; executed legs 8,8,8
PASS w12: 103 routing ops; executed legs 41,11,11,11
PASS w13: 32 routing ops; executed legs 29
PASS w14: 11 routing ops; executed legs 8
PASS w15: 15 routing ops; executed legs 12
PASS w16: 72 routing ops; executed legs 12,11,11,11
PASS w17: 46 routing ops; executed legs 8,8,11
PASS w18: 104 routing ops; executed legs 41,11,11,11
PASS w19: 15 routing ops; executed legs 12
PASS w20: 11 routing ops; executed legs 8
PASS w21: 43 routing ops; executed legs 8,23
PASS w22: 33 routing ops; executed legs 11,11
PASS w23: 65 routing ops; executed legs 8,2,23,11
PASS w24: 51 routing ops; executed legs 8,11,11
PASS w25: 27 routing ops; executed legs 8,8
PASS w26: 53 routing ops; executed legs 11,11,11
PASS routing total=992 <=1000; maximum law leg=41 <=60
PASS lane allocation + registry compilation=19683 <=20000; components={"wire-registry":928,"lane-allocation":3790,"network":11021,"lane-projection":3944}
PASS per-wire road-pair discovery checks=0
PASS 24/48 nodes: total ops=26107/44120; growth=1.6899682077603708 <=2.5; byte-identical instrumented scenes
PASS one-way pipeline: every recorded construction/allocation/projection stage executes exactly once
```

### 6/8 — headless loads and captures

```text
PASS five loads=[293, 263, 322.7999999523163, 284.2000000476837, 274.7000000476837]; median=284.200 ms <=300
PASS headless captures: immutable M4 before / current M4.5 after, overview, roads-off; 24 nodes / 26 wires; layout count 1
```

### 7 — unchanged selection runner

```text
PASS 2a load: 0 visible labels; all 24 nodes / 26 wires unselected
PASS 2b node-7 primary; only w12 + w13 + w21 + node-12 + node-5 + node-23 secondary; every other node/wire dim; 0 labels (50/50 class assertions)
PASS 3/b layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS 2c w06 primary; only node-8 + node-10 secondary; every other node/wire dim; 1 label = w06, above arc midpoint (50/50 class assertions)
PASS 3/c layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS 2d empty canvas: 0 labels; 0 primary/secondary/dim classes anywhere
PASS 3/d layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS 2e node-1 -> node-22: only node-22 primary, 0 secondary, previous neighbourhood dim, 0 labels (50/50 class assertions)
PASS 3/e layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS 2f node-5 twice: 0 labels; 0 primary/secondary/dim classes anywhere
PASS 3/f layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS 2g secondary w04 -> primary; only node-5 + node-6 secondary; 1 label = w04 (50/50 class assertions)
PASS 3/g layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS extra: primary wire toggles off; secondary node becomes primary with fresh one-hop neighbourhood
PASS 3/extra layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS hub node-23: exactly w19–w24 and their six sources secondary; no labels
PASS 3/hub layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS api node-24: exactly w25/w26 and node-8/node-20 secondary; no labels
PASS 3/api layout counter before=1 after=1 delta=0; all node/road/port bounds, wire paths and camera unchanged
PASS M4 timing loads=[386.39999997615814, 268.10000002384186, 250.79999995231628, 257.7999999523163, 264]; median=264.000 ms <=300; M2=243.7 ms
```

### 9 — regenerated oracle

```text
PASS w01 length=159 oracle=147 detour=8.1633%
PASS w02 length=853 oracle=805 detour=5.9627%
PASS w03 length=646 oracle=634 detour=1.8927%
PASS w04 length=159 oracle=147 detour=8.1633%
PASS w05 length=150 oracle=144 detour=4.1667%
PASS w06 length=726 oracle=684 detour=6.1404%
PASS w07 length=729 oracle=687 detour=6.1135%
PASS w08 length=150 oracle=144 detour=4.1667%
PASS w09 length=2531 oracle=2471 detour=2.4282%
PASS w10 length=2092 oracle=2092 detour=0.0000%
PASS w11 length=671 oracle=659 detour=1.8209%
PASS w12 length=5521 oracle=5329 detour=3.6029%
PASS w13 length=717 oracle=657 detour=9.1324%
PASS w14 length=159 oracle=147 detour=8.1633%
PASS w15 length=319 oracle=307 detour=3.9088%
PASS w16 length=2086 oracle=2080 detour=0.2885%
PASS w17 length=1280 oracle=1226 detour=4.4046%
PASS w18 length=6004 oracle=5782 detour=3.8395%
PASS w19 length=316 oracle=304 detour=3.9474%
PASS w20 length=162 oracle=150 detour=8.0000%
PASS w21 length=2859 oracle=2757 detour=3.6997%
PASS w22 length=2032 oracle=1972 detour=3.0426%
PASS w23 length=3309 oracle=3261 detour=1.4719%
PASS w24 length=4807 oracle=4645 detour=3.4876%
PASS w25 length=639 oracle=621 detour=2.8986%
PASS w26 length=2340 oracle=2274 detour=2.9024%
PASS all named corridors contain their segments; 26 assigned-gate oracle measurements; >10% flagged for visual review.
```

### 1–9 — reconciled canonical evidence

```text
PASS DoD 4: lane, pin, fan, overlap, containment, determinism and geometry-scope audits
PASS DoD 1: pnpm check, 208 tests; zero new .test.ts files
PASS DoD 2: 24 nodes / 26 wires; frozen identity checked separately against 0e5f21e
PASS DoD 3: certified=23; uncertified=0; J21=2; budgeted={"section-1": 0, "section-2": 0, "section-3": 0, "section-4": 0, "world": 0}; junction health={"section-1": 18, "section-2": 2, "section-3": 0, "section-4": 3, "world": 0}
PASS DoD 5: routing=992; compilation=19683; max leg=41; discovery=0; every stage=1
PASS DoD 6: loads=[293, 263, 322.7999999523163, 284.2000000476837, 274.7000000476837]; median=284.200 ms; clone ops=[26107, 44120]; growth=1.6899682077603708
PASS DoD 7: every selection item PASS, hub/api neighborhoods; layout counter 1 -> 1
PASS DoD 8: required PNG hashes recorded; roads-off captured via checkbox
PASS DoD 9: canonical scene/oracle/calculations/metrics reconciled for 26 wires
PASS both accepted bound-proof commits retained as ancestors
```

## Final repository check

The publication commit necessarily follows this file's creation. Reproduce its final status without changing evidence:

```sh
python3 output/playwright/nested-wires/verify-m45-evidence.py --final
git status --short --branch
git log --oneline -4
```

The resulting output is pasted in the delivery response. `--final` asserts the exact branch, an empty porcelain status, both retained proof ancestors, and every reconciled evidence gate before printing the four commits.
