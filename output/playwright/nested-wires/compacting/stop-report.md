> Restored from git history (feat/m75-compacting); relative links below resolve on that branch: git show feat/m75-compacting:output/playwright/nested-wires/compacting/stop-report.md
# M7.5 — STOP: population-sized turn reservations fail geometry and occupancy

**M7.5 is not complete. The STOP instruction has been executed.** One deterministic
reservation policy was embedded and audited; no padding sweep, route search,
per-wire road-pair discovery, law change, gate-routing change, registry change,
or junction-union change was introduced. The candidate is rejected. Production
source and canonical scene artifacts are restored to `d720e7f` on
`feat/m75-compacting`. No push, PR, subagent, new `*.test.ts`, browser session,
or server operation was performed. Ports 5188/5190/5191 were never contacted.

Both required historical STOP reports were read before any source change.
The candidate preserved demand-derived pin/mouth separation, corridor containment,
and disjoint proof regions. Those successes did **not** suffice: it violated exact
boundary mouths, created a scale overlap and surplus crossings, and missed
occupancy. This is a failure of the implemented policy, **not a proof that every
turn-footprint reservation design is impossible**.

## Policy and once-only embedding

The retained [candidate patch](rejected-candidate.patch) adds two private Layout
modules and changes only the scene composition. Initial reservation construction,
registry, routing, and allocation each execute once. After allocation, one bottom-up
demand-sizing pass and one top-down final embedding consume retained contacts,
road identities, and lane ranks. Capacity, network, and projection then each execute
once. No builder, routing law, registry, or allocator is rerun by embedding.
World row membership and child order are retained.
[Assignment proof](retained-assignment-proof.json) independently confirms exact
lane ranks/offsets, gate/terminal choices, road IDs, and node sizes in all three scenes. No semantic scene coordinates
are authored. The nested fixture has no sparse leaves, so its full bytes remain
unchanged without baseline-pointer edits.

For pitch `p=6`, positive stem `s=p/4=1.5`, road population `n`, node-terminal
population `t`, and section-mouth population `g`:

- Full street radius: `R(n)=p(n+1)`; unchanged width `12+12n`.
- Node fan depth: `F(t)=max(0,t-0.75)p`.
- Node-facing clearance per side: `I=max_nodes(R(adjacent street)+F(t)+s)`.
- Boundary-facing turn reservation: `O=R(g)+s`, replacing the full adjacent
  street radius on that side. Thus through-only road population is not charged
  again to the section's boundary inset. Full street widths still exist and may
  extend outward beyond that inset; the audit determines whether this is legal.
- Side-pin/midpoint-mouth separation: `S=max_left,right(R(g)+max_nodes R(t)+s)`.
  For a one-row section, add `max(0,2S-abs((Otop+Itop)-(Obottom+Ibottom)))`
  to the already larger vertical margin. No fixed 24-unit asymmetry is used.
- Uniform direct-node cell: `Wcell=192+Ileft+Iright`,
  `Hcell=96+Itop+Ibottom`. Node rectangles remain 192×96.
- Child surround half-gap `G=max(6+s, adjacent-street radii at child mouths+s)`.
  Parent width is `columns*Wcell + Σ(child.width+2G) + Oleft+Oright`.
  Parent height is `max(rows*Hcell, child.height+2G) + Otop+Obottom`.
  Sparse leaves and ancestors containing them use this policy. Other leaves
  retain their dimensions and are translated with parent/world reflow.

The population-sized boundary footprint is the rejected hypothesis. A count does
not necessarily bound the existing turn's full geometric support: assigned ranks,
quarter-pitch bends, and the exact gate plane also matter. This was tested against
actual projected geometry, not accepted from arithmetic alone.

The embedding work is outside measured stage callbacks in this prototype. All
existing stage-call assertions pass, but **no operation-meter or timing claim is
made**. A production adoption would have to meter that work explicitly. The patch
is diagnostic evidence, not standards-reviewed production code or an accepted
implementation hidden behind a flag.

