# M6 second resume — repaired and evidenced; sign-off remains open

Resumed `feat/templates-scene` at `fee0a87`. No checkout change, push, PR,
subagent, new dependency, new `*.test.ts`, routing-law change or discovery loop.
All browser work was isolated headless Chrome, using this worktree's own Vite
server on **5190**. Nothing on 5188 was started, stopped or contacted.

**Do not treat this as complete milestone acceptance.** The specific M6 DoD
artifacts below are verified. Two broader acceptance gates remain open:

1. **M5 regression is unverified:** no M5 implementation/runner exists in the
   supplied branch. The brief explicitly locates that work in a separate
   worktree and prohibits touching it. A runner path was requested; no M5 PASS
   is invented. All applicable inherited checks present here pass unchanged.
2. **General visual benchmark is not met:** the required screenshots were
   produced and inspected, but the frozen placement leaves large empty panels,
   small overview labels and a long adapter perimeter route. See
   [visual-review.md](visual-review.md). That report distinguishes actual
   observations from unmeasured contrast/caption metrics. Further placement/
   rendering redesign is outside this brief's authorized production changes.

## Fixes and root causes

- `nested-road-capacity.ts`: final street expansion previously consumed the
  node fan's longitudinal space and shortened gate driveways beyond their own
  port planes. Final driveway admission now includes the gate plane or the full
  node fan plus a quarter-pitch forward stem, using existing port/demand records.
- `nested-lane-projection.ts`: source turns now respect the retained fan end;
  otherwise merely growing the driveway leaves backward or collapsed lane stems.
  Rank-changing bridges use nested rows derived from destination lane ranks.
  Three former `w10/w11/w12` overlaps no longer project onto the same row.
- `prototype-nested-scene.ts` passes the already-built port records to capacity.
  No new pipeline pass/stage, rerouting, intersection search or law extension.
- `?templates` loads the committed semantic JSON through the public builder;
  the host adds directory captions. The default query still chooses its original
  scene. Production review: [resume2-source-review.md](resume2-source-review.md).

Original failing witnesses and the prior STOP reports remain unchanged.
The current report is [invariant-audit.json](invariant-audit.json).

## Binary DoD record

PASS here refers to the exact numbered deliverable; it does not erase the
separate hard-gate/visual limitations above.

| DoD | Status | Verified evidence |
| --- | --- | --- |
| 1. `pnpm check`, ≥208 tests, no new test files | PASS | Exit 0; 70 files / 208 tests; no added tests, dependencies, lockfile or lint suppression. |
| 2. Committed deterministic extractor and exact graph | PASS | Prior extractor commit retained; two consecutive runs byte-identical; 16 production files / nine exact sections / 29 traceable wire rows. |
| 3. `?templates` render and all routes | PASS | Headless Chrome: 16 filename labels / 29 wire elements / nine directory groups; all node bounds inside viewport and owning sections; `wiring.ok:true`. |
| 4. Full templates invariants and certification | PASS | All containment/body/gate/continuity arrays empty; no overlaps or parallel touches; exact pin rows, planar fans, forward lanes, turn scope, determinism, stages once; 130 certified / zero uncertified. |
| 5. Ops, clone and browser timing | PASS | All stage counts published; maximum law leg 38; road-pair discovery 0; 32-node/58-wire fresh-ID clone 2.017140×; five loads median 374.5 ms; written scaling estimate and limitations. |
| 6. Required headless screenshots | PASS | Both PNGs 1920×1440, fit-view, real filenames; personally inspected. General visual benchmark remains open as stated above. |
| 7. Unchanged nested structural identity | PASS | Unchanged verifier exit 0; fresh full JSON byte-identical to retained canonical scene; frozen sections/nodes/roads/gates/routes intact. |
| 8. README | PASS | Appended extraction rules/counts, geometry corrections, ops, scaling answer, real hubs, screenshots and limitations. |
| 9. Branch / sliced commits / clean tree | PASS at final handoff | Three logical commits on `feat/templates-scene`; final `git status` and `git log --oneline -4` pasted in the handoff reply. No push/PR. |

### DoD 1 — check output

Command: `pnpm check`. Full output:
[resume2-pnpm-check-output.txt](resume2-pnpm-check-output.txt).

```text
$ pnpm typecheck && pnpm lint && pnpm format:check && pnpm architecture && pnpm test
$ tsc --noEmit
$ eslint .
All matched files use Prettier code style!
Test Files  70 passed (70)
Tests  208 passed (208)
```

`git diff fee0a87 -- '*.test.ts' '*lock*' '*package.json'` is empty.
Old runner, `nested-wire-law.ts` and `nested-wire-routing.ts` diffs are empty.

### DoD 2 — extraction output

Command: `node --import tsx output/playwright/nested-wires/templates-scene/extract-scene.mts`
(two consecutive invocations). [Full record](resume2-extraction-output.txt).

```text
RUN 1: 16 nodes / 9 sections / 29 wires; 45 dropped declarations
RUN 2: 16 nodes / 9 sections / 29 wires; 45 dropped declarations
PASS diff scene-spec.json: byte-identical
PASS diff extraction-report.md: byte-identical
PASS every one of 29 wires has an extraction-report table row
PASS production source tree: exactly 16 TypeScript files excluding tests
```

### DoD 3, 4 — full geometry and certification output

Command: `node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs`.
[Full output](resume2-invariant-output.txt).

```text
PASS 16 nodes / 9 sections; every node and child inside its owner; finite bounds
PASS minimal nested-only regression and explicit empty-section rejection
PASS two complete builds byte-identical; each one-way pipeline stage once
PASS all 29 value wires route ok:true
INSPECTION {"corridors":[],"nodeBodies":[],"boundaries":[],"continuity":[]}
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
```

