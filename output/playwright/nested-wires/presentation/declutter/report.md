# M6.5b completion evidence

Branch `feat/m65b-declutter`, based on `11f2db3`. No push, PR, subagent,
new dependency or new `*.test.ts`. All browser work used an isolated headless
Chrome session and an owned Vite server on 5191. No operation targeted 5190.

## Binary DoD

| # | Result | Evidence |
| --- | --- | --- |
| 1 | PASS | `pnpm check` exit 0; 70 files / 208 tests; no new test files. |
| 2 | PASS | Unchanged structural verifier exit 0; fresh label-extended spec builds byte-identical Layout output to M6; decorated host equals M6 excluding only wire labels. |
| 3 | PASS | Exact M6 ops: templates 28,407 / 1,626 / 0; nested 19,732 / 992 / 0. Full report objects equal, not merely rounded totals. |
| 4 | PASS | Templates 130 certified / 0 uncertified; every inherited nested regression runner exits 0. |
| 5 | PASS | Both scenes: no visible port circles or section gate badges, no node subtitle or section commentary; primary w22 shows exactly one `hashContent + 4 more` label. |
| 6 | PASS | All five named PNGs present at 1920×1440; personally inspected against approved references and M6.5a. |
| 7 | PASS | Original selection assertion body unchanged; all interactions pass; layout counter remains 1; median 267.90 ms. |
| 8 | PASS | Nested-wires README appended with removed chrome, label rule/examples, spec extension, evidence and remaining weaknesses. |
| 9 | PASS at final handoff | Stayed on requested branch; local metadata, renderer and evidence/documentation commits; clean status and `git log --oneline -4` printed after final commit. |

The narrow milestone is verified. General reference parity/panel-balance targets
remain deferred, as recorded in [visual-review.md](visual-review.md); external
orchestrator acceptance remains its own decision.

## Exact geometry exclusion

`verify-identity.mjs` reads the **current label-extended committed spec**, not the
old spec. Only the new top-level `wires` metadata array is removed when comparing
semantic inputs to M6; `sections` and `requests` must be deeply equal.
The entire fresh public Layout scene serialization is then compared byte-for-byte
to M6 b20053d `templates-scene/scene.json`, with **no output exclusion**.
The synthetic nested scene gets the same complete byte comparison.

The actual templates host also builds afresh and must attach all 29 exact labels.
For its comparison, only `wiring.value[*].label` is deleted. The M6 baseline receives
its original directory captions, read from M6's committed host source, before a
complete deep equality comparison. No coordinates, road/lane IDs, gates, pin fields,
routes, section descriptions, numeric tolerances or selected subsets are omitted.
Layout core and M6.5a token sources are unchanged.

## Captures

- [templates-roads-off.png](templates-roads-off.png)
- [templates-roads-on.png](templates-roads-on.png)
- [templates-contract-detail.png](templates-contract-detail.png)
- [nested-roads-off.png](nested-roads-off.png)
- [selection-wire-label.png](selection-wire-label.png)

An extra nested roads-on capture and inherited selection captures are retained.
The selected label is derived from plan.ts's actual imported value names:
`hashContent, validateCatalog, checkPayload, key, pinOf`.
The abbreviated label is `hashContent + 4 more`; nested labels remain IDs.

## Reproduction and pasted output

