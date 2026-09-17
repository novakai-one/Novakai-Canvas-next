> Restored from git history (feat/m8-authoring-scene); relative links below resolve on that branch: git show feat/m8-authoring-scene:output/playwright/nested-wires/authoring-scene/m8b/stop-report.md
# M8b — STOP after legal-size feasibility probe

**STOP under the retained M8b condition: legal pins do not clear the remaining
invariant failures. No runtime sizing implementation or `?authoring` route is
admitted. M8 is not complete.** Work stays on `feat/m8-authoring-scene`, starting
at `a380f20`; both earlier STOP evidence commits remain. No push, PR, subagent,
server or browser. No port was contacted, including 5188/5190/5191.

The original [M8 STOP](../stop-report.md) was read before the M8b brief. Its
artifacts are unchanged. Ruling #13 supersedes the old prohibition on node
sizing; it does not authorize changing routing, fan projection, lane widths,
section gutters, pin pitch, margins, port counts or wire membership.

## What was actually executed

[probe-sizing.mjs](probe-sizing.mjs) is an **offline feasibility experiment**,
not the finished demand-driven runtime pipeline. It builds each unchanged public
scene to obtain actual per-side demands, then bundles a separate placement
candidate with those demands frozen as its sizing inputs. Only the node-footprint
and content-sizing modules are substituted in memory. No production file changes.
The semantic spec contains no coordinates. No node/file/section ID is singled
out by the sizing algorithm; every node receives the same rule.

Each candidate build runs the ordinary pipeline once, with the exact existing
stage sequence, one execution per stage and no routing retry. Two candidate
builds are byte-identical. Every wire's selected source side, target side and
section-gate sequence is identical to the unchanged build. The two independent
builds used to prepare and test the probe are **not** claimed to implement a
single-pass production demand pipeline. That integration was deliberately not
attempted after this geometry STOP. This distinction is essential: the evidence
proves the sized candidate still fails, not that runtime sizing has landed.

The candidate retains the existing uniform section grid. Its column pitch is the
maximum demanded node width in that section plus 144; its row pitch is the
maximum demanded node height plus 144. Content-first section sizing and the
existing top-down placement absorb those footprints. `core/validation` grows
from 800×656 to 800×848; `core` grows from 6128×976 to 6128×1168. The unaffected
`core/admission` section translates down 96 without changing size. The full
containment, finite-bounds, determinism and stage-once assertions pass.

## Published sizing rule and exact demand math

For a side demand `d`, `required(d) = (d − 1) × 6 + 12`.
For a dimension with default `b` and opposing demands `a,bDemand`:

```text
size = max(default, 96 × ceil(required(max(a, bDemand)) / 96))
width default = 192; opposing sides = top/bottom
height default = 96; opposing sides = left/right
capacity(length) = floor((length − 12) / 6) + 1
96 / 192 / 288 lengths have capacities 15 / 31 / 47
```

The 192-unit default width is retained even for zero top/bottom demand. Both
axes grow independently; opposing overflows use their maximum, not their sum.
[Demand evidence](demand.json) enumerates every node before and after sizing.
Only `node-36`, `core/validation/outcomes.ts`, grows: **192×96 → 192×192**.
Its 17 right-side wires still use that side; two additional outputs use bottom.

```text
right demand = 17
required height = 16×6 + 12 = 108
rounded height = 96×ceil(108/96) = 192
new capacity = floor((192−12)/6)+1 = 31
node bounds = {x:5800, y:1624, width:192, height:192}
right port center = (5992,1720)
pin-center span = 1672…1768; exact pitch = 6
end margins = 1672−1624 = 1816−1768 = 48 (both >=6)
```

The supplementary [witness runner](collect-witnesses.mjs) independently verifies
**all 38 exact dimensions and all 208 pin endpoints**: exact centered rows,
pitch 6, end margins ≥6, four ports, and global terminal uniqueness. Three
negative controls reject a 96-high hub, a 288-high hub, and an oversized ordinary
node. Its exit 0 means those diagnostic assertions pass; it never overrides
the full suite's exit 1.

## Verifier evolution, not weakening

The inherited verifier is unchanged on disk. The offline copy changes only:

- `width === 192; height === 96` → exact per-node width/height computed from
  that candidate's **actual routed per-side demand** and the published rule.
- The check's label says `exact demand-sized nodes` instead of `192x96 nodes`.

[verifier-evolution.json](verifier-evolution.json) retains the old/new assertion
text and complete verifier SHA256s. Reversing these two edits is asserted to
recover the original verifier byte for byte. Only its import URL is then pointed
at the private candidate bundle. All pin-row, margin, fan-planarity, gate,
forward-travel, overlap, proof-disjointness, certificate and stage assertions
are retained. The combined pin/fan check still correctly fails on fan planarity;
its label is not mistaken for a residual pin-size failure.

## Decisive remaining witnesses