## Per-section demand math

Complete per-node, per-side counts, adjacent streets, allocated gate-turn ranks,
fan depths, insets, and resulting offsets are retained in
[templates-demand.json](templates-demand.json) and [scale-demand.json](scale-demand.json).
They come from the public builder's measured reservation topology and allocation,
not a second routing pass. [The diagnostic patch](diagnostic-script.patch) reproduces
them through the public Layout contract.

In the tables below, each inset tuple is **left / right / top / bottom**. `O` includes
the demand-derived asymmetry. Untouched >2-node leaves are listed separately in the
occupancy evidence, rather than presenting their hypothetical policy values as used.

### Templates sizing

| Section | Direct / children | Mouth populations L/R/T/B | I | O | S | Cell | Final size |
| --- | ---: | --- | --- | --- | ---: | --- | --- |
| section-1 | 6 / 2 | 6 / 0 / 0 / 10 | 81 / 45 / 27 / 105 | 43.5 / 7.5 / 7.5 / 67.5 | 85.5 | 318 × 228 | 2157 × 531 |
| section-2 | 2 / 0 | 0 / 0 / 0 / 0 | 7.5 / 7.5 / 7.5 / 7.5 | 7.5 / 7.5 / 34.5 / 7.5 | 13.5 | 207 × 111 | 429 × 153 |
| section-3 | 2 / 0 | 0 / 0 / 1 / 3 | 7.5 / 7.5 / 15 / 39 | 7.5 / 7.5 / 13.5 / 25.5 | 13.5 | 207 × 150 | 429 × 189 |
| section-4 | 0 / 4 | 4 / 0 / 4 / 5 | 7.5 / 7.5 / 7.5 / 7.5 | 31.5 / 7.5 / 31.5 / 37.5 | 37.5 | 207 × 111 | 1873.5 × 525 |
| section-5 | 1 / 0 | 2 / 1 / 2 / 0 | 27 / 15 / 15 / 7.5 | 19.5 / 13.5 / 75 / 7.5 | 37.5 | 234 × 118.5 | 267 × 201 |
| section-6 | 1 / 0 | 2 / 1 / 1 / 0 | 27 / 15 / 9 / 7.5 | 19.5 / 13.5 / 81 / 7.5 | 37.5 | 234 × 112.5 | 267 × 201 |
| section-7 | 1 / 0 | 2 / 0 / 1 / 1 | 27 / 7.5 / 9 / 9 | 19.5 / 7.5 / 88.5 / 13.5 | 37.5 | 226.5 × 114 | 253.5 × 216 |
| section-8 | 2 / 0 | 0 / 0 / 4 / 8 | 15 / 15 / 51 / 75 | 7.5 / 7.5 / 31.5 / 55.5 | 19.5 | 222 × 222 | 459 × 309 |
| section-9 | 1 / 0 | 0 / 1 / 2 / 0 | 7.5 / 15 / 15 / 7.5 | 7.5 / 13.5 / 51 / 7.5 | 25.5 | 214.5 × 118.5 | 235.5 × 177 |

### Scale sizing

| Section | Direct / children | Mouth populations L/R/T/B | I | O | S | Cell | Final size |
| --- | ---: | --- | --- | --- | ---: | --- | --- |
| section-1 | 6 / 2 | 4 / 0 / 0 / 8 | 87 / 123 / 93 / 81 | 31.5 / 7.5 / 7.5 / 55.5 | 79.5 | 402 × 270 | 2433 × 603 |
| section-2 | 2 / 0 | 0 / 0 / 1 / 3 | 9 / 9 / 15 / 33 | 7.5 / 7.5 / 13.5 / 34.5 | 19.5 | 210 × 144 | 435 × 192 |
| section-3 | 2 / 0 | 0 / 0 / 1 / 3 | 9 / 9 / 15 / 33 | 7.5 / 7.5 / 13.5 / 34.5 | 19.5 | 210 × 144 | 435 × 192 |
| section-4 | 0 / 4 | 1 / 0 / 3 / 5 | 7.5 / 7.5 / 7.5 / 7.5 | 13.5 / 7.5 / 25.5 / 37.5 | 19.5 | 207 × 111 | 3473 × 782 |