Full `pnpm check` stdout/stderr is in [pnpm-check.txt](pnpm-check.txt).
The final run includes typecheck, ESLint/Sonar <=2, formatting, architecture and
70 passing test files / 208 passing tests. No acceptance assertion was weakened.
The extractor also passes standalone strict TypeScript and explicit Sonar <=2
(the repository's ordinary Sonar glob does not include `.mts`). Commands:

```sh
pnpm exec tsc --ignoreConfig --noEmit --target ES2023 --module NodeNext --types node --strict --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes output/playwright/nested-wires/templates-scene/extract-scene.mts
pnpm exec eslint --stdin --stdin-filename output/playwright/nested-wires/templates-scene/extract-scene.ts < output/playwright/nested-wires/templates-scene/extract-scene.mts
```

Both exit 0 with no diagnostics. Initial checks caught an explicit-undefined
optional-property mismatch in the host, and extractor helper complexity; these
were corrected. An initial new witness assertion named the wrong imported symbols;
it was corrected against plan.ts. The extracted label/output was already correct.
The extractor's standalone tsc invocation needed explicit config/type flags.
These were development failures, not waived acceptance gates.


### Geometry identity

```text
$ node --import tsx output/playwright/nested-wires/presentation/declutter/verify-identity.mjs
PASS templates from label-extended spec (no output exclusion): fresh public builder byte-identical to M6 b20053d; sha256=1940f9b9619a98fd600299aac5f40376184f9d8915d04e8bcbad0b43b4743253
PASS nested (no exclusion): fresh public builder byte-identical to M6 b20053d; sha256=946bb1e9836c4242382a534ab97f4752b24d7bcc230e85be2835f720145a8e8a
PASS templates host: every field equals M6 host output after deleting ONLY wiring.value[*].label; M6 directory captions retained
PASS catalog.ts -> plan.ts w22: hashContent, validateCatalog, checkPayload, key, pinOf => hashContent + 4 more
PASS layout core and inherited selection runner unchanged; zero new *.test.ts files

exit 0
```


### Offline suites and complete ops equality

```text
identity: exit 0
templates-invariants: exit 0
verify-nested-wires: exit 0
verify-invariants: exit 0
verify-m3-topology: exit 0
verify-m45-pins: exit 0
verify-m45-geometry: exit 0
verify-structural-identity: exit 0
verify-lanes: exit 0
verify-static: exit 0
verify-oracle: exit 0
verify-m45-topological-bound: exit 0
verify-m45-evidence: exit 0
templates-ops-output: exit 0
PASS templates: every ops field equals M6 exactly
nested-ops-output: exit 0
PASS nested: every ops field equals M6 exactly
tokens-check: exit 0
```


### Templates ops

```text
$ node --import tsx output/playwright/nested-wires/templates-scene/count-operations.mjs
MEASURE routing=1626; maxLawLeg=38; compile=28407; stages={"wire-registry":907,"lane-allocation":9430,"network":11941,"lane-projection":6129}; roadPairDiscovery=0
MEASURE 16/32 nodes, 29/58 wires: total ops=36814/74259; growth=2.0171402183951757
PASS max law leg <=60; per-wire ceiling; clone total growth <=2.5; instrumented byte identity; every stage once

exit 0
```


### Nested ops

```text
$ node --import tsx output/playwright/nested-wires/count-operations.mjs
MEASURE routing=992; compile=19732; total=27148,46141; maxLeg=41; stages={"capacity":1,"nodes":1,"ports":1,"topology":1,"wire-registry":1,"wire:w01":1,"wire:w02":1,"wire:w03":1,"wire:w04":1,"wire:w05":1,"wire:w06":1,"wire:w07":1,"wire:w08":1,"wire:w09":1,"wire:w10":1,"wire:w11":1,"wire:w12":1,"wire:w13":1,"wire:w14":1,"wire:w15":1,"wire:w16":1,"wire:w17":1,"wire:w18":1,"wire:w19":1,"wire:w20":1,"wire:w21":1,"wire:w22":1,"wire:w23":1,"wire:w24":1,"wire:w25":1,"wire:w26":1,"lane-allocation":1,"main-roads":1,"driveways":1,"network":1,"lane-projection":1}
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
PASS lane allocation + registry compilation=19732 <=20000; components={"wire-registry":928,"lane-allocation":3790,"network":11021,"lane-projection":3993}
PASS per-wire road-pair discovery checks=0
PASS 24/48 nodes: total ops=27148/46141; growth=1.699609547664653 <=2.5; byte-identical instrumented scenes
PASS one-way pipeline: every recorded construction/allocation/projection stage executes exactly once

exit 0
```


### Structural identity

```text
$ node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs
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

exit 0
```


### Templates invariant output

```text
$ node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs
PASS 16 nodes / 9 sections; every node and child inside its owner; finite bounds
PASS minimal nested-only regression and explicit empty-section rejection
PASS two complete builds byte-identical; each one-way pipeline stage once
STAGES ["capacity","nodes","ports","topology","wire-registry","wire:w01","wire:w02","wire:w03","wire:w04","wire:w05","wire:w06","wire:w07","wire:w08","wire:w09","wire:w10","wire:w11","wire:w12","wire:w13","wire:w14","wire:w15","wire:w16","wire:w17","wire:w18","wire:w19","wire:w20","wire:w21","wire:w22","wire:w23","wire:w24","wire:w25","wire:w26","wire:w27","wire:w28","wire:w29","lane-allocation","main-roads","driveways","network","lane-projection"]
PASS all 29 value wires route ok:true
INSPECTION {"corridors":[],"nodeBodies":[],"boundaries":[],"continuity":[]}
PASS all wires inside corridors; gate-mouth crossings only; no body or continuity failures
OVERLAPS []
PASS zero positive-length parallel/coincident wire overlaps
PASS 3c/d all pin rows exact, centered, ordered, pitch 6, >=6 end margins; 192x96 nodes; single-wire pins unchanged; globally unique terminals
PASS four owned port sides; assigned lanes distinct, pitch 6 and forward; all gate positions distinct
PASS all distinct-wire contacts transverse; no parallel touches; each crossing in a registered junction
CROSSINGS {"world":76,"section-1":12,"section-2":0,"section-3":0,"section-4":36,"section-5":0,"section-6":0,"section-7":0,"section-8":6,"section-9":0}
PASS topological endpoint ranges and linked road-order constraints
PASS actual crossing count equals additive endpoint and linked-order lower bound
PASS certificate negative controls reject reorderable ranges, unknown pairs and duplicate crossings
CERTIFICATION 130 certified / 0 uncertified
PASS zero uncertified crossings
PASS exact semantic directory tree and per-directory file order
PASS every gate traversal crosses its own mouth at its assigned distinct offset
PASS turns confined to registered junctions and terminal fans; remaining intervals on assigned lanes

exit 0
```


### Headless DOM / paint / unchanged selection

```text
PASS headless Chrome 153.0.8010.48; six captures at 1920x1440 on 5191; browser errors=0
PASS templates: exact >=3 convergence membership: 15 mouths / 24 wires; default labels hidden; paint tokens match
PASS nested: exact >=3 convergence membership: 7 mouths / 13 wires; default labels hidden; paint tokens match
PASS both scenes: zero visible node port circles/border badges; no node subtitles or section commentary; templates w22 has exactly one imported-name label
PASS converging w22 primary: stroke=5px / opacity=1 / label=hashContent + 4 more; all others dim; paths and camera unchanged; layout=1
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
MEASURE selection five-load median=267.89999997615814 ms
PASS unchanged inherited selection assertions; zero recalculations per click; median <=300 ms
```


### Reproducibility and artifact audit

```text
PASS extractor: two reruns reproduce extended spec/report byte-for-byte; 16 nodes / 9 sections / 29 wires
SPEC sha256=ab6240399d414015cf8c5c51294f5d1e23cc2c5cf40c91fc14352b08d5cf974c
PASS templates-roads-off.png: 1920x1440
PASS templates-roads-on.png: 1920x1440
PASS templates-contract-detail.png: 1920x1440
PASS nested-roads-off.png: 1920x1440
PASS selection-wire-label.png: 1920x1440
PASS approved references, M6.5a tokens, layout core, selection runner, styling/STOP evidence unchanged
PASS inherited selection: layout=1 -> 1; median=267.89999997615814 ms
PASS branch feat/m65b-declutter
```


[Source review](source-review.md) records whole-production-file scores and explicit deductions; [visual review](visual-review.md) records screenshot observations and unresolved general benchmark weaknesses. No colour tuning was needed.

Final gate output:

```text
$ pnpm check
All matched files use Prettier code style!
 Test Files  70 passed (70)
      Tests  208 passed (208)
exit 0
```

The owned 5191 Vite session was stopped with Ctrl-C after verification; its
process exited 130 as expected. The headless browser wrapper closed its own
session in `finally`. Port 5190 was never started, stopped, killed or probed.
