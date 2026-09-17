> **M4.5 current result (final ruling, 2026-09-17):** junction-aware assignment and coordinated turns reduce S1 **28→18**, J21 **6→2**, S2 **4→2**, S3 **2→0**, S4 **4→3**, world **8→0**. Budgeted crossings are **0 everywhere**. Every one of the **23 remaining crossings is individually certified; uncertified = 0**. The accepted S1 floor **17 = 14 + 3** and both proof commits remain. Earlier STOP narratives below are historical and superseded by [the completion report](m45-completion-report.md).

> **M4.5 STOP (corrected brief, 2026-09-17):** junction-aware lane assignment is allowed, including moved wire centerlines on roads and derived pins. A new independent proof still certifies **S1 >=14 unavoidable crossings**, above the unchanged <=11 target, under frozen routes and right-hand traffic. See [the full STOP report and all DoD statuses](m45-stop-report.md), [reproducer](verify-m45-topological-bound.py), and [14 individual witnesses](m45-topological-bound.json). No production geometry changed; counts remain S1 28→28, S2 4→4, S3 2→2, S4 4→4, world 8→8; budgeted 0→0 everywhere. M4.5 is not complete.

> **Current acceptance: M4 completed under orchestrator ruling #3.** Canonical JSON now describes 24 nodes / 26 wires. Earlier STOP narratives and candidate snapshots below are retained as history; see the final M4 section and [end-to-end DoD report](m4-completion-report.md).

# M3 — wire capacity and deterministic lanes

Implementation on `feat/wire-lanes`, based on M2 `2c8ca32`. The amended 2026-09-17 brief admits clean perpendicular junction crossings whether turning or straight-through; same-axis overlap and parallel touching remain forbidden. The earlier STOP reports and candidate patch are historical evidence, superseded by the installed implementation and the M3 results below. No push, PR, new test file, Vite restart, or subagent.

## Pipeline and geometry

Capacity → nodes → ports → reservation topology/contact registry → unchanged law demand → lane allocation → final street/driveway geometry → final network → lane projection. Each stage executes once. Reservation rectangles encode fixed construction ownership and the law's road assignments before widths are fixed; they are not a first final scene. The law runs once per attempted leg at zero reservation offset. Projection consumes those retained assignments and never searches/reroutes. The operation report asserts one invocation per stage and byte-identical instrumented/uninstrumented results.

`nested-wire-law.ts` is byte-identical to M2: band → shared road → quadrant corner, no search. The two rejected original pairs remain the known deferred law-coverage limitation; the six orchestrator substitutions are implemented exactly. All 18 routes are admitted. The original nodes, sections and ports are unchanged.

**Published width function: `f(n) = 12 + 12 × n`**, for every street and every node/gate driveway; there is **no extra driveway margin**. Named lane pitch = **6** scene units. Lane centers on each direction's side are `(index + 0.5) × 6`, signed for right-hand traffic: east/south use positive-y/negative-x respectively. Wire-ID order within a direction determines its outward index. Opposing directions occupy opposing sides. Empty roads are 12 units wide; one lane 24; two lanes 36. The extra symmetric width permits either direction's entire demand without a second geometry pass.

A shared gate is a mouth: each wire crosses at its assigned offset inside that driveway's width. Node terminals remain exact owner-port points and fan immediately into distinct driveway lanes. Street end caps now consume final neighboring street widths; this removes the recorded `world:vertical:1344:1184` / `drive:section-1:exit-bottom` overlap. Final driveway ends attach to those same final street edges through existing construction contacts.

## Verified results

| DoD | Evidence/result |
|---|---|
| 1 | `pnpm check`: 70 files, **208 tests**, exit 0; **zero new .test.ts files**; see `m3-final-checks.txt`. |
| 2 | `ok=true`, **18 wires**, exact prescribed pairs and all three shared-gate equalities; `m3-lanes-output.txt`. |
| 3a–g | All lane, mouth, global segment, right-hand, sharing, width, node/boundary/containment, terminal and byte-determinism checks PASS; `verify-lanes.mjs`, `verify-invariants.mjs`. |
| 4 | Route demand **668 ≤700**; maximum executed law leg **43 ≤60**; lane allocation + registries/network/projection **13,922 ≤15,000**; per-wire road-pair discovery **0**. |
| 5 | Five loads **[282, 279.1, 239.8, 260.7, 249.9] ms**; median **260.700 ms**, recorded in `m3-browser.json`; M2 **243.7 ms**, M3 ceiling **280 ms**. Total-op clone probe: **19,563 →36,124**, **1.8465470531× ≤2.5**. |
| 6 | Every unchanged selection assertion passes for 18 wires; every click preserves layout count **1 →1**, geometry and camera; `m3-selection-output.txt`. |
| 7 | Width function, complete metrics and scaling interpretation are published here. |
| 8 | Four named M3 screenshots personally inspected at overview and reading zoom; visual findings below. |
| 9 | Canonical `scene.json`, `oracle.json`, `calculations.json`, `metrics.json` regenerated for 18 wires. |
| 10 | Logical local commits on `feat/wire-lanes`; final clean status and six-commit log in the delivery report. |

Full pasted outputs are collected in `m3-verification.txt` and the per-check output files. `m3-source-review.md` records whole-file scores **146–152/160**, all above 144; Sonar ≤2 is enforced by the full gate. No new lint exemption.

### Operations and scaling

