# M7 / Ruling #5 — STOP, milestone incomplete

The authorized joined-terminal fix is installed and default scale is green.
Two blockers remain: Part C's left-edge interpretation fails routing/topological
validity, and the final unchanged-selection wrapper fails its inherited load
time ceiling. Standing visual benchmark gaps are also documented. No all-green
completion, approved A/B adoption or 150-node readiness is claimed.

## Binary DoD

| # | Status | Verified output / limitation |
| --- | --- | --- |
| 1 | PASS | Final `pnpm check` exits 0; 70 files / 208 tests; zero new tracked/untracked `*.test.ts`. |
| 2 | PASS | Structural verifier exits 0; fresh full nested/templates bytes equal f77907c; templates 130 certified / 0 uncertified. |
| 3 | PASS | Deterministic seed-7007 semantic spec; 6 top / children 2+4 / 40 nodes / 75 wires; full scale suite exits 0, zero overlaps, 112 certified / 0 uncertified; ops, doubled-traffic clone, five-load median and compounding answer published. This is the listed numerical DoD, not a visual acceptance claim. |
| 4 | FAIL | Explicit option defaults off; all default scenes identical. Templates-left has 148 uncertified crossings and forward/gate failures. Scale-left fails w27 before compilation; full length/crossing/compile metrics unavailable, not zero. Evaluation evidence is retained, but the required complete scale A/B metrics cannot be supplied. |
| 5 | PASS | Six named PNG files all verified 1920×1440, headless on 5191. A/B includes additional roads-on/off/detail captures. Scale-left PNG explicitly depicts a failed graph with zero wires; this is not valid routing acceptance. |
| 6 | FAIL | Runner body byte-identical, every interaction assertion passes and every click delta=0; final wrapper exits 1 because median 367.9 ms exceeds inherited 300 ms. Earlier 253.7 ms passing sample and first 356.7 ms failure retained. No timing threshold changed. |
| 7 | PASS | README appended with fixture design, all-three-scene ops table, A/B observations/recommendation, compounding analysis and explicit M7.5 compaction deferral; unavailable measurements and visual weaknesses stated. |
| 8 | PASS | Branch feat/m7-scale, Part B implementation separate from Part C evaluation commit; final clean status and `git log --oneline -6` supplied in terminal/final handoff. Both prior STOP commits retained. |

## Executed gates and outputs

```text
pnpm check
exit 0
Test Files  70 passed (70)
Tests       208 passed (208)
```

Full log: [ruling5-final-pnpm-check.txt](ruling5-final-pnpm-check.txt).

```text
node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs
exit 0
PASS current canonical scene matches fresh public builder: 24 nodes / 26 wires
PASS zero new tracked *.test.ts files

node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs
exit 0
OVERLAPS []
CERTIFICATION 130 certified / 0 uncertified

node --import tsx output/playwright/nested-wires/scale-scene/verify-baselines.mjs
exit 0
PASS nested: full fresh scene and committed artifact byte-identical to f77907c
PASS templates: full fresh scene and committed artifact byte-identical to f77907c
PASS selection runner byte-identical
PASS zero new tracked/untracked *.test.ts; branch feat/m7-scale
PASS sectionInPortsLeft omitted == false for all three scenes; scale bytes unchanged from Part B fb86264
PASS routing law, gate routing, registry and junction-union bodies unchanged from f77907c
```

Full logs: [structural](ruling5-structural-identity.txt),
[templates](ruling5-templates.txt), [whole serialization](ruling5-baselines.txt).
The unchanged runner SHA256 is
`27e28c39cf1c50017483ede1954588d21e97ed4a2eadf1d01d482afdaa1eb11e`.

```text
node --import tsx output/playwright/nested-wires/scale-scene/generate-scale-scene.mts
# run twice, compare complete bytes
GENERATED seed=7007; top=6; sections=12; nodes=40; wires=75; zero coordinates
PASS two runs byte-identical; bytes=6889; sha256=1b619c567767f279409e05abacc97a178938fbef8c8584d833362385623ad251

node --import tsx output/playwright/nested-wires/scale-scene/verify-scale-scene.mjs
exit 0
PASS semantic shape: 6 top / children 2+4 / 40 nodes / 75 unique wires / four ports each / fan-out 12 / fan-in 13 / long-range 4
INSPECTION {"corridors":[],"nodeBodies":[],"boundaries":[],"continuity":[]}
OVERLAPS []
INVALID_CONTACTS []
CROSSINGS {"world":13,"section-1":90,"section-2":0,"section-3":0,"section-4":3,"section-5":1,"section-6":1,"section-7":1,"section-8":0,"section-9":1,"section-10":0,"section-11":0,"section-12":2}
CERTIFICATION 112 certified / 0 uncertified
```

Full logs: [determinism](ruling5-determinism.txt), [scale suite](ruling5-invariants.txt).
The suite still checks all contacts before asserting, exact pin rows, four node
ports, distinct lane offsets, forward travel, boundaries/gate mouths, body and
corridor avoidance, containment, determinism, one stage each, registered turns,
endpoint/linked-order lower bounds and certificate negative controls.