Validation's top/bottom streets still carry **5 / 8** lanes; mouths carry **4 / 8**.
Only the top saves a lane's boundary reservation: `37.5 → 31.5`. Bottom has no
through-only population to remove and stays `55.5`. Node-facing gaps remain
`36+13.5+1.5=51` and `54+19.5+1.5=75`. Thus height is
`96+51+75+31.5+55.5=309`. Uniform maximum side gaps give
`2*(192+15+15)+7.5+7.5=459` width. Empty area is
`100*(1-36864/(459*309))=74.008503%`: improvement **14.914574 points**, missing
15 by **0.085426 points**. Required area is at most approximately **141,366.37**;
actual is **141,831**. Per-node nonuniform gaps could change this narrow arithmetic
miss; that untested possibility does not remove the observed parent/mouth failures.

Parent reflow also fails independently. Templates contract uses `G=73.5`:
`3*318+(429+147)+(429+147)+43.5+7.5=2157`,
`max(2*228,153+147,189+147)+7.5+67.5=531`.
Its immediate occupied rectangles total 257,310, yielding **77.534712% empty**
versus 65.125374%. Core uses the same G:
`(267+267+253.5+459)+4*147+31.5+7.5=1873.5`,
`309+147+31.5+37.5=525`; occupied 303,921 yields **69.100766% empty**
versus 57.218352%. Shrinking children faster than their shared parent grid and
surrounds shrinks occupied area faster than parent area.

Scale contract has `G=79.5`:
`3*402+2*(435+159)+31.5+7.5=2433`,
`max(2*270,192+159)+7.5+55.5=603`.
Occupied 277,632 yields **81.076124% empty** versus 65.125374%.
Scale core has `G=31.5`, four unchanged 800×656 children, and improves:
`4*(800+63)+13.5+7.5=3473`, `656+63+25.5+37.5=782`.

## Occupancy before / rejected candidate / restored final

The metric is direct-node plus immediate-child rectangle area divided by section
area. Every baseline below was freshly built before the candidate. Final production
occupancy equals **Before**, not Candidate. Larger leaves have a no-regression gate;
only <=2-node leaves require the 15-point improvement. Parents must not regress.

### Templates occupancy

| Section | Direct / children | Before empty % | Candidate empty % | Improvement, points | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| section-1 | 6 / 2 | 65.125374 | 77.534712 | -12.409338 | FAIL |
| section-2 | 2 / 0 | 88.923077 | 43.836556 | 45.086521 | PASS |
| section-3 | 2 / 0 | 88.923077 | 54.534355 | 34.388722 | PASS |
| section-4 | 0 / 4 | 57.218352 | 69.100766 | -11.882414 | FAIL |
| section-5 | 1 / 0 | 90.450928 | 65.654872 | 24.796057 | PASS |
| section-6 | 1 / 0 | 90.450928 | 65.654872 | 24.796057 | PASS |
| section-7 | 1 / 0 | 90.450928 | 66.337936 | 24.112993 | PASS |
| section-8 | 2 / 0 | 88.923077 | 74.008503 | 14.914574 | FAIL |
| section-9 | 1 / 0 | 90.450928 | 55.781064 | 34.669864 | PASS |

### Scale occupancy

| Section | Direct / children | Before empty % | Candidate empty % | Improvement, points | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| section-1 | 6 / 2 | 65.125374 | 81.076124 | -15.950750 | FAIL |
| section-2 | 2 / 0 | 88.923077 | 55.862069 | 33.061008 | PASS |
| section-3 | 2 / 0 | 88.923077 | 55.862069 | 33.061008 | PASS |
| section-4 | 0 / 4 | 44.907283 | 22.706623 | 22.200660 | PASS |
| section-5 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-6 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-7 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-8 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-9 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-10 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-11 | 3 / 0 | 89.463415 | 89.463415 | 0.000000 | PASS |
| section-12 | 3 / 0 | 89.463415 | 89.463415 | 0.000000 | PASS |

