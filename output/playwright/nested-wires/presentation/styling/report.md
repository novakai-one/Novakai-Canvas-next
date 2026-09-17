# M6.5a — styling-only verification report

Executed the amended brief on `feat/m65-presentation`, based on M6 `b20053d`.
The prior STOP commits `5408c25` and `7ad4d8d` remain in ancestry with all their
evidence unchanged. Geometry compacting is withdrawn, deferred to M7.
No push, PR, subagent, new dependency, new `*.test.ts`, inherited-runner edit,
layout-source edit or contact with port 5190 occurred. All browser work used
isolated headless Chrome on the owned 5191 server.


## Resume audit — 2026-09-17

The interrupted run had already committed tokens (`0686a75`) and renderer
(`f0a363f`). Both commits were audited against every amended feature requirement
and retained. No production fix was needed: default color/width use published
tokens; >=3 owned-mouth membership only alters paint; primary restores full
prominence and its original label; selection behavior and all geometry are
unchanged. Only fresh evidence and documentation are finalized by this resume.

Every numbered check was rerun in this session. Full fresh output is retained in
[pnpm-check.txt](pnpm-check.txt), [offline-output.txt](offline-output.txt),
[browser-output.txt](browser-output.txt), and their individual command logs.
[Resume audit output](resume-audit.txt) additionally checks screenshot dimensions,
computed stroke colors, selection-runner identity and preservation of M6/STOP/
approved-reference artifacts. All six newly captured PNGs were personally
inspected against the approved references and the M6 overview.

The initial strict-port startup found the interrupted run's Vite PID 9543 on
5191. Its command and cwd identified this worktree's `apps/web` server. It was
terminated and replaced with this session's own Vite on 5191 (ready in 77 ms).
No operation targeted port 5190. The owned server was stopped after capture.

## Binary DoD

| Item | Status | Evidence |
| --- | --- | --- |
| 1. Full gate / >=208 tests / no new test files | PASS | `pnpm check` exit 0, 70 files / 208 tests; identity audit checks tracked and untracked additions. |
| 2. Zero geometry drift | PASS | Unchanged structural verifier exit 0; fresh complete templates and nested serializations byte-identical to M6; Layout and web host sources/spec unchanged. |
| 3. Both-scene invariant suites | PASS | Templates exit 0: 130 certified / 0 uncertified. All 12 inherited regression entries (including the ops meter) exit 0 unchanged. |
| 4. Every ops number equals M6 | PASS | Full report-object equality, including stages, per-wire/per-leg, invocation and clone values: templates 28,407 / 1,626 / 0; nested 19,732 / 992 / 0. |
| 5. Six headless 1920×1440 captures | PASS | All six captured on 5191 and personally inspected; zero page errors; exact convergence membership and paint values verified. |
| 6. Unchanged M4/M5 selection semantics | PASS | Unchanged selection assertion body is also byte-identical to M5 df05931's runner; all primary/secondary/dim, label, toggle, neighborhood and zero-recalculation assertions pass. |
| 7. README tokens / treatment / STOP / weaknesses | PASS | README appendix publishes all nine tokens, threshold/grouping, selection override, retained STOP record and M7 deferrals; source/visual reviews included. |
| 8. Branch / sliced commits / clean status | PASS at final handoff | `feat/m65-presentation`; four separate local token, renderer, evidence and documentation commits. Final status and `git log --oneline -4` are printed in the handoff after committing this report. |

PASS covers the amended numbered deliverables. External orchestrator reruns and
visual acceptance remain its own decision. The general reference density/polish
bar is **not** claimed satisfied; sparse panels and label scale are explicitly
known-deferred to M7 by the amended brief. See [visual-review.md](visual-review.md).

## DoD 1

Command: `pnpm check` (fresh resume run; existing evidence runners included).
[Complete stdout/stderr](pnpm-check.txt). Sonar <=2 remains enforced, no exemptions.

```text
$ pnpm check
$ pnpm typecheck && pnpm lint && pnpm format:check && pnpm architecture && pnpm test
All matched files use Prettier code style!
Test Files 70 passed (70)
Tests 208 passed (208)
exit 0
```

## DoD 2 — exact M6 verification path

`verify-identity.mjs` loads the **committed M6** semantic `scene-spec.json`, invokes
public `createNestedRoadScene({ spec })`, and compares the entire pretty-printed
serialization plus newline against committed M6 `templates-scene/scene.json`.
The nested fixture gets the same complete byte comparison. No cherry-picked
geometry projection, hash-only shortcut, tolerance or coordinate normalization.

```text
$ node --import tsx output/playwright/nested-wires/presentation/styling/verify-identity.mjs
PASS templates: fresh public builder byte-identical to M6 b20053d; sha256=1940f9b9619a98fd600299aac5f40376184f9d8915d04e8bcbad0b43b4743253
PASS nested: fresh public builder byte-identical to M6 b20053d; sha256=946bb1e9836c4242382a534ab97f4752b24d7bcc230e85be2835f720145a8e8a
PASS all layout, routing, host sources and semantic scene spec unchanged from M6
PASS zero new tracked or untracked *.test.ts files

exit 0
```

Unchanged inherited structural verifier:

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

The 37 lane-index differences printed by the inherited verifier compare to its
older historical `0e5f21e` baseline. Complete equality against **M6 b20053d** above
includes every lane index and pin; this styling pass introduces zero differences.

## DoD 3 — invariants

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

The offline wrapper invokes the inherited M6 regression manifest unchanged.
Its historical-evidence reconciler checks retained artifacts; fresh runtime
geometry checks and freshly republished ops are separate entries.

Command: `python3 output/playwright/nested-wires/presentation/styling/verify-offline.py`

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

