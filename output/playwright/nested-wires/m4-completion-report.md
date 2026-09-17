# M4 completion report — ruling #3, 2026-09-17

All implementation, geometry, performance, browser, canonical-evidence and source gates were re-run. The supplied orchestrator ruling resolves the prior crossing-budget conflict; no gate was deleted. The final post-commit branch/tree assertion and six-commit log are delivered in the handoff response, using `verify-m4-evidence.py --final` (recording a commit's own hash inside itself would be circular).

| DoD | Result | Evidence |
| --- | --- | --- |
| 1 | PASS | `pnpm check` exit 0; 70 files / 208 tests; zero added `.test.ts` files; all 12 changed application files >144/160; Sonar ≤2 |
| 2 | PASS | Public pipeline returns `wiring.ok=true`, 24 nodes / 26 exact wires; hub receives w19–w24 and api sends w25/w26 |
| 3a | PASS | Distinct lanes, right-hand traffic, all-pairs segment audit, distinct assigned gate-mouth crossings, containment and whole-scene determinism |
| 3b | PASS | Full default serialization equals `2f9b762` except six independently reconstructed exact pin-row fans; all other bytes preserved |
| 3c | PASS | Hub left driveway has 4 lanes, width 60 = 12 + 12×4; w20,w21,w22,w24 order; planar fan; nodes 192×96 and ≥6 pin-row margins |
| 3d | PASS | Every terminal/node driveway belongs to its own source/target; every used pin unique; no shared-terminal exemption |
| 3e | PASS | All eight lengths/oracle lengths/detours printed below; none exceeds 10%; pre-existing w02 FLAG remains visible |
| 3f | PASS | Budgeted S1/S2/S3/S4/world = 0/0/0/0/0, ceiling 6; excluded junction health = 28/4/2/4/8; each exclusion listed with reason |
| 4 | PASS | Routing 992≤1,000; max executed leg 41≤60; registry/allocation/network/projection 16,376≤20,000; discovery=0; each stage once |
| 5 | PASS | Five loads 291.7,247.6,249.5,249.4,249.5 ms, median 249.5≤300; clone 22,800→40,813 ops, 1.7900438596×≤2.5 |
| 6 | PASS | Every original selection assertion and new hub/api neighborhood PASS; layout counter 1→1, geometry/camera unchanged; both runners headless |
| 7 | PASS | README final metrics plus explicit 25-wire/150-node/300-wire cost and finite-capacity caveats |
| 8 | PASS | Three regenerated required PNGs inspected; roads-off obtained by checkbox; hub reads as an organised fan, not a knot |
| 9 | PASS | Canonical scene/oracle/calculations/metrics regenerated for 26 wires, cross-checked; scene byte-equals fresh public builder output |
| 10 | Post-commit check | Three logical slices on `feat/fan-in-hub`; final handoff requires `--final` clean-tree assertion and six-commit log |

Both browser runners used isolated headless sessions. The inherited Vite PID 13216 served all browser evidence but was found absent at the final post-commit health check. No stop/kill command was issued; its exit cause is unknown. Vite was restored using `pnpm prototype:roads` on port 5188; HTTP 200 was verified. The restored server is left running. No user browser, push, PR or subagent. Historical STOP reports and candidate JSON are retained as provenance, not used by acceptance. Inherited selection PNG edits are preserved; dedicated `m4-selection-*` files are current evidence.

The independent visual review checked nested boundaries, actor alignment, traceable distinct arrivals, endpoint stems and marker visibility against the retained references. The prototype's plain cards, sparse spacing and default hidden labels remain its inherited presentation scope. Source review and deductions: [m4-source-review.md](m4-source-review.md). Every exclusion and the alternating-boundary witness: [m4-visual-budget.json](m4-visual-budget.json).

## Pasted acceptance output

### pnpm check (exit 0)

```text
(Use `node --trace-warnings ...` to show where the warning was created)

 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  14:23:29
   Duration  18.41s (tests 75%, import 14%, transform 10%, environment 1%)

```

### pnpm exec tsx apps/web/cli/verify-nested-wires.ts (exit 0)

```text
PASS M3 preserves all node, section and port geometry; road widths derive from lane demand.
PASS 3a exactly 26 wires with all prescribed IDs and endpoints.
PASS 3b all 26 start in right/bottom source driveways and end in top/left target driveways.
PASS 3c every one of 326 segments independently covered by a road/driveway rectangle; all paths continuous.
PASS 3d zero segments intersect node body interiors.
PASS 3e zero section-boundary crossings at non-gate locations.
PASS 3f two consecutive scene generations have byte-identical wire path data.
```

### node --import tsx output/playwright/nested-wires/count-operations.mjs (exit 0)

```text
MEASURE routing=992; compile=16376; total=22800,40813; maxLeg=41; stages={"capacity":1,"nodes":1,"ports":1,"topology":1,"wire-registry":1,"wire:w01":1,"wire:w02":1,"wire:w03":1,"wire:w04":1,"wire:w05":1,"wire:w06":1,"wire:w07":1,"wire:w08":1,"wire:w09":1,"wire:w10":1,"wire:w11":1,"wire:w12":1,"wire:w13":1,"wire:w14":1,"wire:w15":1,"wire:w16":1,"wire:w17":1,"wire:w18":1,"wire:w19":1,"wire:w20":1,"wire:w21":1,"wire:w22":1,"wire:w23":1,"wire:w24":1,"wire:w25":1,"wire:w26":1,"lane-allocation":1,"main-roads":1,"driveways":1,"network":1,"lane-projection":1}
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
PASS lane allocation + registry compilation=16376 <=20000; components={"wire-registry":928,"lane-allocation":1414,"network":11021,"lane-projection":3013}
PASS per-wire road-pair discovery checks=0
PASS 24/48 nodes: total ops=22800/40813; growth=1.7900438596491228 <=2.5; byte-identical instrumented scenes
PASS one-way pipeline: every recorded construction/allocation/projection stage executes exactly once
```

### node --import tsx output/playwright/nested-wires/verify-invariants.mjs (exit 0)

```text
PASS retained six fixture cases: 18-wire admission, determinism, off-road rejection, node-body rejection, nongate rejection, disconnected-path rejection.
PASS gate mouth refinement: wrong lane inside the permitted mouth is rejected; exact assigned lanes accepted.
```

### python3 output/playwright/nested-wires/verify-static.py (exit 0)

```text
$ grep -nE 'scene\.roads|roads\.(map|filter|find|some|flatMap|slice)' capability/layout/core/nested-wire-access.ts capability/layout/core/nested-wire-corridors.ts capability/layout/core/nested-wire-law.ts capability/layout/core/nested-wire-routing.ts
[no matches; exit 1]
$ grep -nE 'roads\.(slice|flatMap)|for.*of roads' capability/layout/core/prototype-road-network.ts
[no matches; exit 1]
$ grep -nE 'scene\.roads|roads\.(map|filter|find|some|flatMap|slice)' capability/layout/core/nested-wire-access.ts capability/layout/core/nested-wire-corridors.ts capability/layout/core/nested-wire-inspection.ts capability/layout/core/nested-wire-lanes.ts capability/layout/core/nested-wire-law.ts capability/layout/core/nested-wire-registry.ts capability/layout/core/nested-wire-routing.ts capability/layout/core/prototype-road-network.ts
capability/layout/core/nested-wire-inspection.ts:103:  const road = scene.roads.find((r) => r.id === `drive:${gate}`);
capability/layout/core/nested-wire-inspection.ts:153:  const roads = new Map(scene.roads.map((r) => [r.id, r]));
capability/layout/core/nested-wire-registry.ts:64:  const registry = roadRegistry(scene.roads);
capability/layout/core/nested-wire-registry.ts:88:  return { roads: new Map(scene.roads.map((r) => [r.id, r])), crossings, accesses, terminals };
capability/layout/core/prototype-road-network.ts:225:  const parts = roads.map((road) => roadParts(road, ownership.get(road.id) ?? []));
capability/layout/core/prototype-road-network.ts:248:  const order = new Map(roads.map((r, i) => [r.id, i]));
$ grep -nE 'constructedContacts|nestedCrossings|registeredEndpoints|registry\.crossings\.get|roads\.get' capability/layout/core/prototype-nested-scene.ts capability/layout/core/prototype-road-network.ts capability/layout/core/nested-wire-law.ts capability/layout/core/nested-wire-corridors.ts
capability/layout/core/prototype-nested-scene.ts:4:import { roadRegistry, constructedContacts, frameEnds } from './prototype-road-registry.js';
capability/layout/core/prototype-nested-scene.ts:23:  nestedCrossings,
capability/layout/core/prototype-nested-scene.ts:51:    const contacts = constructedContacts(
capability/layout/core/prototype-nested-scene.ts:53:      [...frameEnds(main), ...nestedCrossings(placement)],
capability/layout/core/prototype-road-network.ts:227:  const adjacency = laneAdjacency(roads, registeredEndpoints(parts), lanes);
capability/layout/core/prototype-road-network.ts:260:function registeredEndpoints(parts: readonly ReturnType<typeof roadParts>[]) {
capability/layout/core/nested-wire-law.ts:46:  const destination = new Set((registry.crossings.get(b.roadId) ?? []).map((c) => c.roadId));
capability/layout/core/nested-wire-law.ts:48:  const candidates = (registry.crossings.get(a.roadId) ?? []).filter((c) =>
capability/layout/core/nested-wire-law.ts:110:  if (!(registry.crossings.get(a.roadId) ?? []).some((c) => c.roadId === b.roadId)) return null;
capability/layout/core/nested-wire-corridors.ts:13:  const road = roads.get(line.roadId);
PASS pair law unchanged: band -> shared road -> quadrant.
PASS routing call chain has no all-road scan; compiler has no road-pair discovery loop.
The remaining matches are compile-once road indexing and the independent inspector once-per-inspection index. roadNetwork maps roads once to their owned events and ranks construction contacts; neither traversal is per wire.
Construction contacts enumerate registered grid/frame crossings and driveway endpoints; the lane compiler consumes only those contacts. No shifted scan or hidden road-pair helper remains.
```

### python3 output/playwright/nested-wires/verify-oracle.py (exit 0)

```text
PASS w01 length=153 oracle=147 detour=4.0816%
PASS w02 length=895 oracle=811 detour=10.3576% FLAG >10%: orchestrator visual review
PASS w03 length=652 oracle=640 detour=1.8750%
PASS w04 length=153 oracle=147 detour=4.0816%
PASS w05 length=150 oracle=144 detour=4.1667%
PASS w06 length=726 oracle=684 detour=6.1404%
PASS w07 length=729 oracle=687 detour=6.1135%
PASS w08 length=150 oracle=144 detour=4.1667%
PASS w09 length=2567 oracle=2495 detour=2.8858%
PASS w10 length=2092 oracle=2092 detour=0.0000%
PASS w11 length=665 oracle=653 detour=1.8377%
PASS w12 length=5497 oracle=5329 detour=3.1526%
PASS w13 length=723 oracle=663 detour=9.0498%
PASS w14 length=159 oracle=147 detour=8.1633%
PASS w15 length=319 oracle=307 detour=3.9088%
PASS w16 length=2086 oracle=2080 detour=0.2885%
PASS w17 length=1286 oracle=1232 detour=4.3831%
PASS w18 length=5968 oracle=5770 detour=3.4315%
PASS w19 length=322 oracle=310 detour=3.8710%
PASS w20 length=168 oracle=156 detour=7.6923%
PASS w21 length=2865 oracle=2763 detour=3.6916%
PASS w22 length=2038 oracle=1978 detour=3.0334%
PASS w23 length=3333 oracle=3285 detour=1.4612%
PASS w24 length=4825 oracle=4663 detour=3.4742%
PASS w25 length=639 oracle=621 detour=2.8986%
PASS w26 length=2340 oracle=2274 detour=2.9024%
PASS all named corridors contain their segments; 26 assigned-gate oracle measurements; >10% flagged for visual review.
```

### node output/playwright/nested-wires/verify-lanes.mjs --oracle (exit 0)

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
PASS w19: length=322; oracle=310; detour=3.8710%
PASS w20: length=168; oracle=156; detour=7.6923%
PASS w21: length=2865; oracle=2763; detour=3.6916%
PASS w22: length=2038; oracle=1978; detour=3.0334%
PASS w23: length=3333; oracle=3285; detour=1.4612%
PASS w24: length=4825; oracle=4663; detour=3.4742%
PASS w25: length=639; oracle=621; detour=2.8986%
PASS w26: length=2340; oracle=2274; detour=2.9024%
PASS 3e all eight hub oracle measurements reported; >10% flagged
PASS DoD 9 canonical scene matches full regenerated M4 serialization
PASS exemption controls: registered perpendicular only; >=60 threshold; outside/shallow/overlap retained; ceiling rejects 7
MEASURE all crossings per section: {"section-1": 28, "section-2": 4, "section-3": 2, "section-4": 4, "world": 8}
MEASURE junction crossings per section (health metric, no M4 ceiling): {"section-1": 28, "section-2": 4, "section-3": 2, "section-4": 4, "world": 8}
MEASURE budgeted crossings per section (ceiling <=6): {"section-1": 0, "section-2": 0, "section-3": 0, "section-4": 0, "world": 0}
PASS DoD 3f retained crossing-budget gate under ruling #3; legal junction crossings reported, excluded with reasons
PASS DoD 3f amended visual crossing budget
```

### python3 output/playwright/nested-wires/verify-m4-visual-budget.py (exit 0)

```text
PASS exemption controls: registered perpendicular only; >=60 threshold; outside/shallow/overlap retained; ceiling rejects 7
MEASURE all crossings per section: {"section-1": 28, "section-2": 4, "section-3": 2, "section-4": 4, "world": 8}
MEASURE junction crossings per section (health metric, no M4 ceiling): {"section-1": 28, "section-2": 4, "section-3": 2, "section-4": 4, "world": 8}
MEASURE budgeted crossings per section (ceiling <=6): {"section-1": 0, "section-2": 0, "section-3": 0, "section-4": 0, "world": 0}
PASS DoD 3f retained crossing-budget gate under ruling #3; legal junction crossings reported, excluded with reasons
```

### python3 output/playwright/nested-wires/capture-m4.py (exit 0; headless)

```text
PASS M4 five loads=[291.7000000476837, 247.60000002384186, 249.5, 249.39999997615814, 249.5]; median=249.500 ms; M2=243.7 ms; ceiling=300 ms
PASS 24 nodes, 26 wires, one layout calculation; three M4 screenshots captured
```

### python3 output/playwright/nested-wires/verify-m4-selection.py (exit 0; headless)

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
PASS M4 timing loads=[275.60000002384186, 247.39999997615814, 250.39999997615814, 248.70000004768372, 244.89999997615814]; median=248.700 ms <=300; M2=243.7 ms
```

### python3 output/playwright/nested-wires/verify-m4-evidence.py --write (exit 0)

```text
PASS DoD 1: pnpm check, 208 tests; zero new .test.ts files
PASS DoD 2: ok=true; 24 nodes, 26 wires; node-23 six imports; node-24 two exports
PASS DoD 3f: budgeted={"section-1": 0, "section-2": 0, "section-3": 0, "section-4": 0, "world": 0}; junction health={"section-1": 28, "section-2": 4, "section-3": 2, "section-4": 4, "world": 8}
PASS DoD 4: routing=992; compilation=16376; max leg=41; discovery=0; every stage=1
PASS DoD 5: loads=[291.7000000476837, 247.60000002384186, 249.5, 249.39999997615814, 249.5]; median=249.500 ms; clone ops=[22800, 40813]; growth=1.7900438596491228
PASS DoD 6: every selection item PASS, hub/api neighborhoods; layout counter 1 -> 1
PASS DoD 8: three required PNG hashes recorded; roads-off captured via checkbox
PASS DoD 9: canonical scene/oracle/calculations/metrics reconciled for 26 wires
```

Full unabridged output, including every crossing exclusion and repository gate line: [m4-verification.txt](m4-verification.txt).