The prover is reimplemented in the new runner; the existing prover is unchanged.
Its 84 independent endpoint certificates plus 46 linked-order crossings sum to
130. All proof rectangles are pairwise disjoint. Terminal proof regions extend
through their owned planar fans to node pins, using the exact centered pin-row
coordinate domain; tangential final fan legs do not create extra boundary arms.
Endpoint and linked certificates for the same wire pair are additive only in
separate proof regions. Duplicate and unknown crossings fail negative controls.
Offline Boolean enumeration is proof machinery, not application lane search.

### DoD 5 — operations and scaling output

Command: `node --import tsx output/playwright/nested-wires/templates-scene/count-operations.mjs`.
[Output](resume2-operations-output.txt), [all stages](operations.json).

```text
MEASURE routing=1626; maxLawLeg=38; compile=28407; stages={"wire-registry":907,"lane-allocation":9430,"network":11941,"lane-projection":6129}; roadPairDiscovery=0
MEASURE 16/32 nodes, 29/58 wires: total ops=36814/74259; growth=2.0171402183951757
PASS max law leg <=60; per-wire ceiling; clone total growth <=2.5; instrumented byte identity; every stage once
```

Unlike the older synthetic probe, this clone doubles **the full graph**, including
29→58 requests with fresh node IDs and 9→18 section IDs. Instrumented/uninstrumented
JSON matches for both scenes. No uniform dense-graph complexity bound is asserted.
For similar graph depth and degree, ~150 nodes / 300 wires extrapolates to roughly
0.35–0.38 million counted operations and ~16,821 routing operations. Shared-path
comparison/sorting and local junction incoming×outgoing products can compound as
congestion increases; the measured graph clone grows 2.017×, not superlinearly in
a way that breaches the 2.5× guard. See README for the operation-meter exclusions.

### DoD 6 — headless browser output

Command: `python3 output/playwright/nested-wires/templates-scene/capture.py`.
[Browser record](browser.json).

```text
PASS headless Chrome 153.0.8010.48; 1920x1440 fit view; 16 labels / 29 wires; layout=1; errors=0
MEASURE five loads=[393.89999997615814,374.5,352.09999990463257,368.89999997615814,406.39999997615814]; median=374.500 ms
```

- [templates-roads-off.png](templates-roads-off.png)
- [templates-roads-on.png](templates-roads-on.png)
- Supplementary [templates-contract-detail.png](templates-contract-detail.png)

M6 asks to publish median time, without supplying a templates timing ceiling.
The inherited default-scene timing ceiling is still met (253.1 ms ≤300).
The larger real graph is not represented as passing a synthetic 300 ms target.

### DoD 7 — identity and inherited regressions

Command: `node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs`.
[Unabridged output](verify-structural-identity-regression.txt).

```text
PASS frozen nodes: byte-identical to 0e5f21e
PASS frozen sections: byte-identical to 0e5f21e
PASS frozen road ids + bounds: byte-identical to 0e5f21e
PASS frozen wire routes (ordered road sequences): byte-identical to 0e5f21e
PASS frozen gates: byte-identical to 0e5f21e
MEASURE per-wire lane-index diffs=37
PASS deterministic regeneration: two fresh scene serializations byte-identical
PASS current canonical scene matches fresh public builder: 24 nodes / 26 wires
PASS zero new tracked *.test.ts files
```

The 37 lane-index differences are inherited M4.5 differences from `0e5f21e`,
not differences from the resume head or canonical `?nested` JSON.

All invoked inherited runners are unchanged:
`verify-nested-wires.ts`, `verify-invariants.mjs`, `verify-m3-topology.mjs`,
`verify-m45-pins.mjs`, `verify-m45-geometry.mjs`, `verify-structural-identity.mjs`,
`verify-lanes.mjs`, `count-operations.mjs`, `verify-static.py`, `verify-oracle.py`,
`verify-m45-topological-bound.py`, and `verify-m45-evidence.py` exit **0**.
Their separate stdout files are retained here; [regressions.json](regressions.json)
indexes the live geometry/ops runs. Historical canonical operation/browser
artifacts were restored after reruns rather than rewriting earlier milestone
reports. Fresh default counts are [nested-operations.json](nested-operations.json):

```text
routing=992; maxLawLeg=41; compile=19732 <=20000
total=27148/46141; clone growth=1.699609547664653 <=2.5
```

The historical evidence-reconciliation script validates its retained artifacts;
it is not substituted for the fresh source/runtime checks above.

The unchanged `apps/web/cli/verify-selection.mjs` assertion body runs headlessly
through a page transport redirect from its hardcoded 5188 URL to the owned 5190
server. Only navigation/screenshot destinations are adapted; no assertion or
runner file changes. [Report and runner hash](nested-selection.json),
[full stdout](nested-selection-output.txt):

```text
PASS default nested browser selection; unchanged runner assertions; median <=300 ms
MEASURE inherited selection five-load median=253.10000002384186 ms
```

Historical superseded pre-M4.5 pin-freeze or deliberate STOP scripts are not
misrepresented as current acceptance gates. M5 is **not present and unverified**.

### DoD 8, 9

README append includes the extraction rules, all counts, full operation figures,
scaling answer, real-hub interpretation, screenshots and visual limitations.
The source review records every changed production file above 144/160, with
specific deductions and no lint exceptions. The final handoff includes the four
commit lines and clean branch status. No push or PR is authorized or performed.
