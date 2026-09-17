# M4 STOP report — exact-port fan geometry

Date: 2026-09-17. Branch: `feat/fan-in-hub`; HEAD remains `2f9b762`.

**Not complete.** This candidate implements opt-in semantic specs, default M3 preservation, and an admitted-direction law extension. All 26 wires route. The strict global lane/no-merge gate fails. No screenshots, timing, oracle or operation results are represented as passing. No changes were pushed or committed and no PR was opened. No browser tool or browser session was used; the existing Vite listener on port 5188 (PID 13216) was left running.

## Binary DoD status

| Item | Status | Evidence |
|---|---|---|
| 1 | PASS | `pnpm check` exit 0; 70 files / 208 tests; tracked diff and untracked inventory both show zero new `*.test.ts` files. |
| 2 | PASS | Public builder's opt-in scene returns `wiring.ok=true`, 24 nodes / 26 wires; exact six incoming hub pairs and two api exports pass. |
| 3 | FAIL | Global segment overlap, nonjunction fan crossing, positive-length shared final stems. Default complete serialization, lane ordering/width, exact terminals, owner-driveway checks, determinism and independent containment/boundary checks pass. Oracle-length reporting remains unverified after STOP. |
| 4 | FAIL — unverified | Operation metering and one-way invocation audit not completed after geometry STOP. No ceiling claim. |
| 5 | FAIL — unverified | Five loads and 48-node operation growth not run. |
| 6 | FAIL — unverified | M4 browser topology/selection verification not run. Existing selection PNG modifications were already in the tree. |
| 7 | FAIL — partial | README records STOP, known counts and terminal-capacity limitation. Complete metrics/scaling operation answer not produced. |
| 8 | FAIL — unverified | M4 screenshots not captured. Organised fan visual acceptance is not claimed; the current mathematical fan audit fails. |
| 9 | FAIL — partial | `m4-candidate-scene.json` retained separately. Canonical scene/oracle/calculations/metrics intentionally remain accepted M3, not failing M4. |
| 10 | FAIL — partial | Correct branch; candidate code/evidence uncommitted and status dirty. No new commits; log below. |

Whole-file >144/160 source review is not claimed for this failed candidate. No acceptance score or lint exception was invented.

## Blocker and its scope

`node-23:entry-left` receives w20, w21, w22 and w24 at exact point (608,848), with lane offsets 3, 9, 15 and 21 in ID order. Its width is correctly 60. w20's final segment is (590,848)→(608,848); w21's is (596,848)→(608,848). They share 12 units. The top entry has w19 and w23, width 36.

Independent of that specific fan formula, four orthogonal arrivals cannot meet this exact left-boundary point without sharing a positive-length final ray: west, north and south are the only three exterior rays; east enters the node body. Widening and bend spacing cannot solve that **current port assignment**. This is not a claim that every alternative lawful port-selection extension for the six-wire fixture is impossible. Redistributing arrivals would require a different routing rule, not merely a capacity/projection adjustment; weakening exact ports or allowing merges would change an invariant. This attempt stops with the concrete conflict exposed rather than claiming any of those changes is authorized or accepted.

The audit also records a separate w19/w23 street overlap: 12 units from (695,651), before the hub top driveway. It remains unresolved.

For the requested future hub receiving 25 imports: with two exact entry-port points, orthogonal final approaches and no node-body intrusion or positive-length sharing, at most six distinct final rays are available. Thus that future topology cannot be justified by a numeric cost extrapolation under these endpoint invariants. No 150-node / 300-wire runtime or operation measurement was made.

## Reproduce

```sh
pnpm check
node output/playwright/nested-wires/verify-lanes.mjs
```

The first exits 0; the second exits 1. Both use the public Layout contract. The lane script first runs retained M3 topology checks on the default spec, then runs M4 geometry checks on `fanInHubSceneSpec`.

## Pasted check summary (exit 0)

```text
 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  11:12:10
   Duration  20.33s (tests 72%, import 14%, transform 12%, environment 2%)

```

## Pasted lane output (exit 1)

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
PASS 3a every assigned road/driveway lane distinct; actual centrelines match the assignment; shared gate positions distinct inside mouths
PASS 3b opposite directions occupy opposite sides; same-direction lanes stack outward in wire-ID order at pitch 6
PASS 3d every road and every node/gate driveway width = 12 + 12 × lane count
PASS 3e no road/driveway node overlap; streets respect boundaries; only registered junctions overlap; all wire containment, terminal and gate-lane invariants
FAIL 3a global segment audit: zero same-axis overlap or parallel touch; perpendicular junction crossings and exact common node-port terminals only: w19/w23 overlap {"x":695,"y":651,"length":12}

12 !== 0

PASS 3f no shared positive-length segments or nonjunction crossings; w12/w18 share only the exact node-12 terminal inside its driveway
PASS 3g two complete scene JSON serialisations are byte-identical
PASS M4 default full pipeline is byte-identical to committed M3 scene evidence
PASS M4 exactly 24 nodes / 26 wires; six hub imports and two api exports
PASS hub capacity: drive:node-23:entry-left; lanes=4; width=60; order=w20,w21,w22,w24
PASS M4 hub driveway >=3 lanes, width = 12 + 12*lanes, arrival lane order ascending
PASS M4 every terminal and node driveway belongs to its own source/target
FAIL M4 hub entry driveways never merge before their exact terminal: w20/w21 nonjunction crossing {"x":596,"y":848,"length":0}
WITNESS w20/w21 final stems: {"x":596,"y":848,"length":12}
FAIL M4 hub final stems have no positive-length overlap: Expected values to be strictly equal:

12 !== 0

WITNESS exact left port (608,848): w20,w21,w22,w24; allowed final rays=west,north,south; east enters node body
FAIL M4 necessary orthogonal boundary-port capacity: arrivals <= three exterior rays: 4 distinct arrivals exceed 3 exterior rays
```

## Pasted git log

```text
2f9b762 test(layout): run selection verification headless
5aeb348 docs(layout): publish M3 capacity metrics screenshots and verification evidence
b8223f1 test(layout): verify M3 lane geometry operations and selection topology
9b955b5 feat(layout): allocate directional wire lanes and size final corridors from demand
e84df66 docs(layout): preserve lane candidate and straight-junction STOP evidence
f81368e test(layout): correct M3 parallel-sharing topology expectation
```

## Working state at STOP

```text
## feat/fan-in-hub
 M capability/layout/contract/api.ts
 M capability/layout/contract/index.ts
 M capability/layout/core/nested-wire-law.ts
 M capability/layout/core/nested-wire-routing.ts
 M capability/layout/core/prototype-nested-placement.ts
 M capability/layout/core/prototype-nested-scene.ts
 M output/playwright/nested-wires/README.md
 M output/playwright/nested-wires/verify-lanes.mjs
 M output/playwright/selection/cleared.png
 M output/playwright/selection/default.png
 M output/playwright/selection/node-selected.png
 M output/playwright/selection/wire-selected.png
?? capability/layout/contract/records/nested-scene-spec.ts
?? capability/layout/core/nested-scene-spec.ts
?? output/playwright/nested-wires/m4-candidate-scene.json
?? output/playwright/nested-wires/m4-checks.txt
?? output/playwright/nested-wires/m4-lanes-output.txt
```