## Failing witnesses and invariant results

All three existing runners were executed without changing an assertion. The
first templates run only redirects its output directory; the exact unparameterized
command was also executed and failed identically. Canonical outputs written by
those runners were archived here and then restored.

| Candidate suite | Exit | Overlaps | Certified / uncertified | Other failure |
| --- | ---: | ---: | ---: | --- |
| Structural identity | 0 | Not this runner's assertion | Not this runner's assertion | None; full nested scene unchanged |
| Templates | 1 | 0 | 130 / 0 | 12 non-mouth boundary contacts; missing forward lane and owned gate crossing |
| Scale | 1 | 1 | 112 / 13 | One non-mouth boundary contact; missing gate crossing; surplus crossings |

Evidence: [structural](candidate-structural-identity.txt),
[templates](candidate-templates-invariants.txt),
[exact templates command](candidate-templates-exact-command.txt),
[scale](candidate-scale-invariants.txt).
The complete contact scans and certificates are retained, including all 13
uncovered scale crossings; no audit was shrunk to the first witness.

1. **Templates gate clipping, w01:20.** The segment `(134.5,403) → (182.5,403)`
   lies inside its vertical street corridor `[131.5,227.5] × [119.5,671.5]`.
   It crosses contract's left boundary at **(136,403)**. The owned left mouth is
   `(136,401.5)` with assigned offset `+3`, so the required crossing is
   **(136,404.5)**. Its driveway has collapsed to zero width at x=136;
   the forward-lane assertion reports `no forward lane w01:11`.
   The boundary inset is `R(6)+1.5=43.5`, but the adjacent street has seven
   lanes, radius 48. The street's outer edge is **4.5 units outside** the
   section. The quarter-pitch turn passes through the boundary 1.5 units away
   from the assigned mouth. It is an actual illegal crossing, not stale metadata.
2. **Scale gate clipping, w09:16.** The segment `(1950.5,881.5) → (1950.5,911.5)`
   is inside the assigned horizontal street. It crosses core's top at
   **(1950.5,883)**, while the top mouth `(1952,883)` with offset `-3` requires
   **(1949,883)**. The three-wire gate inset is 25.5 while its four-lane street
   radius is 30: the same 4.5-unit boundary spill and 1.5-unit crossing mismatch.
3. **Scale overlap, w16/w19.** w16 runs `(747.5,440.5) → (1721,440.5)` on
   `section-1:horizontal:528:640`; w19 has a turn segment
   `(737,440.5) → (764,440.5)` assigned to `section-1:vertical:640:248`.
   Their coincident interval is **[747.5,764] at y=440.5**, length **16.5**.
   All contacts are scanned; scale contract now has 103 transverse crossings
   versus 90 baseline, and all **13 added contacts are uncertified**.

[Templates witnesses](templates-witnesses.json) and
[scale witnesses](scale-witnesses.json) retain full segments, section rectangles,
corridors, gate positions, and lane assignments. The overlap is also in
[scale audit](scale-candidate-invariant-audit.json); all uncovered contacts are in
[scale certificates](scale-candidate-crossing-certificates.json).

Both candidates pass node/body avoidance, corridor containment, continuity,
exact pin rows, disjoint proof-region/endpoint-range checks, and turn-scope checks.
Scale also passes the forward-lane assertion. Those passes are explicitly narrower
than full validity. Templates' 130/0 certificate does not excuse its illegal mouths;
scale's valid proof disks do not certify its surplus crossings.

## Missing design freedom / what this STOP establishes