[remaining-witnesses.json](remaining-witnesses.json) includes exact roads, lane
assignments, fan intersections, missing/backward lanes, pin rows and body hits.
The full [scene](scene.json), [audit](invariant-audit.json),
[certificates](crossing-certificates.json), and [suite output](invariant-output.txt)
are failed candidate evidence, not accepted baselines.

### Independent ancestor-road demand exceeds the retained separation

The exact rule changes only hub height; its width remains 192. The ancestor
road center separations are unchanged, and all gate sequences remain fixed.
The road law reserves `12 + 12×d` total width for demand `d`:

| Road at center | Demand | Total width | Half width |
| --- | ---: | ---: | ---: |
| world vertical, x=64 | 11 | 144 | 72 |
| core vertical, x=200 | 19 | 240 | 120 |
| world horizontal, y=1184 | 7 | 96 | 48 |
| core horizontal, y=1368 | 36 | 444 | 222 |

```text
horizontal separation = 200−64 = 136
required disjoint separation = 72+120 = 192; shortfall = 56
vertical separation = 1368−1184 = 184
required disjoint separation = 48+222 = 270; shortfall = 86

J4   = x[-8,136], y[1136,1232]
J111 = x[80,320], y[1146,1590]
intersection = x[80,136], y[1146,1232] = 56×86
```

These are ordinary junction bounds, with no terminal-fan enlargement needed.
The proof verifier rejects their overlap. The same crowding leaves
`drive:section-4:entry-left` at **{x:136,y:1816,width:0,height:48}**.
`w36:14` owns a rightward lane there but has **zero assigned segments**.
The gate plane is x=136, the outer street reaches x=136, and the inner street
already begins at x=80. Hub-height growth cannot create a positive horizontal
approach or disjoint these ancestor regions. Fixing this witness requires a
separate decision about road/gate spacing, allocation or routing, beyond the
exact node-sizing rule. No such change is made.

### Legal pins still feed a nonplanar fan

`w93` has a rightward assigned lane but travels backward from (6082,1729) to
(6061,1729). It crosses `w92`'s fan segment at **(6076,1729)**. There are 42
segment-pair contacts inside this hub driveway (not 42 certified crossings).
`w86:0`, index 7 of 17, has fan depth `(17−7−1)×6 = 54`, placing its fan end at
x=6046. Its retained turn joins x=6025, **21 units behind** that endpoint.

The adjacent vertical street has 17 assigned lanes, total width 216, centered
at x=6064. Its near edge is 5956, while the hub's right edge is 5992:
**108 half-width exceeds the 72-unit node-to-street-center clearance by 36**.
The retained terminal extent is `(17−0.75)×6 = 97.5`, larger than that 72-unit
clearance. Increasing the perpendicular pin-row height does not increase this
horizontal clearance. `w82:4`, from (5992,1813) to (5977,1813), enters the enlarged
hub's body. The inspector reports 12 such offending segments.

All four old positive-length overlaps survive, translated where appropriate;
three new 1.5-unit intervals share `w86`'s backward horizontal segment:

| Wires | Coincident interval | Length |
| --- | --- | ---: |
| w43 / w48 | y=1867, x=1342.5…1345.5 | 3 |
| w49 / w82 | y=1921, x=298.5…303 | 4.5 |
| w74 / w75 | x=5689, y=2179…2197 | 18 |
| w74 / w104 | x=5689, y=2204.5…2269 | 64.5 |
| w86 / w88 | y=1765, x=6031…6032.5 | 1.5 |
| w86 / w89 | y=1765, x=6037…6038.5 | 1.5 |
| w86 / w91 | y=1765, x=6043…6044.5 | 1.5 |

### Full-suite result

| Gate | Result |
| --- | --- |
| True map | PASS: 38 files / 11 sections / 104 value wires |
| Containment / finite bounds / four ports | PASS |
| Exact dimensions / centered pins / pitch / margins | PASS independently; combined check fails on fan planarity |
| Pipeline stage-once / two-build determinism | PASS for each candidate build |
| Terminal sides / gate sequences preserved | PASS, all 104 requests |
| Corridor / body / boundary / continuity violations | 0 / **12** / **57** / 0 |
| Positive-length overlaps | **7**, must be 0 |
| Forward travel | FAIL, `w36:14` missing; hub backward lanes also witnessed |
| Gate-mouth traversal | FAIL, `w11` missing owned crossing |
| Proof-region disjointness | FAIL, `J4/J111` |
| Certified / uncertified crossings | **0 / 1,078**, must have zero uncertified |
| Turn confinement / certificate negative controls | PASS |

Proof collection aborts before certification. Its numeric zero lower bound is
**not a valid proof** that all 1,078 crossings are avoidable. Contract has 68
observed contacts; no valid contract certified count or >90 claim is available.

## Baselines and repository gates

Full candidate nested/templates/scale bytes equal `git show 9bfe1d9:<scene>`
with no excluded fields. Every node is under capacity there. Fresh unchanged
production builds also match. The 12 inherited baseline invocations all exit 0;
nested/templates/scale certified/uncertified counts remain **23/0, 130/0, 112/0**.

