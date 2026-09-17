# M5 completion report — amended DoD 6

The 21,000 compile ceiling supersedes the historical 20,000 STOP. All requested functionality and acceptance checks are complete; preflight alone is not the acceptance result.

| DoD | Status | Evidence |
|---|---|---|
| 1 | PASS | pnpm check exits 0; 70 test files /208 tests; zero new .test.ts files. |
| 2a–f | PASS | Real headless mouse drags; exact pair exchange/22 unchanged; complete fresh-build identity; all 26 routes; +1 per swap; no-op +0; node-7 neighborhood and perfect round-trip. |
| 3 | PASS | Lane, invariant, visual-budget and bound-prover suites pass on after-scene.json; default suites also pass. 30 certified /0 uncertified. |
| 4 | PASS | dirty-set.json and dirty-set.md: 2 nodes, 8 main roads, 25 driveways, 12 relaned roads, 16 wires, 36 junctions; before/after and per-wire reasons. |
| 5 | PASS | Five drop-to-ready samples; median 71.5 ms ≤100. |
| 6 | PASS | Routing 1,025 ≤1,050; compile 20,107 ≤21,000; discovery 0; each stage once; required compile delta explanation below. |
| 7 | PASS | All three required real PNGs present and personally inspected; see visual-review.md. |
| 8 | PASS | Unchanged M4 selection wrapper and browser body pass; every click delta 0, camera/geometry unchanged; load median 295.8 ms ≤300. |
| 9 | PASS | README appended with behavior, findings, timing and measured scaling: 150/300 = 537.5 ms interaction /15.3 ms builder. |
| 10 | PASS | feat/drag-swap; logical implementation, verification/evidence and documentation commits; final clean status and git log --oneline -4 are pasted in the delivery after committing this report. |

Headless-only browser sessions used the existing Vite on 5188 (HTTP 200). No server stop/restart, visible browser, macOS open, --headed, subagent, new test file, push or PR. Application changes are confined to the isolated host and React Flow renderer; Layout core/routing/lane/pin/gate implementations are unchanged.

DoD 2f interpretation: to restore default order, node-4 is dropped onto node-1’s current cell (node-4’s original cell). The literal “node-1’s old cell” is node-4’s current location after the first swap and would be a self/no-op drop.

## Pasted gate and interaction output

```text

 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  15:55:33
   Duration  21.03s (tests 71%, import 15%, transform 12%, environment 2%)

exit 0
New .test.ts files: 0
```

Full gate stdout/stderr: [pnpm-check.txt](pnpm-check.txt).

```text
PASS 2a exactly node-4/node-1 exchange bounds; other 22 and actual rendered bounds verified
PASS 2b–d byte-identical independent swapped-spec build; all 26 routes and rendered paths; exactly +1 layout; selection unchanged
PASS 2e empty canvas drop snaps back exactly; byte-identical scene; +0 layouts; selection unchanged
PASS 2f click node-7: exact neighborhood/+0 layouts; return swap: unchanged selection and byte-identical original scene
PASS 5 drop-to-ready milliseconds=[78.69999992847443,73.60000002384186,69.70000004768372,71.5,67.60000002384186]; median=71.5 <=100
PASS extra cross-section no-op/+0 layouts; headless mouse events only
```

## Swapped-scene suites

Each command below exited 0. --scene after-scene.json and --spec swapped-spec.json are passed to the JavaScript suites; Python tools receive --scene and an M5 --output so canonical evidence is preserved.