Same M1.5 op definition: one executed numeric addition, subtraction, `abs`, or numeric comparison is one operation; min/max charge n−1 comparisons. Multiply/divide, string/identity comparisons, lookup/allocation and native collection internals are excluded; comparator arithmetic is counted. Every reachable Layout core module is instrumented, including projection; no arithmetic is hidden in an unmetered helper.

| Wire | Routing operations |
|---|---:|
| w01 | 11 |
| w02 | 15 |
| w03 | 15 |
| w04 | 11 |
| w05 | 15 |
| w06 | 34 |
| w07 | 32 |
| w08 | 15 |
| w09 | 26 |
| w10 | 72 |
| w11 | 41 |
| w12 | 106 |
| w13 | 32 |
| w14 | 11 |
| w15 | 11 |
| w16 | 69 |
| w17 | 45 |
| w18 | 107 |
| Total | **668** |

Multi-gate wires have multiple law legs; every actual invocation, including rejected gate attempts, is measured separately and ≤43. The lane/registry total includes wire registry **868**, lane allocation **889**, network compile **10,340**, and lane projection **1,825**: **13,922**. Final width/cap geometry (**982 streets +792 driveways**) and reservation topology (**2,655**) are separately visible construction stages. Nothing is omitted from the full **19,563** total. Initialization is separately listed. M1 baseline routing was 417 for 12 wires; network compilation was 11,575.

The 44-node probe clones all four sections at +1920 south, preserves every node/port/parent relationship, and retains the specified 18-wire request list (it does not invent a second set of requests). Both normal and instrumented clone serializations match. Its full **36,124** operations are **1.8465×** the 22-node scene. This is full-pipeline growth, not just a selected cheap stage.

**Lane allocation at 100 nodes / 200 wires costs what?** Under the measured fixture's bounded road/junction degree and average road legs per wire, allocation plus projection extrapolates to `(889 +1825) ×200/18 ≈30,156` numeric ops; construction registries/network add `(868 +10340) ×100/22 ≈50,945`, giving **about 81,101 ops** for that combined work. Pure lane assignment alone is approximately **9,878 ops**. Routing demand would separately be about **7,422 ops**. These are explicit estimates, not a measured 100-node result or proof that 200 arbitrary wires fit the reserved space.