Every command's full stdout/stderr and exit code is committed alongside this report:
`verify-nested-wires.txt`, `verify-invariants.txt`, `verify-m3-topology.txt`,
`verify-m45-pins.txt`, `verify-m45-geometry.txt`, `verify-structural-identity.txt`,
`verify-lanes.txt`, `verify-static.txt`, `verify-oracle.txt`,
`verify-m45-topological-bound.txt`, `verify-m45-evidence.txt` and the ops logs below.

## DoD 4 — exact ops equality

The wrapper runs both original AST meters serially and compares the **entire
parsed report objects** to the M6 committed reports. It restores the historical
meter destinations afterwards and republishes fresh results here:
[templates-operations.json](templates-operations.json),
[nested-operations.json](nested-operations.json).

```text
$ node --import tsx output/playwright/nested-wires/templates-scene/count-operations.mjs
MEASURE routing=1626; maxLawLeg=38; compile=28407; stages={"wire-registry":907,"lane-allocation":9430,"network":11941,"lane-projection":6129}; roadPairDiscovery=0
MEASURE 16/32 nodes, 29/58 wires: total ops=36814/74259; growth=2.0171402183951757
PASS max law leg <=60; per-wire ceiling; clone total growth <=2.5; instrumented byte identity; every stage once

exit 0
```

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

## DoD 5–6 — headless captures and unchanged selection

Command: `python3 output/playwright/nested-wires/presentation/styling/verify-browser.py`.
The inherited assertion body is unchanged; only navigation and screenshot
transport destinations are redirected to 5191 and this evidence directory.
The separate paint audit checks each wire against independent M6 mouth groups,
including the <3 control wires and the full-prominence converging w22 selection.

- [templates-roads-off.png](templates-roads-off.png)
- [templates-roads-on.png](templates-roads-on.png)
- [nested-roads-off.png](nested-roads-off.png)
- [nested-roads-on.png](nested-roads-on.png)
- [templates-validation-detail.png](templates-validation-detail.png)
- [selection-wire.png](selection-wire.png)

[Browser paint records](browser.json), [selection measurements](nested-selection.json),
[independent memberships](convergence-memberships.json),
[personal reference comparison](visual-review.md).

```text
PASS headless Chrome 153.0.8010.48; six captures at 1920x1440 on 5191; browser errors=0
PASS templates: exact >=3 convergence membership: 15 mouths / 24 wires; default labels hidden; paint tokens match
PASS nested: exact >=3 convergence membership: 7 mouths / 13 wires; default labels hidden; paint tokens match
PASS converging w22 primary: stroke=5px / opacity=1 / label=w22; all others dim; paths and camera unchanged; layout=1
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
MEASURE selection five-load median=269.59999990463257 ms
PASS unchanged inherited selection assertions; zero recalculations per click; median <=300 ms
```

```text
$ git diff b20053d df05931 -- apps/web/cli/verify-selection.mjs
(empty; exit 0)
PASS current M4/M5 selection body byte-identical to M6 b20053d and M5 df05931
SHA256 27e28c39cf1c50017483ede1954588d21e97ed4a2eadf1d01d482afdaa1eb11e
M5 completion-report.md DoD 8 explicitly runs the unchanged M4 selection wrapper and browser body.
Scope: selection semantics, not the separate M5 drag/swap implementation.
```

M5's separate drag/swap implementation is absent from this branch. It was not
imported or tested: the amended DoD explicitly names selection semantics, and
M5's own DoD 8 names the unchanged M4 selection suite just exercised here.
The initial ambiguity is resolved by byte identity, not an invented M5 result.

## DoD 7–8 — documentation and repository

The [README appendix](../../README.md) publishes the nine token names/roles,
whole-wire convergence treatment, exact counts, reproduction commands and the
known M7 limitations. [Source review](source-review.md) scores the two changed
TypeScript files 146 and 152/160, with per-principle evidence and deductions.
Token generation is verified rather than hand-edited:

```text
$ pnpm tokens:check
{"ok":true,"value":{"generation":"da4fbd01e525aef8551b02ca546b26fb0cb6641d2534140a77f3633c0c5b651b","version":"1.1.0","files":[{"path":"adapters/styles/tokens.generated.css","hash":"8f68bf703316349b1c185cc5a21cc3145f8afe0e8489bcebd55a81be0eed6c55"},{"path":"adapters/styles/semantics.generated.css","hash":"a78481c736eb846a60cc15f530b84c9c0fce48df57963ed170893b444bfa5faf"},{"path":"adapters/styles/themes.generated.css","hash":"afe86fc0d893deb8b032c2eef8b040f0d8c71d5cf83d04c048b3a791890ff188"},{"path":"adapters/styles/preferences.generated.css","hash":"3cf458e8278185f831cb3825a1a9aa47b9a1ef4a916d22b61104eb9ec99b11cd"},{"path":"adapters/styles/layout.generated.css","hash":"27569ca67b877f89d59ad4248d2ec70382ad039fcfce69ce50709a4b4fdd3c18"},{"path":"contract/generated/token-names.ts","hash":"49d9f385d03bef48402b0241b298f3bf4e9c2263663a129ce33b95feeb0ab422"},{"path":"contract/generated/breakpoints.ts","hash":"4dbecc2053787669535f22975cd45b51664fae9765432b209f8369f63bdad754"}]}}
$ node --import tsx capability/design-system/cli/build-tokens.ts --check

exit 0
```

The original [compacting STOP report](../stop-report.md), retained candidate,
probe evidence, all committed M6 geometry/ops/screenshots and approved visual
reference assets have zero diff. Only this new styling evidence directory and
the README appendix are added to prior milestone records.

Final commit log and clean status are printed after the separate evidence and documentation commits,
so this report does not need to contain its own unknowable future commit hash.