### lanes-output.txt

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
PASS M4.5 derived pins: 26 wires; 39 exact centered rows in assigned lane order; pitch 6
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
MEASURE all crossings per section: {"section-1": 25, "section-2": 2, "section-3": 0, "section-4": 3, "world": 0}
MEASURE junction crossings per section (health metric, no M4 ceiling): {"section-1": 25, "section-2": 2, "section-3": 0, "section-4": 3, "world": 0}
MEASURE budgeted crossings per section (ceiling <=6): {"section-1": 0, "section-2": 0, "section-3": 0, "section-4": 0, "world": 0}
PASS DoD 3f retained crossing-budget gate under ruling #3; legal junction crossings reported, excluded with reasons
PASS DoD 3f amended visual crossing budget
```

### invariants-output.txt

```text
PASS retained six fixture cases: 18-wire admission, determinism, off-road rejection, node-body rejection, nongate rejection, disconnected-path rejection.
PASS gate mouth refinement: wrong lane inside the permitted mouth is rejected; exact assigned lanes accepted.
PASS supplied scene: 26 wires; all nodes own four ports; containment, bodies, boundaries, continuity; byte-identical regeneration
```

### visual-budget-output.txt

```text
PASS exemption controls: registered perpendicular only; >=60 threshold; outside/shallow/overlap retained; ceiling rejects 7
EXCLUDED {"wires": ["w01", "w20"], "point": [528.5, 855.5], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:536:248:drive:node-1:exit-right|junction:section-1:vertical:536:248:drive:node-23:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w01", "w23"], "point": [551.0, 651.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:648:200:section-1:vertical:536:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w01", "w24"], "point": [551.0, 851.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:536:248:drive:node-1:exit-right|junction:section-1:vertical:536:248:drive:node-23:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w02", "w03"], "point": [873.5, 269.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:248:200:section-1:vertical:872:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w02", "w20"], "point": [528.5, 849.5], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:536:248:drive:node-1:exit-right|junction:section-1:vertical:536:248:drive:node-23:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w02", "w23"], "point": [545.0, 651.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:648:200:section-1:vertical:536:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w02", "w24"], "point": [534.5, 849.5], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:536:248:drive:node-1:exit-right|junction:section-1:vertical:536:248:drive:node-23:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w03", "w09"], "point": [873.5, 263.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:248:200:section-1:vertical:872:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w03", "w12"], "point": [203.0, 451.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:200:248:drive:node-4:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w03", "w12"], "point": [873.5, 251.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:248:200:section-1:vertical:872:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w03", "w15"], "point": [215.0, 451.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:200:248:drive:node-4:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w03", "w18"], "point": [209.0, 451.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:200:248:drive:node-4:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w03", "w18"], "point": [873.5, 257.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:248:200:section-1:vertical:872:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w03", "w24"], "point": [873.5, 245.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:248:200:section-1:vertical:872:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w05", "w06"], "point": [1845.0, 675.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-2:horizontal:672:1344:drive:node-6:exit-bottom|junction:section-2:horizontal:672:1344:drive:node-9:entry-top"], "excluded": true, "section": "section-2", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w09", "w18"], "point": [1509.0, 429.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-2:horizontal:432:1344:drive:node-5:entry-top"], "excluded": true, "section": "section-2", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w09", "w24"], "point": [533.0, 449.5], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:536:248:drive:node-4:exit-right|junction:section-1:vertical:536:248:drive:node-2:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w10", "w21"], "point": [1845.0, 1033.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:1048:200:drive:section-2:exit-bottom"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w11", "w26"], "point": [1477.0, 1591.5], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-4:vertical:1480:1368:drive:section-4:entry-left"], "excluded": true, "section": "section-4", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w12", "w24"], "point": [533.0, 251.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:248:200:section-1:vertical:536:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w15", "w23"], "point": [215.0, 651.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:vertical:200:248:section-1:horizontal:648:200|junction:section-1:vertical:200:248:drive:section-1:entry-left"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w16", "w17"], "point": [1645.0, 1371.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-4:horizontal:1368:1480:drive:node-17:entry-top"], "excluded": true, "section": "section-4", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w16", "w21"], "point": [1833.0, 1033.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:1048:200:drive:section-2:exit-bottom"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w16", "w22"], "point": [1833.0, 1027.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:1048:200:drive:section-2:exit-bottom"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w17", "w26"], "point": [1477.0, 1585.5], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-4:vertical:1480:1368:drive:section-4:entry-left"], "excluded": true, "section": "section-4", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w18", "w24"], "point": [533.0, 257.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:248:200:section-1:vertical:536:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w20", "w23"], "point": [527.0, 651.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:648:200:section-1:vertical:536:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w21", "w26"], "point": [1038.5, 1033.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:1048:200:drive:node-24:exit-bottom"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w22", "w26"], "point": [1038.5, 1027.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:1048:200:drive:node-24:exit-bottom"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
EXCLUDED {"wires": ["w23", "w24"], "point": [533.0, 651.0], "angleDegrees": 90.0, "singlePoint": true, "registeredJunctions": ["junction:section-1:horizontal:648:200:section-1:vertical:536:248"], "excluded": true, "section": "section-1", "reason": "perpendicular (>=60 degrees) single-point crossing at registered junction"}
MEASURE all crossings per section: {"section-1": 25, "section-2": 2, "section-3": 0, "section-4": 3, "world": 0}
MEASURE junction crossings per section (health metric, no M4 ceiling): {"section-1": 25, "section-2": 2, "section-3": 0, "section-4": 3, "world": 0}
MEASURE budgeted crossings per section (ceiling <=6): {"section-1": 0, "section-2": 0, "section-3": 0, "section-4": 0, "world": 0}
WITNESS section-1: 25 alternating-boundary wire pairs at registered junctions
WITNESS {"junction": "junction:section-1:horizontal:248:200:section-1:vertical:536:248", "bounds": {"x": 488, "y": 200, "width": 96, "height": 96}, "wires": ["w12", "w24"], "boundaryOrder": ["w24", "w12", "w24", "w12"]}
WITNESS {"junction": "junction:section-1:horizontal:248:200:section-1:vertical:536:248", "bounds": {"x": 488, "y": 200, "width": 96, "height": 96}, "wires": ["w18", "w24"], "boundaryOrder": ["w24", "w18", "w24", "w18"]}
WITNESS {"junction": "junction:section-1:horizontal:248:200:section-1:vertical:872:248", "bounds": {"x": 860, "y": 200, "width": 24, "height": 96}, "wires": ["w02", "w03"], "boundaryOrder": ["w02", "w03", "w02", "w03"]}
WITNESS {"junction": "junction:section-1:horizontal:248:200:section-1:vertical:872:248", "bounds": {"x": 860, "y": 200, "width": 24, "height": 96}, "wires": ["w03", "w09"], "boundaryOrder": ["w09", "w03", "w09", "w03"]}
WITNESS {"junction": "junction:section-1:horizontal:248:200:section-1:vertical:872:248", "bounds": {"x": 860, "y": 200, "width": 24, "height": 96}, "wires": ["w03", "w12"], "boundaryOrder": ["w12", "w03", "w12", "w03"]}
WITNESS {"junction": "junction:section-1:horizontal:248:200:section-1:vertical:872:248", "bounds": {"x": 860, "y": 200, "width": 24, "height": 96}, "wires": ["w03", "w18"], "boundaryOrder": ["w18", "w03", "w18", "w03"]}
WITNESS {"junction": "junction:section-1:horizontal:248:200:section-1:vertical:872:248", "bounds": {"x": 860, "y": 200, "width": 24, "height": 96}, "wires": ["w03", "w24"], "boundaryOrder": ["w24", "w03", "w24", "w03"]}
WITNESS {"junction": "junction:section-1:horizontal:1048:200:drive:node-24:exit-bottom", "bounds": {"x": 1028, "y": 1006, "width": 24, "height": 84}, "wires": ["w21", "w26"], "boundaryOrder": ["w26", "w21", "w26", "w21"]}
WITNESS {"junction": "junction:section-1:horizontal:1048:200:drive:node-24:exit-bottom", "bounds": {"x": 1028, "y": 1006, "width": 24, "height": 84}, "wires": ["w22", "w26"], "boundaryOrder": ["w26", "w22", "w26", "w22"]}
WITNESS {"junction": "junction:section-1:horizontal:1048:200:drive:section-2:exit-bottom", "bounds": {"x": 1824, "y": 1006, "width": 48, "height": 84}, "wires": ["w10", "w21"], "boundaryOrder": ["w10", "w21", "w10", "w21"]}
WITNESS {"junction": "junction:section-1:horizontal:1048:200:drive:section-2:exit-bottom", "bounds": {"x": 1824, "y": 1006, "width": 48, "height": 84}, "wires": ["w16", "w21"], "boundaryOrder": ["w16", "w21", "w16", "w21"]}
WITNESS {"junction": "junction:section-1:horizontal:1048:200:drive:section-2:exit-bottom", "bounds": {"x": 1824, "y": 1006, "width": 48, "height": 84}, "wires": ["w16", "w22"], "boundaryOrder": ["w16", "w22", "w16", "w22"]}
WITNESS {"junction": "junction:section-1:vertical:200:248:drive:node-4:entry-left", "bounds": {"x": 164, "y": 436, "width": 72, "height": 24}, "wires": ["w03", "w12"], "boundaryOrder": ["w03", "w12", "w03", "w12"]}
WITNESS {"junction": "junction:section-1:vertical:200:248:drive:node-4:entry-left", "bounds": {"x": 164, "y": 436, "width": 72, "height": 24}, "wires": ["w03", "w15"], "boundaryOrder": ["w03", "w15", "w03", "w15"]}
WITNESS {"junction": "junction:section-1:vertical:200:248:drive:node-4:entry-left", "bounds": {"x": 164, "y": 436, "width": 72, "height": 24}, "wires": ["w03", "w18"], "boundaryOrder": ["w03", "w18", "w03", "w18"]}
WITNESS {"junction": "junction:section-1:vertical:200:248:section-1:horizontal:648:200|junction:section-1:vertical:200:248:drive:section-1:entry-left", "bounds": {"x": 164, "y": 600, "width": 72, "height": 60}, "wires": ["w15", "w23"], "boundaryOrder": ["w15", "w23", "w15", "w23"]}
WITNESS {"junction": "junction:section-1:horizontal:648:200:section-1:vertical:536:248", "bounds": {"x": 488, "y": 636, "width": 96, "height": 24}, "wires": ["w01", "w23"], "boundaryOrder": ["w01", "w23", "w01", "w23"]}
WITNESS {"junction": "junction:section-1:horizontal:648:200:section-1:vertical:536:248", "bounds": {"x": 488, "y": 636, "width": 96, "height": 24}, "wires": ["w02", "w23"], "boundaryOrder": ["w02", "w23", "w02", "w23"]}
WITNESS {"junction": "junction:section-1:horizontal:648:200:section-1:vertical:536:248", "bounds": {"x": 488, "y": 636, "width": 96, "height": 24}, "wires": ["w20", "w23"], "boundaryOrder": ["w20", "w23", "w20", "w23"]}
WITNESS {"junction": "junction:section-1:horizontal:648:200:section-1:vertical:536:248", "bounds": {"x": 488, "y": 636, "width": 96, "height": 24}, "wires": ["w23", "w24"], "boundaryOrder": ["w24", "w23", "w24", "w23"]}
WITNESS {"junction": "junction:section-1:vertical:536:248:drive:node-4:exit-right|junction:section-1:vertical:536:248:drive:node-2:entry-left", "bounds": {"x": 488, "y": 430, "width": 96, "height": 36}, "wires": ["w09", "w24"], "boundaryOrder": ["w24", "w09", "w24", "w09"]}
WITNESS {"junction": "junction:section-1:vertical:536:248:drive:node-1:exit-right|junction:section-1:vertical:536:248:drive:node-23:entry-left", "bounds": {"x": 488, "y": 818, "width": 96, "height": 60}, "wires": ["w01", "w20"], "boundaryOrder": ["w20", "w01", "w20", "w01"]}
WITNESS {"junction": "junction:section-1:vertical:536:248:drive:node-1:exit-right|junction:section-1:vertical:536:248:drive:node-23:entry-left", "bounds": {"x": 488, "y": 818, "width": 96, "height": 60}, "wires": ["w01", "w24"], "boundaryOrder": ["w24", "w01", "w24", "w01"]}
WITNESS {"junction": "junction:section-1:vertical:536:248:drive:node-1:exit-right|junction:section-1:vertical:536:248:drive:node-23:entry-left", "bounds": {"x": 488, "y": 818, "width": 96, "height": 60}, "wires": ["w02", "w20"], "boundaryOrder": ["w20", "w02", "w20", "w02"]}
WITNESS {"junction": "junction:section-1:vertical:536:248:drive:node-1:exit-right|junction:section-1:vertical:536:248:drive:node-23:entry-left", "bounds": {"x": 488, "y": 818, "width": 96, "height": 60}, "wires": ["w02", "w24"], "boundaryOrder": ["w24", "w02", "w24", "w02"]}
PASS DoD 3f retained crossing-budget gate under ruling #3; legal junction crossings reported, excluded with reasons
```

### topological-bound-output.txt

```text
PASS controls: disjoint ABAB accepted; reorderable ranges and AABB rejected
FORCED J21 w12/w24: w24:E[245.0,239.0,233.0,227.0,221.0,215.0,209.0,203.0] -> w12:E[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w12:W[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0]
FORCED J21 w18/w24: w24:E[245.0,239.0,233.0,227.0,221.0,215.0,209.0,203.0] -> w18:E[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w18:W[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0]
FORCED J22 w02/w03: w02:E[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w03:S[875.0,881.0] -> w02:W[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w03:W[245.0,239.0,233.0,227.0,221.0,215.0,209.0,203.0]
FORCED J22 w03/w09: w09:E[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w03:S[875.0,881.0] -> w09:W[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w03:W[245.0,239.0,233.0,227.0,221.0,215.0,209.0,203.0]
FORCED J22 w03/w12: w12:E[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w03:S[875.0,881.0] -> w12:W[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w03:W[245.0,239.0,233.0,227.0,221.0,215.0,209.0,203.0]
FORCED J22 w03/w18: w18:E[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w03:S[875.0,881.0] -> w18:W[251.0,257.0,263.0,269.0,275.0,281.0,287.0,293.0] -> w03:W[245.0,239.0,233.0,227.0,221.0,215.0,209.0,203.0]
FORCED J36 w21/w26: w26:N[1037.0,1031.0] -> w21:E[1045.0,1039.0,1033.0,1027.0,1021.0,1015.0,1009.0] -> w26:E[1051.0,1057.0,1063.0,1069.0,1075.0,1081.0,1087.0] -> w21:W[1045.0,1039.0,1033.0,1027.0,1021.0,1015.0,1009.0]
FORCED J36 w22/w26: w26:N[1037.0,1031.0] -> w22:E[1045.0,1039.0,1033.0,1027.0,1021.0,1015.0,1009.0] -> w26:E[1051.0,1057.0,1063.0,1069.0,1075.0,1081.0,1087.0] -> w22:W[1045.0,1039.0,1033.0,1027.0,1021.0,1015.0,1009.0]
FORCED J39 w03/w12: w03:N[197.0,191.0,185.0,179.0,173.0,167.0] -> w12:N[203.0,209.0,215.0,221.0,227.0,233.0] -> w03:E[451.0,457.0] -> w12:S[203.0,209.0,215.0,221.0,227.0,233.0]
FORCED J39 w03/w15: w03:N[197.0,191.0,185.0,179.0,173.0,167.0] -> w15:N[203.0,209.0,215.0,221.0,227.0,233.0] -> w03:E[451.0,457.0] -> w15:S[203.0,209.0,215.0,221.0,227.0,233.0]
FORCED J39 w03/w18: w03:N[197.0,191.0,185.0,179.0,173.0,167.0] -> w18:N[203.0,209.0,215.0,221.0,227.0,233.0] -> w03:E[451.0,457.0] -> w18:S[203.0,209.0,215.0,221.0,227.0,233.0]
FORCED J41 w15/w23: w15:N[203.0,209.0,215.0,221.0,227.0,233.0] -> w23:E[651.0,657.0] -> w15:S[203.0,209.0,215.0,221.0,227.0,233.0] -> w23:W[627.0,633.0,639.0,645.0]
FORCED J44 w01/w23: w01:N[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w23:E[651.0,657.0] -> w01:S[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w23:W[651.0,657.0]
FORCED J44 w02/w23: w02:N[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w23:E[651.0,657.0] -> w02:S[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w23:W[651.0,657.0]
FORCED J44 w20/w23: w20:N[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w23:E[651.0,657.0] -> w20:S[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w23:W[651.0,657.0]
FORCED J44 w23/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w23:E[651.0,657.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w23:W[651.0,657.0]
FORCED J49 w09/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w09:N[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w24:S[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w09:W[451.0,457.0,463.0]
FORCED J50 w01/w20: w20:N[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w01:N[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w20:E[851.0,857.0,863.0,869.0,875.0] -> w01:W[851.0,857.0,863.0]
FORCED J50 w01/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w01:N[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w24:E[851.0,857.0,863.0,869.0,875.0] -> w01:W[851.0,857.0,863.0]
FORCED J50 w02/w20: w20:N[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w02:N[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w20:E[851.0,857.0,863.0,869.0,875.0] -> w02:W[851.0,857.0,863.0]
FORCED J50 w02/w24: w24:N[533.0,527.0,521.0,515.0,509.0,503.0,497.0,491.0] -> w02:N[539.0,545.0,551.0,557.0,563.0,569.0,575.0,581.0] -> w24:E[851.0,857.0,863.0,869.0,875.0] -> w02:W[851.0,857.0,863.0]
PASS 8 disjoint junction rectangles; witness counts are additive
PASS linked-order controls: opposite requirements force 1; compatible orders and independent roads force 0
PASS boundary-arm provenance: supplied semantic scene
FORCED-LINKED w03/w24 >= 1: J21, J22
  ORDER {"assignment": {"section-1:horizontal:248:200": false}, "crossings": 1, "mandatoryCrossingsAt": ["J22"]}
  ORDER {"assignment": {"section-1:horizontal:248:200": true}, "crossings": 1, "mandatoryCrossingsAt": ["J21"]}
FORCED-LINKED w10/w21 >= 1: J37, J38
  ORDER {"assignment": {"section-1:horizontal:1048:200": false}, "crossings": 1, "mandatoryCrossingsAt": ["J37"]}
  ORDER {"assignment": {"section-1:horizontal:1048:200": true}, "crossings": 1, "mandatoryCrossingsAt": ["J38"]}
FORCED-LINKED w16/w21 >= 1: J37, J38
  ORDER {"assignment": {"section-1:horizontal:1048:200": false}, "crossings": 1, "mandatoryCrossingsAt": ["J37"]}
  ORDER {"assignment": {"section-1:horizontal:1048:200": true}, "crossings": 1, "mandatoryCrossingsAt": ["J38"]}
PASS exhaustive rank-magnitude control: 1232 legal physical-slot combinations match linked truth tables
PASS additive S1 certificates: 21 independent-endpoint + 3 linked-road-order
MEASURE section-1 unavoidable crossings >= 24; M5 reports scene-dependent counts
PASS certification negative controls: unknown pair and duplicate crossing rejected
CERTIFIED J50 w01/w20 at [528.5, 855.5]: endpoint-alternation
CERTIFIED J44 w01/w23 at [551.0, 651.0]: endpoint-alternation
CERTIFIED J50 w01/w24 at [551.0, 851.0]: endpoint-alternation
CERTIFIED J22 w02/w03 at [873.5, 269.0]: endpoint-alternation
CERTIFIED J50 w02/w20 at [528.5, 849.5]: endpoint-alternation
CERTIFIED J44 w02/w23 at [545.0, 651.0]: endpoint-alternation
CERTIFIED J50 w02/w24 at [534.5, 849.5]: endpoint-alternation
CERTIFIED J22 w03/w09 at [873.5, 263.0]: endpoint-alternation
CERTIFIED J39 w03/w12 at [203.0, 451.0]: endpoint-alternation
CERTIFIED J22 w03/w12 at [873.5, 251.0]: endpoint-alternation
CERTIFIED J39 w03/w15 at [215.0, 451.0]: endpoint-alternation
CERTIFIED J39 w03/w18 at [209.0, 451.0]: endpoint-alternation
CERTIFIED J22 w03/w18 at [873.5, 257.0]: endpoint-alternation
CERTIFIED J22 w03/w24 at [873.5, 245.0]: linked-road-order
CERTIFIED J81 w05/w06 at [1845.0, 675.0]: endpoint-alternation
CERTIFIED J60 w09/w18 at [1509.0, 429.0]: linked-road-order
CERTIFIED J49 w09/w24 at [533.0, 449.5]: endpoint-alternation
CERTIFIED J38 w10/w21 at [1845.0, 1033.0]: linked-road-order
CERTIFIED J134 w11/w26 at [1477.0, 1591.5]: endpoint-alternation
CERTIFIED J21 w12/w24 at [533.0, 251.0]: endpoint-alternation
CERTIFIED J41 w15/w23 at [215.0, 651.0]: endpoint-alternation
CERTIFIED J121 w16/w17 at [1645.0, 1371.0]: endpoint-alternation
CERTIFIED J38 w16/w21 at [1833.0, 1033.0]: linked-road-order
CERTIFIED J38 w16/w22 at [1833.0, 1027.0]: linked-road-order
CERTIFIED J134 w17/w26 at [1477.0, 1585.5]: endpoint-alternation
CERTIFIED J21 w18/w24 at [533.0, 257.0]: endpoint-alternation
CERTIFIED J44 w20/w23 at [527.0, 651.0]: endpoint-alternation
CERTIFIED J36 w21/w26 at [1038.5, 1033.0]: endpoint-alternation
CERTIFIED J36 w22/w26 at [1038.5, 1027.0]: endpoint-alternation
CERTIFIED J44 w23/w24 at [533.0, 651.0]: endpoint-alternation
MEASURE crossings={'section-1': 25, 'section-2': 2, 'section-3': 0, 'section-4': 3, 'world': 0}; J21=2; budgeted={'section-1': 0, 'section-2': 0, 'section-3': 0, 'section-4': 0, 'world': 0}
MEASURE certified=30; uncertified=0; global floor=30
PASS DoD 3: applicable ceilings, budgeted zero, ZERO uncertified crossings
```

Default-scene compatibility also exited 0: [lanes](default-lanes-output.txt), [invariants](default-invariants-output.txt), [bound prover](default-bound-output.txt). The lane runner invokes the visual-budget suite too. Default M4.5 provenance/caps remain enforced; M5 supplied-scene counts are reported while zero uncertified crossings stays mandatory.

## Dirty set and operations

Full pipeline recompute: all roads, driveways and wires are rebuilt once. This report describes changed outputs, not avoided work.

Moved nodes: 2; changed main roads: 8; changed driveways: 25; roads with changed lane records: 12; changed wires: 16/26; changed junctions: 36; changed sections: 0.

- node-1: {"x":272,"y":400,"width":192,"height":96} → {"x":272,"y":800,"width":192,"height":96}
- node-4: {"x":272,"y":800,"width":192,"height":96} → {"x":272,"y":400,"width":192,"height":96}

Changed road and driveway records, lane records and their exact before/after values are retained in dirty-set.json.

- w01: Incident to node-1; endpoints and law geometry change.
- w02: Incident to node-1; endpoints and law geometry change.
- w03: Incident to node-4; endpoints and law geometry change.
- w09: Incident to node-4; endpoints and law geometry change.
- w10: Shared-road load/rank or junction geometry shifts: drive:section-2:exit-bottom, section-1:horizontal:1048:200, drive:section-1:exit-bottom; 0 lane assignment records change.
- w12: Shared-road load/rank or junction geometry shifts: drive:section-1:entry-left, section-1:vertical:200:248, section-1:horizontal:248:200, drive:section-2:entry-top; 0 lane assignment records change.
- w15: Incident to node-1/node-4; endpoints and law geometry change.
- w16: Shared-road load/rank or junction geometry shifts: drive:section-2:exit-bottom, section-1:horizontal:1048:200, drive:section-1:exit-bottom; 1 lane assignment records change.
- w18: Shared-road load/rank or junction geometry shifts: drive:section-1:entry-left, section-1:vertical:200:248, section-1:horizontal:248:200, drive:section-2:entry-top; 0 lane assignment records change.
- w19: Shared-road load/rank or junction geometry shifts: drive:node-2:exit-bottom, section-1:horizontal:648:200, drive:node-23:entry-top; 0 lane assignment records change.
- w20: Incident to node-4; endpoints and law geometry change.
- w21: Shared-road load/rank or junction geometry shifts: section-1:vertical:2488:248, section-1:horizontal:1048:200, section-1:vertical:536:248, drive:node-23:entry-left; 2 lane assignment records change.
- w22: Shared-road load/rank or junction geometry shifts: drive:section-2:exit-bottom, section-1:horizontal:1048:200, section-1:vertical:536:248, drive:node-23:entry-left; 2 lane assignment records change.
- w23: Shared-road load/rank or junction geometry shifts: drive:section-1:entry-left, section-1:vertical:200:248, section-1:horizontal:648:200, drive:node-23:entry-top; 1 lane assignment records change.
- w24: Shared-road load/rank or junction geometry shifts: drive:section-1:entry-top, section-1:horizontal:248:200, section-1:vertical:536:248, drive:node-23:entry-left; 0 lane assignment records change.
- w26: Shared-road load/rank or junction geometry shifts: drive:node-24:exit-bottom, section-1:horizontal:1048:200, drive:section-1:exit-bottom; 0 lane assignment records change.

| Compile stage | Default | Swapped | Delta |
|---|---:|---:|---:|
| wire-registry | 928 | 928 | +0 |
| lane-allocation | 3790 | 4067 | +277 |
| network | 11021 | 11020 | -1 |
| lane-projection | 3944 | 4092 | +148 |

Total: 19683 → 20107 (+424), ceiling 21,000.

Wire-registry remains unchanged because node/section/road identity counts are unchanged. Lane-allocation grows with the different shared-route congestion and ordering comparisons. Network loses one operation because changed capacity geometry alters a numeric branch. Lane-projection grows with the new lane ranks, turns and terminal coordinates. These are measured executions of the unchanged stages, not extra stage invocations.

Scene variance, not compounding: congestion changes allocation/projection work while discovery stays zero and every stage executes once.

```text
PASS builder-only preflight: semantic order [4,2,3,1,23,24]; exactly two nodes exchange bounds; other 22 unchanged
PASS builder-only preflight: all 26 wires route; corridors/nodeBodies/boundaries/continuity empty; deterministic build and exact round-trip
NOTE no UI drag, selection, render timing or screenshot claim; preflight precedes interaction implementation
MEASURE node-1 {"x":272,"y":400,"width":192,"height":96} -> {"x":272,"y":800,"width":192,"height":96}
MEASURE node-4 {"x":272,"y":800,"width":192,"height":96} -> {"x":272,"y":400,"width":192,"height":96}
MEASURE routing=1025; compile=20107; total=26564,44577; maxLeg=44; stages={"capacity":1,"nodes":1,"ports":1,"topology":1,"wire-registry":1,"wire:w01":1,"wire:w02":1,"wire:w03":1,"wire:w04":1,"wire:w05":1,"wire:w06":1,"wire:w07":1,"wire:w08":1,"wire:w09":1,"wire:w10":1,"wire:w11":1,"wire:w12":1,"wire:w13":1,"wire:w14":1,"wire:w15":1,"wire:w16":1,"wire:w17":1,"wire:w18":1,"wire:w19":1,"wire:w20":1,"wire:w21":1,"wire:w22":1,"wire:w23":1,"wire:w24":1,"wire:w25":1,"wire:w26":1,"lane-allocation":1,"main-roads":1,"driveways":1,"network":1,"lane-projection":1}
PASS w01: 11 routing ops; executed legs 8
PASS w02: 15 routing ops; executed legs 11
PASS w03: 32 routing ops; executed legs 29
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
PASS w15: 47 routing ops; executed legs 44
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
PASS routing total=1025 <=1050; maximum law leg=44 <=60
PASS lane allocation + registry compilation=20107 <=21000; components={"wire-registry":928,"lane-allocation":4067,"network":11020,"lane-projection":4092}
PASS per-wire road-pair discovery checks=0
PASS 24/48 nodes: total ops=26564/44577; growth=1.678098177985243 <=2.5; byte-identical instrumented scenes
PASS one-way pipeline: every recorded construction/allocation/projection stage executes exactly once
```

## Screenshots

- [before-roads-off.png](before-roads-off.png) — SHA-256 `ceecb8b4cd2020e52ed1d086b3652ef950e47dc11fb593a193cc83b13a656744`
- [after-swap-roads-off.png](after-swap-roads-off.png) — SHA-256 `4567dc109d11f52f46cd769d5aa0d9e49fa4e868368adb89f70c670c781760ec`
- [after-swap-roads-on.png](after-swap-roads-on.png) — SHA-256 `e1d58740e5f9ae23d88395a806a357405237f7f4957e15bd7a8dadfde74eae4b`

Personal reference comparison: [visual-review.md](visual-review.md). Source evidence and scores: [source-review.md](source-review.md).

## Unchanged M4 selection acceptance

The runner and underlying browser assertions have zero diff from d13bcc2. Only their fresh timing JSON/stdout changed; all four retained selection PNGs remain byte-identical.

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
PASS M4 timing loads=[325.7000000476837, 294.39999997615814, 279.3000000715256, 296.60000002384186, 295.7999999523163]; median=295.800 ms <=300; M2=243.7 ms
```

## Scaling answer

Measured independent six-node sections, each with 12 local directed wires. Routing and corridor/body/boundary/continuity checks pass before and after every sampled size. Five real drag events per size. No incremental machinery was introduced.

```text
MEASURE 24 nodes/48 wires: build=2.800 ms; drop-to-ready=82.000 ms; five=[83.10000002384186, 95.10000002384186, 82, 81.39999997615814, 73.30000007152557]; ok=True; violations={'corridors': [], 'nodeBodies': [], 'boundaries': [], 'continuity': []}
MEASURE 48 nodes/96 wires: build=4.300 ms; drop-to-ready=157.300 ms; five=[214.29999995231628, 158.70000004768372, 153.10000002384186, 157.30000007152557, 148.5]; ok=True; violations={'corridors': [], 'nodeBodies': [], 'boundaries': [], 'continuity': []}
MEASURE 72 nodes/144 wires: build=7.400 ms; drop-to-ready=234.900 ms; five=[234.89999997615814, 208, 271.1999999284744, 227.30000007152557, 235.10000002384186]; ok=True; violations={'corridors': [], 'nodeBodies': [], 'boundaries': [], 'continuity': []}
MEASURE 96 nodes/192 wires: build=9.000 ms; drop-to-ready=304.200 ms; five=[328.1999999284744, 304.1999999284744, 302.5, 288, 311.7999999523163]; ok=True; violations={'corridors': [], 'nodeBodies': [], 'boundaries': [], 'continuity': []}
MEASURE 120 nodes/240 wires: build=12.100 ms; drop-to-ready=406.000 ms; five=[457.2000000476837, 406, 388.60000002384186, 399.60000002384186, 433]; ok=True; violations={'corridors': [], 'nodeBodies': [], 'boundaries': [], 'continuity': []}
MEASURE 150 nodes/300 wires: build=15.300 ms; drop-to-ready=537.500 ms; five=[474.2999999523163, 558.2999999523163, 537.5, 488.7999999523163, 594.5]; ok=True; violations={'corridors': [], 'nodeBodies': [], 'boundaries': [], 'continuity': []}
```

At 150/300, the observed median is 537.5 ms drop-to-ready, with a 15.3 ms builder median. Rendering/reconciliation dominates. In this sampled topology, the 100 ms boundary lies between 24/48 (82.0 ms) and 48/96 (157.3 ms); no universal graph-size cutoff is claimed. Dense fan-in, cross-section traffic, geometry feasibility and slower hardware can change that boundary. Raw five-sample arrays and the exact scenario description are in scaling.json; README contains the full answer and reproduction commands.

## Delivery state

The final delivery verifies the committed branch and clean working tree, and pastes the last four commit subjects/hashes. Historical STOP.md is retained as history and is superseded by this report and the amended brief.