A mouth's population-sized inset is insufficient to place the boundary through
an already widened street: the existing projector turns against the street edge,
while the section admits only the exact assigned gate point. A successful design
must derive a **boundary-safe turn support interval from retained ranks and bends**,
not only a radius from mouth count. It must reconcile that interval with the
existing street edge, forward stem, and gate plane in the same embedding pass.
Changing corridor ownership, gate admission, or the projector was not used to
conceal this conflict. No proof is claimed that another sizing policy under the
unchanged semantics cannot satisfy it.

Parent packing is a second independent constraint. This policy retains grid
tracks and shared child surround clearance. Once children become much smaller,
those shared tracks dominate the parent's area. Nonuniform cell/child surrounds
and joint parent occupancy bounds are potential untested degrees of freedom;
using them would still have to preserve every retained turn and proof interval.
Validation's small arithmetic miss alone is not evidence of impossibility.
The candidate failed the actual invariants and occupancy gate, so no corrective
offset sweep, alternate topology, or browser acceptance run followed.

## Determinism, operations, performance, selection, and visuals

Two fresh full serializations match for each candidate scene. Stage invocations
are distinct and occur once; JSON evidence records every name, not just a count.

| Scene | Measured stage calls / distinct | Routing ops | Compile ops | Full ops / clone ratio | Discovery |
| --- | ---: | --- | --- | --- | --- |
| Nested | 36 / 36 | Unmeasured | Unmeasured | Unmeasured | No new discovery code; numeric counter unrun |
| Templates | 39 / 39 | Unmeasured | Unmeasured | Unmeasured | No new discovery code; numeric counter unrun |
| Scale | 85 / 85 | Unmeasured | Unmeasured | Unmeasured | No new discovery code; numeric counter unrun |

[All-scene digests](serialization-digests.json),
[nested stages](nested-determinism.json), [templates stages](templates-determinism.json),
[scale stages](scale-determinism.json). The new transforms execute once in the
call graph but are outside the inherited meter callbacks; no hidden arithmetic
is presented as measured zero. No clone growth or roadPairDiscovery counter PASS
is claimed. The implementation would need explicit metering before any adoption.

No headless loads, render-stage decomposition, selection runner, or screenshots
were taken after this STOP. Therefore there is no candidate comparison against
374.5 ms / 1,556.7 ms, and no selection acceptance against the authorized **450 ms**
ceiling. The unchanged wrapper's inherited 300 ms threshold was not edited or run.
No before/after image or reference-parity claim is made.

**150 nodes / 300 wires:** this rejected geometry supplies no measured compounding
answer. The inherited M7 evidence identifies the coverage audit's
`O(XY(R+G))` grid scan as its dominant browser term, but M7.5 has not measured a
clone, browser load, or 150-node scene. Geometry already fails at 40/75.
The new passes do not establish a cost bound for routing, lane ordering, audit,
or rendering. Previous M7 numbers are historical context, not fresh M7.5 results.

Approved references and visual verifiers are untouched. Sparse overview labels,
contract crossings, toolbar clipping, and the standing empty-panel benchmark
remain unaccepted. There is no new token, style, selection, or label-policy change.

## Reproduction and restoration

Apply patches only to an isolated checkout at `d720e7f`, with this evidence folder
available. The candidate remains rejected; this sequence intentionally exits 1
for templates and scale and overwrites their generated canonical output files.

```sh
git apply output/playwright/nested-wires/compacting/rejected-candidate.patch
git apply output/playwright/nested-wires/compacting/diagnostic-script.patch
node --import tsx output/playwright/nested-wires/compacting/audit-demand.mjs
node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs
node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs
node --import tsx output/playwright/nested-wires/scale-scene/verify-scale-scene.mjs
```

The [candidate full check](candidate-pnpm-check.txt) passed 70 files / 208 tests
before the standalone diagnostic script was added. The script is retained as a
patch, not shipped as runtime source. No new test file was created at any point.