Demand is grouped once by named road, sorted once per road by wire ID, then projected once. There are no per-wire road-pair searches or repeated geometry stages. Buckets append locally rather than repeatedly copying a growing road population. For L traversals, the allocation sorting term is `Σ k_r log(k_r)` (and restoring each wire's retained order); bounded congestion/leg count behaves approximately linearly. Concentrating every wire on one road or increasing containment depth is not promised constant cost. Geometry/network work is proportional to emitted contacts with local ordering terms. The measured clone does not compound; worst-case sorting and output density are stated rather than hidden.

### Browser, visual review and limits

Four required captures: `m3-overview.png`, `m3-corridor-s2s4.png`, `m3-corridor-s3s4.png`, `m3-shared-rows.png`. Parallel lanes remain evenly spaced through shared mouths and bends; two-wire roads visibly exceed empty roads in width. The full overview contains all 22 nodes/18 wires, and shared-row reading zoom includes both S2 and S3. Required corridors were inspected against the approved AWS/Docker hierarchy and routing references. Reference assets are unchanged.

Inherited plain node cards and sparse fixture padding remain: M3 does not restyle the approved M1/M2 prototype into an infographic or change its frozen placement. Wire labels are hidden by default and appear only for primary wire selection, as M2 requires. Road lines and section borders are contextual separators. Section crossing counts: **S1=0, S2=3, S3=0, S4=2, world=0**, all within the dense-map budget of six. The M3 global audit rejects every coincident overlap and parallel touch; perpendicular point crossings are accepted only inside registered junctions. The w05/w06 straight crossing is now correctly legal.

The exact requested `apps/web/cli/verify-selection.mjs` changes only topology expectations; all of its assertions pass. Use **`verify-m3-selection.py`** to run it with M3's 280 ms ceiling. The historical M2 wrapper `apps/web/cli/verify-selection.py` has an additional PNG-byte-equality assertion and an older M1-relative timing ceiling. Its PNG identity check currently fails despite identical geometry and identical computed styles after clearing: an observed screenshot raster difference, not claimed fixed or silently relaxed in that legacy wrapper. The M3 runner does not claim this extra legacy check passed. This limitation and the failed diagnostic are retained explicitly; selection semantics, op counts and timing are independently measured.

The regenerated independent oracle searches rectilinear road rectangles, directed driveways and **assigned gate-lane crossings**. It reads no routing law or application route graph. Its shortest distances are conditional on the legal gate allocations; they must not be compared to M1's unrestricted gate-choice centerline oracle as though the constraint sets were identical. All original 12 wires stay within 10% of this oracle. New w14 measures **162 vs144 =12.5%**, reflecting its outward shared-port lane; the M3 brief specifies no detour ceiling for added wires. All 18 measurements, including this one, are published, not filtered out.

## Reproduce

Leave the existing Vite on port 5188 running. From the repository root:

```sh
pnpm check
pnpm exec tsx apps/web/cli/verify-nested-wires.ts
node output/playwright/nested-wires/verify-lanes.mjs
node --import tsx output/playwright/nested-wires/verify-invariants.mjs
node --import tsx output/playwright/nested-wires/count-operations.mjs
python3 output/playwright/nested-wires/verify-static.py
python3 output/playwright/nested-wires/verify-oracle.py
python3 output/playwright/nested-wires/verify-m3-selection.py
python3 output/playwright/nested-wires/capture-m3.py
python3 output/playwright/nested-wires/verify-m3-evidence.py --write
```

Run browser measurements without the concurrent full test suite. Replacing timing/screenshots requires refreshing metrics and their recorded sample. The original `before.json`, M1/M1.5 outputs and named historical STOP evidence remain provenance, not current acceptance results.


## Historical M4 attempt — STOP at global lane geometry (2026-09-17)

**Resumption under ruling #2:** stopped on a separate acceptance contradiction before changing source. The immutable M3 scene has six shared node sides, but the amended preservation exception covers only `node-12:exit-bottom`. Five other shared sides must change to satisfy universal distinct pins. See [the current STOP report](m4-pin-ruling-stop-report.md), [standalone witness](verify-m4-pin-preservation.mjs), and [pasted output](m4-pin-preservation-output.txt). The law extension and complete default preservation remain intact; all 26 hub wires still route. The narrative below records the previous attempt.

The revised opt-in semantic spec and admitted-direction law extension are present as **uncommitted candidate code**, not an accepted milestone. Default input remains 22 nodes / 18 wires and its complete pretty-printed JSON plus trailing newline equals `2f9b762:output/playwright/nested-wires/scene.json` byte-for-byte. The opt-in `fanInHubSceneSpec` routes all 26 prescribed wires across 24 nodes. Construction contains no node-23/24 branch: additions are semantic spec membership. Gate selection retains the existing ordered candidate traversal, preferring legacy-admitted pairs; the extension resolves fixed-terminal access directions and mirrors corners by axis. It adds no road/path search.

**STOP:** `verify-lanes.mjs` exits 1. It reports a 12-unit `w19/w23` overlap at `(695,651)` and the left hub fan's nonjunction crossing at `(596,848)`. A separate final-segment witness proves `w20/w21` share 12 units ending at `(608,848)`. Left-port arrivals are `w20,w21,w22,w24`: four distinct lanes, offsets in wire-ID order, driveway width **60 = 12 + 12×4**. The top port receives `w19,w23` (two lanes, width 36). Correct widening does not resolve convergence at an exact terminal.

For this selected left port, orthogonal paths avoiding the node interior can approach its boundary point only from west, north or south. Four positive-length final segments therefore necessarily share a ray and overlap. This is a proof about **the current four-at-one-port assignment**, not a proof that every alternative law for the six-wire scene is impossible. The existing M3 fan formula was only sufficient for up to two arrivals. Merely changing its bend spacing cannot fix four arrivals while retaining exact terminals, orthogonality and no merging. No invariant was weakened, no extra hub port added, and no pair substituted. Also, a future 25-import hub with two exact entry points exceeds the geometric maximum of six separate orthogonal terminal approaches regardless of widening; a cost estimate alone would hide that limitation.

Evidence: `m4-lanes-output.txt`, `m4-candidate-scene.json`, `m4-checks.txt`, and `m4-stop-report.md`. The canonical accepted scene/oracle/calculations/metrics remain M3 evidence. Operation, load, selection, oracle and visual acceptance were not pursued after this STOP, and no M4 scaling-cost claim is made. No browser was opened or attached; port 5188 was left running. The four selection PNG modifications predate this attempt and were retained untouched.

## Historical M4 corrected six-side ruling — STOP at visual crossing budget (2026-09-17)

The earlier terminal and preservation STOPs are resolved. **M4 remains incomplete.** The current blocker is the retained visual benchmark in `docs/maintenance/diagram-quality-improvements.md`: at most six crossings per dense section. M3 enforced that threshold in `verify-m3-evidence.py`. The 24-node scene has **S1=28, S2=4, S3=2, S4=4, world=8**. The new standalone `verify-m4-visual-budget.py` exits 1; all 28 S1 crossings also have alternating boundary endpoints at their assigned junctions. Local bend changes cannot remove these crossings while preserving the current lane approaches. This is a lower bound for the current placement and assignments, not a claim that every possible semantic placement is impossible. The brief permits perpendicular junction crossings, but does not explicitly retire this separate repository quality budget; it has not been silently removed.

Full binary status, pasted output and next decision: [current STOP report](m4-visual-budget-stop-report.md). Complete runner output: [m4-verification.txt](m4-verification.txt). The new source and scripts remain uncommitted candidate work on `feat/fan-in-hub`. No push, PR, headed browser or real-browser attachment. Port 5188 remains the original PID 13216. The four pre-existing `output/playwright/selection/*.png` modifications remain untouched; M4 selection captures use distinct filenames here.

### Implemented and verified candidate

- Semantic opt-in `fanInHubSceneSpec`: 24 ordinary nodes, 26 exact requests. The public builder still defaults to M3's 22/18 input; the isolated browser prototype opts into M4.
- Admitted-direction law extension retains valid legacy choices. Gate alignment computes its direction scores once instead of recomputing the same numeric differences per comparator; this saves 52 routing ops without changing geometry.
- Every shared side uses a centered row of unique pins at pitch 6, in its right-hand lane order. Single-wire terminals remain exact legacy points. All nodes remain 192×96; all row margins are at least 6. Hub left: four lanes, width 60, pin coordinates `(608,839)`, `(608,845)`, `(608,851)`, `(608,857)` for w20,w21,w22,w24; margins 39. Hub top: two lanes, width 36, pins `(707,800)`, `(701,800)` for w19,w23; margins 93.
- An inward rank change through an occupied destination rank uses a fixed median dogleg inside the existing junction. This avoids collinear approach overlap in the new scene. It uses assignment ranks, with no collision search, retries, hub IDs or new road scans. Every default-scene byte outside the six independently calculated terminal fans remains identical to immutable M3 evidence.
- `verify-lanes.mjs --oracle` passes all geometry, distinct lanes/pins, right-hand traffic, assigned-mouth crossing, containment, planar fan and full determinism assertions. The former shared-terminal exemption is removed. The six permitted default fans are asserted as complete exact segment replacements, not omitted from comparison.

| Metric | Candidate measurement |
| --- | ---: |
| Full gate | `pnpm check` exit 0; 70 files, 208 tests; zero new `.test.ts` files |
| Routing operations | 992 / 1,000 |
| Maximum executed law leg | 41 / 60 |
| Wire registry | 928 |
| Lane allocation | 1,414 |
| Network compile | 11,021 |
| Lane projection | 3,013 |
| Lane allocation + registry/network/projection | 16,376 / 20,000 |
| Per-wire road-pair discovery | 0 |
| One-way stages | Every recorded stage exactly once |
| Full 24/48-node probe operations | 22,800 → 40,813; **1.7900438596×** / 2.5× |
| Headless capture load samples (ms) | 299.2, 246.6, 246.2, 250.3, 241.4 |
| Capture median (ms) | **246.6** / 300 |
| Separate headless selection loads (ms) | 297.4, 248.2, 247.3, 248.7, 252.4 |
| Selection median (ms) | **248.7** / 300 |
| Selection | Every item PASS, including hub/api neighborhoods; counter 1 → 1, camera/geometry unchanged |

| Wire | Length | Assigned-gate oracle | Detour |
| --- | ---: | ---: | ---: |
| w19 | 322 | 310 | 3.8710% |
| w20 | 168 | 156 | 7.6923% |
| w21 | 2,865 | 2,763 | 3.6916% |
| w22 | 2,038 | 1,978 | 3.0334% |
| w23 | 3,333 | 3,285 | 1.4612% |
| w24 | 4,825 | 4,663 | 3.4742% |
| w25 | 639 | 621 | 2.8986% |
| w26 | 2,340 | 2,274 | 2.9024% |

None of w19–w26 exceeds 10%. For transparency the entire 26-wire oracle is retained: existing w02 is **FLAG 10.3576%** on re-gridded geometry. M4 withdraws original-wire coordinate preservation on this scene. The oracle still independently searches directed road rectangles at assigned gate-lane crossings; it does not import routing code.

### Scaling answer

**A hub receiving 25 wires at 150 nodes / 300 wires costs what, and why doesn't it compound?** Pin placement and terminal fan materialization cost O(25) for that hub. Grouping demands happens once; wire-ID ordering costs `Σ k_r log k_r` across occupied roads, so a concentrated 25-wire bucket has O(25 log 25) ordering work rather than 25 reruns of layout. The numeric-op meter excludes native/string sort comparisons, so that complexity term is stated separately, not smuggled into the measured numeric-op estimate. There is no per-wire road-pair search or repeated geometry pass.

At the fixture's measured average road-leg count, lane allocation plus projection extrapolates to `(1414 + 3013) × 300/26 ≈ 51,081` numeric ops; registry/network construction to `(928 + 11021) ×150/24 = 74,681`, or approximately **125,762 combined numeric ops**. Routing separately extrapolates to `992 ×300/26 ≈11,446`. Allocating/projecting 25 average fixture wires would be about **4,257 ops**, but a real concentrated hub's path lengths and bucket congestion can differ. These are explicit extrapolations, not a measured 150-node fixture or a universal capacity guarantee. The measured 24→48 clone is 1.79× and retains 26 requests; it isolates construction growth, not doubled traffic.

Finite geometry remains a hard limit: pitch 6 plus one-pitch end margins permits **15 pins on a 96-unit side** and **31 on a 192-unit side**. Thus 25 arrivals cannot all use a left side; a 25-pin top row fits its side (144-unit span, 24-unit margins), but its **312-unit driveway width** and fan depth still require a full capacity/containment check. No resizing or future 25-wire capacity promise is hidden in the cost answer.

### Visual inspection and evidence policy

Personally inspected `m4-overview.png`, `m4-hub-closeup.png` and `m4-roads-off.png`, all captured headlessly. **With roads off, the hub reads as an organised fan, not a knot:** four distinct stair-step left arrivals and two distinct top arrivals. Closeup shows their separate terminal stems. No terminal merging or co-terminal stem crossing remains. The node card still describes four port sides; pins subdivide those sides without adding ports.

The broader scene nevertheless exceeds the inherited crossing budget, so these screenshots are candidate evidence, not complete visual acceptance. Plain node cards, sparse fixture padding and hidden-by-default labels retain the earlier prototype presentation scope; no reference images, design tokens or visual floors were rewritten. No subagent review was run, following the explicit project prohibition.

Canonical `scene.json`, `oracle.json`, `calculations.json`, `metrics.json` remain the accepted M3 files. Current 26-wire data is preserved as `m4-candidate-{scene,oracle,calculations,metrics}.json`, with status STOP. DoD 9 and the clean-commit part of DoD 10 remain incomplete. Run current geometry with `node output/playwright/nested-wires/verify-lanes.mjs --oracle`; the deliberately failing visual gate is `python3 output/playwright/nested-wires/verify-m4-visual-budget.py`. Headless browser runners are `capture-m4.py` and `verify-m4-selection.py`; neither starts or stops Vite.


## M4 completed under crossing-budget ruling #3 — 2026-09-17

All executable milestone gates pass, including the retained crossing ceiling. The earlier visual-budget STOP is superseded by the explicit orchestrator ruling: only perpendicular (≥60°) single-point crossings inside registered junctions are excluded. Every excluded intersection is listed with its wire pair, coordinates, angle, registered junction IDs and reason in `m4-visual-budget.json` and `m4-visual-budget-output.txt`. Shallow intersections, collinear contacts/overlaps and crossings outside registered junctions stay budgeted. The same verifier checks negative controls and rejects seven budgeted crossings. Legal junction totals remain an uncapped M4 health metric for the M4.5 reduction target.

| Region | All crossings | Excluded legal junction crossings | Budgeted crossings / ceiling |
| --- | ---: | ---: | ---: |
| Section 1 | 28 | 28 | 0 / 6 |
| Section 2 | 4 | 4 | 0 / 6 |
| Section 3 | 2 | 2 | 0 / 6 |
| Section 4 | 4 | 4 | 0 / 6 |
| World | 8 | 8 | 0 / 6 |

| Final metric | Re-verified result |
| --- | --- |
| Full repository gate | `pnpm check` exit 0; 70 files / 208 tests; zero new `.test.ts` files |
| Semantic topology | 24 nodes / 26 wires; node-23 receives exactly w19–w24; node-24 sends w25/w26 |
| Default preservation | Complete immutable M3 serialization, except the six exact independently computed terminal fans |
| Hub left driveway | 4 ordered lanes; width 60 = 12 + 12×4; unique pins and planar stems |
| Pin capacity | Every side centered/ordered at pitch 6; ≥6 end margins; nodes unchanged at 192×96 |
| Routing | 992 / 1,000 numeric ops; maximum executed law leg 41 / 60 |
| Registry + allocation + network + projection | 928 + 1,414 + 11,021 + 3,013 = **16,376 / 20,000** |
| Road-pair discovery | 0 per wire |
| One-way stages | Each capacity/placement/ports/topology/registry/wire/allocation/roads/driveways/network/projection stage exactly once |
| 24→48 node clone | 22,800 → 40,813 total numeric ops; **1.7900438596× / 2.5×** |
| Five headless capture loads | [291.7, 247.6, 249.5, 249.4, 249.5] ms; **median 249.5 ms / 300** |
| Five separate headless selection loads | [275.6, 247.4, 250.4, 248.7, 244.9] ms; **median 248.7 ms / 300** |
| Selection | Every assertion PASS, including both new neighborhoods; counter 1→1; geometry and camera unchanged; labels hidden initially |
| Source review | All 12 changed application files >144/160 (minimum 145); Sonar ≤2 and import gate passed; see `m4-source-review.md` |
| Canonical evidence | `scene.json`, `oracle.json`, `calculations.json`, `metrics.json` regenerated and reconciled for M4 |

| Wire | Length | Assigned-gate oracle | Detour |
| --- | ---: | ---: | ---: |
| w19 | 322 | 310 | 3.8710% |
| w20 | 168 | 156 | 7.6923% |
| w21 | 2,865 | 2,763 | 3.6916% |
| w22 | 2,038 | 1,978 | 3.0334% |
| w23 | 3,333 | 3,285 | 1.4612% |
| w24 | 4,825 | 4,663 | 3.4742% |
| w25 | 639 | 621 | 2.8986% |
| w26 | 2,340 | 2,274 | 2.9024% |

No w19–w26 detour exceeds 10%. Existing w02 remains transparently flagged at 10.3576% on the re-gridded M4 scene; flags request orchestrator visual review and do not automatically fail this milestone.

**Scaling answer re-verified:** a hub receiving 25 wires at 150 nodes / 300 wires has O(25) pin/fan materialization and an O(25 log 25) concentrated ordering bucket, with no per-wire road-pair discovery or rerun of layout. At the measured average wire/road-leg mix, 25 wires extrapolate to ~4,257 allocation/projection ops. Whole-scene construction/allocation/projection extrapolates to ~125,762 numeric ops and routing to ~11,446; these are estimates, not a measured 150/300 fixture. Native string-sort comparisons are outside the defined numeric-op meter and are accounted for by the explicit sorting term. The measured clone doubles nodes, retains 26 requests, and isolates construction growth. A 25-wire row fits a top side (31-pin limit) but not a left side (15-pin limit); its 312-unit driveway still needs geometry admission. Concentration therefore adds local demand/order work rather than repeated global passes, but finite geometry and increasing legal junction crossings still need structural follow-up.

**Visual judgment:** personally inspected the regenerated overview, roads-off view and hub closeup alongside the retained AWS and Docker references. **The roads-off hub reads as an organised fan, not a knot.** Four distinct stair-step left arrivals and two top arrivals remain traceable, with unique stems at the terminal row. The orchestrator's supplied inspection agrees. Nested hierarchy and aligned actors are clear; sparse prototype spacing/plain cards and labels hidden by default remain the inherited prototype presentation scope, not a claim of full infographic polish. Reference images and design tokens are preserved. No subagent review was run under the explicit user/project prohibition.

The screenshots were regenerated through isolated headless Playwright sessions. `m4-roads-off.png` comes from unchecking the visible “Show roads” control. Browser runners do not start/stop Vite. The inherited PID 13216 served all browser evidence but was found absent during the final post-commit health check. No stop/kill command was issued. Vite was restored with `pnpm prototype:roads` on port 5188 and an HTTP 200 health check passed; the reason for the inherited process exit is unknown. No user browser was opened or attached, and nothing was pushed or submitted as a PR. The inherited `output/playwright/selection/*.png` changes are retained in the evidence commit; current M4 selection evidence uses the dedicated `m4-selection-*` names. Candidate JSON and named STOP reports remain historical snapshots, never inputs to current acceptance.

### Reproduce final M4 acceptance

From the repository root, with the existing Vite on port 5188:

```sh
pnpm check
pnpm exec tsx apps/web/cli/verify-nested-wires.ts
node --import tsx output/playwright/nested-wires/count-operations.mjs
node --import tsx output/playwright/nested-wires/verify-invariants.mjs
python3 output/playwright/nested-wires/verify-static.py
python3 output/playwright/nested-wires/verify-oracle.py
node output/playwright/nested-wires/verify-lanes.mjs --oracle
python3 output/playwright/nested-wires/verify-m4-visual-budget.py
python3 output/playwright/nested-wires/capture-m4.py
python3 output/playwright/nested-wires/verify-m4-selection.py
python3 output/playwright/nested-wires/verify-m4-evidence.py --write
```

Run browser loads after the CPU-heavy gate completes. Preserve `pnpm check` output in `m4-final-checks.txt` when updating acceptance evidence. `verify-m4-evidence.py` without `--write` checks canonical metrics rather than replacing them; `--final` additionally requires the requested branch and a clean working tree and prints the six-commit log. Full output and the binary DoD table are in [m4-completion-report.md](m4-completion-report.md).


## M4.5 corrected <=16 gate — STOP (2026-09-17)

The original independent-endpoint bound 14 remains valid. The retained
`verify-m45-topological-bound.py` now checks the current canonical scene and
certifies **17 = 14 + 3**: globally consistent per-road lane order forces one
additional crossing for w02/w09 (J21/J22/J49), w10/w21 (J37/J38), and w16/w21
(J37/J38). All order assignments and 1,530 physical-slot checks are
published. The corrected <=16 gate therefore exits 1. This supersedes the
historical <=11 STOP rationale; **M4.5 is not complete**.

No production/geometry changes were made. Before -> after is S1 **28 -> 28**,
S2 **4 -> 4**, S3 **2 -> 2**, S4 **4 -> 4**, world **8 -> 8**; J21 **6 -> 6**;
budgeted crossings remain **0** everywhere. Eleven current S1 crossings remain
uncertified. Full DoD table, proof, freshly pasted checks, and explicit not-run
items: [m45-stop-report.md](m45-stop-report.md). Canonical M4 evidence is retained.
No browser was used; port 5188 was left running; no push or PR.


## M4.5 — junction-aware lane continuity

Allocation compacts retained law paths once, orders shared lanes at their upstream/downstream forks, and memoizes each shared-path comparison. If endpoint preferences conflict, the upper/left fork wins deterministically; wire ID only breaks an unresolved tie. There is no route search, alternative-lane enumeration, per-junction identity switch, or geometry retry. Right-hand halves and pitch 6 remain. Pins are still exact centered rows, now ordered by the new assigned ranks as the corrected brief permits.

Projection coordinates opposing left turns through distinct outer channels. Other left turns receive quarter-pitch internal steps to prevent coincident corner segments; entry/exit channel staggering avoids same-axis overlap. A neighboring widened mouth cannot cause an assigned stem to backtrack. All new bends are inside registered junctions; the independent interval audit checks 865 nonjunction/nonterminal intervals against their exact assigned road lanes. Routing-law source, nodes, sections, road IDs/bounds, routes and gates remain frozen against `0e5f21e`.

The prover retains all 14 independent S1 witnesses and the three accepted linked-road-order certificates. Extending the same method across sections certifies two additional linked obstructions (w09/w18 and w16/w22): each forces one crossing somewhere along its listed junction chain, without increasing the S1-only floor. Current allocation places them in S2 and S1 respectively. There are 18 independent endpoint certificates plus five global linked-order certificates: all 23 actual crossings, with no surplus or uncertified intersection.

`verify-lanes.mjs` retains geometry/overlap/fan/gate controls and replaces only superseded wire-ID-order and frozen-derived-pin assumptions with assigned-rank and exact pin-row checks. `verify-m4-pin-preservation.mjs` is retained unchanged as historical M4 evidence. The M4 selection runner and browser assertions are unchanged.

Reproduce headlessly, leaving Vite on 5188 running:

```sh
pnpm check
pnpm exec tsx apps/web/cli/verify-nested-wires.ts
node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs
node --import tsx output/playwright/nested-wires/verify-lanes.mjs
node --import tsx output/playwright/nested-wires/verify-invariants.mjs
node --import tsx output/playwright/nested-wires/verify-m45-geometry.mjs
node --import tsx output/playwright/nested-wires/count-operations.mjs
python3 output/playwright/nested-wires/verify-m45-topological-bound.py
python3 output/playwright/nested-wires/verify-oracle.py
python3 output/playwright/nested-wires/verify-m4-selection.py
python3 output/playwright/nested-wires/capture-m45.py
python3 output/playwright/nested-wires/verify-m45-evidence.py --write
```

Run timing after checks, without concurrent browser runners/source edits. Full stdout, all ten DoD statuses, load samples, operation totals, clone interpretation and local commit log are in [m45-completion-report.md](m45-completion-report.md). [Visual inspection](m45-visual-review.md) records the reference comparison and retained fixture limitations. [Source review](m45-source-review.md) records scores 146–152/160 and the enforced Sonar ≤2 gate.

## M6 templates scene — STOP at nested-only section placement (2026-09-17)

The required real directory tree has 16 production nodes and nine sections;
`core` contains four child sections and zero direct nodes. The existing public
builder computes `rows = Math.ceil(0 / 0)` for that section, propagating `NaN`
into all 16 node bounds, all nine section bounds, and 142 road bounds. Feature
spec 2 explicitly requires STOP if this tree cannot be expressed. No layout or
routing changes were made. Extraction, real-wire routing, browser capture,
invariant certification, ops/scaling, and visual acceptance remain unverified.
See the [STOP report and exact reproduction](templates-scene/stop-report.md).
No browser/server was started, port 5188 was untouched, and no push or PR occurred.

## M6 resumed — placement fixed; STOP at real-graph invariants (2026-09-17)

The orchestrator authorized the nested-only placement fix after the preceding
STOP. `sizeSection` now assigns zero rows for zero direct nodes, and `gridNodes`
returns before dividing by that row count. Child sizes and existing padding
alone determine the parent footprint. A section with neither nodes nor children
is rejected deterministically with `RangeError`; callers correct the semantic
spec and rebuild. Nonempty sections retain their original arithmetic. The
unchanged structural-identity verifier passes, including full byte identity
against the canonical `?nested` scene.

The committed [TypeScript AST extractor](templates-scene/extract-scene.mts)
maps the real production tree to **16 nodes, nine sections, and 29 value wires**.
It uses the existing TypeScript compiler API and symbol checker, with no new
dependency. Requests run provider OUT → consumer IN. Type-only statements and
named specifiers, non-value symbols, and external modules are excluded; each
provider/consumer pair appears once. Dropped declaration counts are **3 external,
42 internal type-only, 0 duplicate value declarations**. The wire count matches
the approximate 29-wire survey exactly. Node IDs follow sorted relative paths;
direct nodes are alphabetical by file name; child directories are alphabetical;
root order is contract, core, adapters. Source lines, section mappings and the
four isolated files are in the [extraction report](templates-scene/extraction-report.md).
Two consecutive runs produce byte-identical JSON and Markdown (`diff` exit 0).
The scene spec contains no coordinates.

**What the real data shows:** `contract/api.ts` and
`core/validation/catalog.ts` each have eight incident value edges. The barrel
`contract/index.ts` has three incoming re-export edges and no outgoing value
edges. `contract/errors.ts` supplies six consumers; three of those outbound
routes already expose overlapping projection segments. These are graph
observations, not a visual acceptance claim.

All 16 nodes and nine sections now have finite, contained geometry, and all
29 requests return `ok: true`. However, the public wire inspector reports
**9 off-corridor segments and 21 invalid boundary-crossing segments**; the
independent segment-pair audit finds **3 positive-length overlaps**. This fails
DoD 4 under the unchanged lane/projection/road constraints. The
[new STOP runner](templates-scene/verify-templates-scene.mjs) exits 1 and retains
[exact witnesses](templates-scene/invariant-failures.json). It also verifies the
minimal zero-node regression, deterministic rebuild and each measured pipeline
stage once. Pin-row/crossing certificates remain unverified; this is not the
complete acceptance runner.

Per the brief's required STOP, browser integration, screenshots, five-load
median, routing/compile ops, 2× graph scaling and a ~150-node/300-wire cost
answer were **not run**. No estimates stand in for those measurements. Neither
port 5188 nor port 5190 was contacted, and no browser/server was started.
No routing law, lane, gate, pin-row or topology source was changed. Existing
M1–M5 verifier scripts and approved references are preserved. Nothing was pushed
and no PR was opened. **M6 remains incomplete.** Full binary DoD status and
command output: [resume STOP report](templates-scene/resume-stop-report.md).

## M6 second resume — capacity/projection repaired; acceptance evidence

This entry supersedes the **geometry blocker** in the preceding resume entry;
the original STOP evidence remains intact for provenance. The current brief's
item 8 authorizes the corrections described here. Branch stays
`feat/templates-scene`; nothing is pushed and no PR is opened.

`roads-prototype.html?templates` renders the real capability: **16 production
TypeScript files, nine directory sections, 29 provider → consumer value wires**.
Node order is alphabetical by file name; child directory order is alphabetical;
root order is contract, core, adapters. The deterministic TypeScript-AST extractor
still drops **3 external and 42 internal type-only declarations**, with **0
duplicate value declarations** and **no delta from the 29-wire survey**. Tests
are excluded. Every wire has an import/export source line in the extraction
report. Both consecutive-run artifact diffs pass. Empty sections still reject
with `RangeError`; nested-only sections size from their children.

The driveway capacity pass now preserves the gate port plane and reserves the
entire node fan plus a quarter-pitch forward stem. Source projection consumes
that retained start instead of backtracking to a turn inside the fan. Rank
changes across a street use distinct destination-ranked turn rows. No routing
law, road discovery loop, lane ordering, coordinates in the semantic input,
or repeated layout stage is introduced. The unchanged canonical `?nested`
serialization remains byte-identical, including geometry and projected wires.

The [complete templates runner](templates-scene/verify-templates-scene.mjs)
checks containment, finite geometry, the exact directory tree, deterministic
rebuild, one-way stage counts, four port sides, exact centered pin rows at pitch
6 with end margins, planar terminal fans, distinct forward lanes, gate-mouth
positions, junction-only turns, and every segment-pair contact. **9 off-corridor
segments → 0; 21 boundary violations → 0; 3 positive-length overlaps → 0.**
It certifies **130/130 crossings; zero uncertified**. Counts: world **76**,
contract **12**, core **36**, core/validation **6**, all other sections **0**.
Every crossing is transverse inside a registered junction. The offline proof
uses disjoint alternating endpoint ranges and consistent per-road pair-order
truth tables, including centered terminal-pin domains. Its proof regions include
terminal fans, are pairwise disjoint, and cannot certify the same crossing twice.
Full witnesses and negative controls are in
[crossing-certificates.json](templates-scene/crossing-certificates.json).
This is an unavoidable-crossing claim under the existing frozen-route/lane laws,
not a claim that an unrestricted graph layout needs 130 crossings.

Measured with the retained AST operation-count definition (numeric additions,
subtractions, absolute values and comparisons; excluded operations documented
in the artifact):

| Measurement | Templates |
| --- | ---: |
| Routing operations, all 29 wires | 1,626 |
| Maximum law leg | 38 (ceiling 60) |
| Wire registry compilation | 907 |
| Lane allocation | 9,430 |
| Network compilation | 11,941 |
| Lane projection | 6,129 |
| Compilation subtotal | 28,407 |
| Total operations, all stages | 36,814 |
| Per-wire road-pair discovery | 0 |
| Clone: nodes / wires | 32 / 58, all fresh IDs |
| Clone total operations | 74,259 |
| Clone total growth | **2.017140×**, below 2.5× |
| Five headless navigation-to-ready loads | 393.9, 374.5, 352.1, 368.9, 406.4 ms |
| Median time-to-load | **374.5 ms** |

[All stage counts and instrumentation limits](templates-scene/operations.json)
are published, including setup and the doubled graph. The old default-scene
runner still passes its unchanged ceilings: routing **992**, maximum leg **41**,
compilation **19,732 ≤ 20,000**. Default compilation rises from 19,683 by 49;
its total rises from 26,107 to 27,148 because capacity now visits each terminal.
This adds bounded work; the existing default clone ratio is **1.699610×**.
The real-graph probe duplicates **both nodes and wires**, unlike the inherited
synthetic probe that retains its original requests.

**Cost at approximately 150 nodes / 300 wires:** for similar depth, fan degree
and path length, simple proportional extrapolation is roughly **0.35–0.38 million
counted operations**, including approximately **16,821 routing operations**.
That is an estimate, not a measured 150-node build or a browser timing promise.
The 16→32-node/29→58-wire probe shows no compounding growth for this topology.
There is no all-road-pairs discovery term. However, per-road sorting and cached
shared-path comparisons depend on congestion, and network connections contain
local incoming×outgoing products. Those terms can grow faster than linearly as
junction degree/shared paths increase; this probe does **not** prove a uniform
linear bound for arbitrary 300-wire graphs. Browser DOM/render cost is separate
from this deliberately limited numeric-operation meter.

The two required **1920×1440 headless Chrome fit-view** captures are
[roads off](templates-scene/templates-roads-off.png) and
[roads on](templates-scene/templates-roads-on.png). They were captured from this
worktree's owned server on **5190**, not 5188, and personally inspected along
with the [contract detail](templates-scene/templates-contract-detail.png).
All 16 real file labels are present, every node fits the viewport, there are no
page errors, and the layout counter stays 1. [Browser measurements](templates-scene/browser.json)
retain all five loads. The unchanged inherited selection assertion body also
passes against the default scene through a transport redirect to 5190: median
**253.1 ms**, every selection geometry/camera assertion unchanged.

**What the real data shows:** the main hubs are `contract/api.ts` and
`core/validation/catalog.ts`, each with eight incident value edges; `errors.ts`
supplies six consumers. `index.ts` has only three incoming re-export edges and
no outgoing value edges. The dense trunks are the contract/core boundary and
the core validation/admission/discovery/expansion roads, not the barrel. The
four type-only isolated files remain visible as architectural context.

**Visual limits / acceptance status:** the hierarchy and file identities read,
but the frozen placement leaves large empty panels and long world-road detours.
The fit overview's labels are small. These do not match the density/polish of
the binding reference diagrams; the visual review records that limitation
without claiming a general visual-quality PASS. M5 is absent from this branch
(the supplied brief says it is developed in another worktree), so no M5 pass is
invented. The detailed [second-resume report](templates-scene/resume2-report.md)
lists every DoD result and the outstanding acceptance gates. A green suite and
geometry certificate alone are **not** declared complete milestone acceptance.