| Scene | Full serialization SHA256 |
| --- | --- |
| nested | `946bb1e9836c4242382a534ab97f4752b24d7bcc230e85be2835f720145a8e8a` |
| templates | `1940f9b9619a98fd600299aac5f40376184f9d8915d04e8bcbad0b43b4743253` |
| scale | `5779c71c97d40fd0ae8b64fb903d603b019f4ccb528aa9dbc84b5a57fb50fd74` |

The source-map verifier reran extraction twice. Spec and source evidence are
byte-identical; spec SHA256 remains
`694f9eac55ad87366de7ff56d174728f432ac2979bcaaaad8fe908b57da449d8`.
The [M8 README five-file table](../../README.md#five-file-import-spot-check)
remains applicable: all production source files are unchanged and every recorded
source statement is checked again. Counts remain 97 value imports + 7 value
re-exports, 120 dropped internal type declarations and 8 dropped external ones.

`pnpm check` ran alone and exited **0**, with **70 test files / 208 tests**:
[pnpm-check-output.txt](pnpm-check-output.txt). The first run failed solely on
unreferenced symbols in the probe's generated `.local` bundles; its
[log](pnpm-check-initial-scratch-failure.txt) is retained. The harness now cleans
its OS-temporary bundles on exit; no lint rule or exclusion was changed.
No new `*.test.ts`. No source-quality score is invented: the two `.mjs` files
and in-memory source substitutions follow the prior M8 offline evidence-tool
scope, with Node-owned assertion/IO failures. They are not admitted application
or capability modules, and this STOP does not satisfy the >144/160 production
admission requirement for a future sizing implementation.

## Binary M8b accounting and limits

| DoD | Status |
| --- | --- |
| 1. Standalone check / >=208 tests / no new tests | PASS: exit 0, 70 files / 208 tests, no added tests |
| 2. Route / generator | Generator PASS; route and runtime sizing NOT IMPLEMENTED after STOP |
| 3. True map / five files | PASS, freshly rerun |
| 4. Full invariant suite | FAIL, witnesses above; STOP condition satisfied |
| 5. Full baseline bytes and counts | PASS |
| 6. Ops / clone <=2.5× / discovery 0 | NOT RUN; no authoring performance or operation claims |
| 7. Five loads / <=500 ms / roads-on | NOT RUN; no server or route |
| 8. Selection <=450 ms / zero deltas | NOT RUN; runner remains byte-identical, not freshly measured |
| 9. Three 1920×1440 screenshots | NOT RUN after geometry STOP |
| 10. README | Updated with sizing, witnesses, limits and unmeasured fields |
| 11. Commits / clean tree / six-entry log | Local evidence/report commits; final state recorded at handoff |

**Compounding toward 150 nodes:** capacity is local, not a function of total node
count. Ruling #13 repairs the 17-pin side, but the same 38-file map still exceeds
ancestor road separation and terminal approach geometry. A disjoint 76-node,
208-wire clone repeats these defects regardless of its operation ratio. No
quantitative clone-growth or 150-node performance prediction is supported.
Lazy audit and the selection implementation remain unchanged.

No browser screenshot or reference-image/benchmark parity is claimed. The
approved references are untouched. This is infeasibility under the retained
placement/routing policy plus the authorized exact sizing rule, not a proof that
no conceivable alternative layout could work. No alternative node ordering,
wire filtering, side redistribution, wider gutters or router changes were tried
to evade the stop condition.

## Reproduction

From the repository root:

```sh
node --import tsx output/playwright/nested-wires/authoring-scene/m8b/probe-sizing.mjs
# Expected exit 1: exact-size candidate fails the full unchanged geometry gates.
node output/playwright/nested-wires/authoring-scene/m8b/collect-witnesses.mjs
# Expected exit 0: confirms exact pins and the concrete remaining failure witnesses.
node --import tsx output/playwright/nested-wires/authoring-scene/verify-authoring-scene.mjs
# Expected exit 1: source mapping passes; the original unsized STOP remains.
node --import tsx output/playwright/nested-wires/authoring-scene/verify-identity.mjs
# Expected exit 0: production outputs, verifiers and source remain unchanged.
pnpm check
# Run alone; see the retained result.
```

The private esbuild bundles use a unique operating-system temporary directory,
removed when the probe exits. All accepted source and old STOP artifacts remain unchanged. No tool
installs or dependencies were added.

## Six-entry local log

Snapshot after the evidence commit, immediately before this documentation commit.
The final documentation commit contains only this report and the README update.

```text
ee8c2ed chore(m8b): retain legal-pin sizing probe and routing stop witnesses
a380f20 docs(m8): explain pin-demand stop and source mapping proof
9630a69 chore(m8): retain source-derived authoring capacity stop evidence
9bfe1d9 fix(m76): reduce capture complexity without changing assertions
5cdb961 docs(m76): retain passing gates and stop on headless dropdown capture
24aee72 fix(prototype): defer road coverage and keep toolbar controls visible
```