After restoring production and canonical outputs, all three exact invariant
commands exit 0. Templates is **130/0**, scale **112/0**, both zero overlaps and
empty inspection failure lists. Fresh complete public outputs equal the captured
pre-candidate baselines byte-for-byte. No frozen baseline pointer was updated.
[Restoration proof](restoration-proof.json) records hashes, command exits,
unchanged `capability/` and `apps/`, branch, and zero new tracked/untracked tests.

The first restored `pnpm check` failed five files / six tests on timing: five
timeouts and the capacity run's 33,076.6 ms versus 20,000 ms ceiling.
[Failed log](restored-pnpm-check.txt) is retained. No timeout, test, threshold,
verifier, or CI workflow was changed. One fresh full rerun follows that failure;
its actual result is recorded in the final DoD below.

The final restored rerun also exits **1**: **10 failed / 60 passed files;
12 failed / 196 passed tests**. Eleven failures are timeouts; the capacity timing
is 81,883.3 ms against 20,000 ms. [Final full log](restored-pnpm-check-rerun.txt).
Typecheck, lint, formatting and architecture passed in both restored runs.
There is no claim that these timing failures establish a new code defect or
prove machine contention; the production tree is byte-identical to the starting
revision. No further retry or unrelated performance change was attempted.

## Binary DoD record

FAIL includes unimplemented or unverified work. Restored baseline PASS results
never certify the rejected candidate. The STOP outcome is successful execution
of the brief's safety instruction, not completion of M7.5.

| # | Status | Evidence / limit |
| --- | --- | --- |
| 1. `pnpm check`, 70 files / ≥208 tests, no new tests | **FAIL** | Candidate check passed 70/208; final restored check exits 1 with timing failures (70 files, 196 passed / 12 failed tests). [Final log](restored-pnpm-check-rerun.txt); [no-new-tests proof](restoration-proof.json). No threshold changed. |
| 2. Three fresh full invariant suites, zero overlaps/uncertified | **FAIL** | Structural PASS; candidate templates fails mouths/forward lanes despite 130/0; scale has one overlap and 112/13. [Templates](candidate-templates-invariants.txt), [scale](candidate-scale-invariants.txt). Restored suites all PASS, separately recorded. |
| 3. ≥15 points every sparse leaf; no leaf/parent regression | **FAIL** | Validation +14.914574; templates contract/core and scale contract regress. Final restored production has zero improvement. [Templates occupancy](templates-occupancy.json), [scale occupancy](scale-occupancy.json). |
| 4. Two complete serializations identical per scene | **PASS** | Three candidate scenes independently rebuilt twice, exact bytes equal; final restored scenes equal initial fresh baselines. [Digests](serialization-digests.json), [restoration](restoration-proof.json). |
| 5. All-scene ops, clone ≤2.5×, roadPairDiscovery=0 | **FAIL** | Unrun after geometry/occupancy STOP. Stage calls once verified; embedding not yet included in meter callbacks. No numeric operation claim. [Stage evidence](scale-determinism.json). |
| 6. Five-load medians on 5191 and stage decomposition | **FAIL** | Unverified; no server or browser was started. Prior 374.5/1556.7 ms values are not candidate results. This report records the STOP boundary. |
| 7. Selection, zero click deltas, 450 ms ceiling | **FAIL** | Unverified; no selection runner or browser run after STOP. Threshold and selection semantics unchanged. This report records the STOP boundary. |
| 8. Five headless 1920×1440 before/after/detail captures | **FAIL** | No screenshots after geometry rejection; no stale images substituted or visual acceptance claimed. This report records the STOP boundary. |
| 9. README complete design, math, occupancy, ops, loads, weaknesses | **FAIL** | [README](../README.md) and this report supply complete STOP design/math/witness evidence; fresh requested ops/load measurements do not exist. No complete feature-documentation claim. |
| 10. Logical local commits, correct branch, clean tree, six-entry log | **PASS** | Diagnostic evidence and STOP documentation committed separately on `feat/m75-compacting`; final `git status --short --branch` and `git log --oneline -6` printed to stdout. No push/PR. [Branch/restoration proof](restoration-proof.json). |