```text
node --import tsx output/playwright/nested-wires/templates-scene/count-operations.mjs '{"directory":"output/playwright/nested-wires/scale-scene","specFile":"output/playwright/nested-wires/scale-scene/scale-scene-spec.json"}'
exit 0
MEASURE routing=2088; maxLawLeg=31; compile=43876; stages={"wire-registry":1821,"lane-allocation":9335,"network":23453,"lane-projection":9267}; roadPairDiscovery=0
MEASURE 40/80 nodes, 75/150 wires: total ops=59189/119028; growth=2.010981770261366
PASS max law leg <=60; per-wire ceiling; clone total growth <=2.5; instrumented byte identity; every stage once

python3 output/playwright/nested-wires/scale-scene/capture.py
exit 0
PASS headless Chrome 153.0.8010.48; 1920x1440; 40 nodes / 75 wires; layout=1; errors=0
MEASURE five loads=[1556.7000000476837,1562,1561,1540.6000000238419,1514.7999999523163]; median=1556.700 ms
```

[Ops](operations.json), [loads/stages](scale-browser.json),
[all-scene table and compounding answer](../README.md).
The clone doubles nodes **and wires**, unlike the older construction-only probe.
It is an operation-growth check, not an 80-node invariant certification. The
meter excludes the browser coverage audit, native sort internals and documented
numeric classes. The audit's O(XY(R+G)) rectangular grid is already the dominant
observed browser load term; layout growth alone is not a universal speed bound.

```text
python3 output/playwright/nested-wires/scale-scene/verify-nested-selection.py
final exit 1
PASS all 2a–2g, toggle, hub and api selection assertions
PASS all 3/b…api layout counter before=1 after=1 delta=0; frozen geometry/camera unchanged
MEASURE inherited selection five-load median=367.89999997615814 ms
AssertionError: median <= 300
```

Final [output](selection-output.txt) / [measurements](nested-selection.json);
earlier [passing Part B run](selection-part-b-output.txt) and
[first failed sample](selection-first-output.txt) are separate evidence.
Transport redirects only 5188→5191 and screenshot output locations; the runner
body is unchanged. No drag runner was substituted or required.

## Part C evidence and STOP mechanism

`sectionInPortsLeft?: boolean` defaults false; URL opt-in is `&ports-left`.
Interpretation is explicit: move top section entry to left edge at height/3,
place the prior left entry at 2*height/3. Stable identities remain distinct.
No node-port, section-exit, routing law or default-scene change was made.
Clarification about shifting *along* the top edge was requested; no alternate
experiment or offset search was undertaken without it.

| Scene/variant | Wire length | Compile ops | Crossings | Result |
| --- | ---: | ---: | ---: | --- |
| Templates current | 100,846 | 28,443 | 130 | 130/0 certified/uncertified |
| Templates left | 107,817.667 | 30,852 | 148 | 0/148; absent forward interval w17:9 and missing owned gate crossing |
| Scale current | 103,134 | 43,876 | 112 | 112/0, zero overlaps |
| Scale left | N/A | N/A | N/A | unroutable-leg w27: kernel.ts → resource.ts |

The scale-left registry executes 1,821 ops, but lane allocation, final roads,
network and projection do not execute. Atomic failed routing publishes no wire
graph. Reporting zero length/crossings here would be false. Instrumented and
ordinary failed outputs are byte-identical; failure-meter exits **1**.

Full per-section counts, lengths and validity results:
[comparison.json](port-ab/comparison.json),
[templates failed audit](port-ab/templates-left-invariants.txt),
[scale failed stages](port-ab/left-edge-scale-failure.json),
[scale partial operations](port-ab/scale-ports-left-operations.json).

Recommendation: **do not adopt** this left-edge variant. It worsens templates
length/compile/crossings and invalidates its gate proof, while scale cannot
route the long-range w27 under the required law. Current entrance placement
stays default. A different intended position needs clarification; a changed
routing law needs an orchestrator ruling, neither is assumed.

## Screenshots and visual scope

[Dimension gate](screenshots-output.txt) verifies all six 1920×1440 paths:

- [scale-roads-off.png](scale-roads-off.png)
- [scale-roads-on.png](scale-roads-on.png)
- [templates-current.png](port-ab/templates-current.png)
- [templates-ports-left.png](port-ab/templates-ports-left.png)
- [scale-current.png](port-ab/scale-current.png)
- [scale-ports-left.png](port-ab/scale-ports-left.png)

The last file is a failed, unwired scene. Additional roads-on/off and contract
reading views are colocated. [Visual review](ruling5-visual-review.md) records
90 contract crossings versus the general six-crossing budget, toolbar clipping,
tiny overview labels, deferred empty-panel compaction, and unmeasured contrast
floors. Numerical DoD 3 does not override these visual limitations. No overall
visual PASS is claimed. Approved references preserved; no subagents used.

## Handoff

Part B root-cause fix/evidence: `fb86264`. Part C is a separate evaluation/STOP
slice. Earlier STOP commits `60ae5d7` and `8082038` remain in history. No push,
PR, headed browser, real-browser session, new test file, law change, search or
new discovery loop. Only our 5191 server was started; 5190 was never contacted.
The final command output records clean status and the six-entry git log.
