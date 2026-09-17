# M7 amended — STOP at Part B scale geometry

**M7 is incomplete. The prescribed scale candidate fails the zero-uncertified and zero-overlap gates.**
Part A was not attempted: orchestrator ruling #4 withdraws compacting to M7.5.
The original STOP evidence commit `60ae5d7` is retained. No drag-runner requirement
was imposed; the amended selection-only requirement is understood.

The candidate is retained in [candidate-part-b.patch](candidate-part-b.patch),
not installed in the runtime. Production source and the canonical templates
verifier were restored byte-for-byte before handoff. The patch contains the
requested generator, scale browser builder, `?scale` dispatch, and scale verifier,
plus a configurable use of the existing templates invariant suite. This is
reproducible failed work, **not a completed Part B slice**. No source-quality
score or acceptance is claimed for these unadmitted candidate files.

No push, PR, subagent, new `*.test.ts`, browser session, or server operation.
Neither 5190 nor 5191 was contacted. Part C was not started after the hard gate
failed; there is no port-position parameter and no adoption.

## Candidate design and deterministic reproduction

The semantic spec has six top-level capability stages: contract, core, adapters,
service, web, CLI. Contract has two children; core has four. No other section has
children. Counts are exactly 12 sections / 40 nodes / 75 unique directed wires.
Every built node has four ports. Kernel has 12 fan-out; index has 13 fan-in.
There are four long-range wires whose top-level owner indices differ by at least
two, plus connected cross-section pipeline chains. Node IDs, containment and
requests are semantic; the generator writes no coordinates.

Seed 7007 orders supplemental local dependency pairs after the explicit hub,
re-export, pipeline and local-chain edges. It is fixed, not searched to evade
invariants. No wire was removed or retargeted after the geometry failure.

On an isolated checkout of this STOP commit:

```sh
git apply --check output/playwright/nested-wires/scale-scene/candidate-part-b.patch
git apply output/playwright/nested-wires/scale-scene/candidate-part-b.patch
node --import tsx output/playwright/nested-wires/scale-scene/generate-scale-scene.mts
node --import tsx output/playwright/nested-wires/scale-scene/verify-scale-scene.mjs
# Expected exit 1, not an accepted scene.
```

The patch applicability check exits 0. Two generator runs and a repeated failing
invariant run were executed. [Full determinism output](determinism-output.txt):

```text
GENERATED seed=7007; top=6; sections=12; nodes=40; wires=75; zero coordinates
GENERATED seed=7007; top=6; sections=12; nodes=40; wires=75; zero coordinates
PASS two generator runs byte-identical; bytes=6889; sha256=1b619c567767f279409e05abacc97a178938fbef8c8584d833362385623ad251
PASS repeated full invariant runner fails with exit 1; candidate failure reproduced
```

The retained [semantic spec](scale-scene-spec.json), [generated public scene](scene.json),
[invariant witnesses](invariant-audit.json), and [crossing certificates](crossing-certificates.json)
are failed-candidate evidence. The scene's coordinates come exclusively from the
public Layout builder; they are not authored input.

## Exact failure and audit limitation corrected

The inherited contact scan initially aborted at the first overlap. Consequently,
its initial `98 certified / 1 uncertified` result and section counts were only a
partial enumeration. [Initial output](initial-invariant-output.txt) is retained
for provenance and **must not be used as the complete scene count**.

The diagnostic patch now enumerates all transverse contacts before asserting
that invalid contacts are absent. It retains the overlap, no-parallel-contact,
registered-junction, lower-bound and zero-uncertified assertions. It changes no
certification thresholds or production routing. The complete scan reports:

```text
PASS semantic shape: 6 top / children 2+4 / 40 nodes / 75 unique wires / four ports each / fan-out 12 / fan-in 13 / long-range 4
PASS 40 nodes / 12 sections; every node and child inside its owner; finite bounds
PASS two complete builds byte-identical; each one-way pipeline stage once
PASS all 75 value wires route ok:true
PASS all wires inside corridors; gate-mouth crossings only; no body or continuity failures
FAIL zero positive-length parallel/coincident wire overlaps
FAIL all distinct-wire contacts transverse; no parallel touches; each crossing in a registered junction
CROSSINGS {"world":13,"section-1":94,"section-2":0,"section-3":0,"section-4":3,"section-5":1,"section-6":1,"section-7":1,"section-8":0,"section-9":1,"section-10":0,"section-11":0,"section-12":2}
FAIL actual crossing count equals additive endpoint and linked-order lower bound: 116 !== 112
CERTIFICATION 112 certified / 4 uncertified
FAIL zero uncertified crossings: 4 !== 0
```

[Complete command output](invariant-output.txt) and [repeat output](repeat-invariant-output.txt)
include the remaining successful assertions: finite bounds, empty-section
rejection, exact centered pin rows/pitch/end margins, four port sides, unique
lane offsets, forward travel, distinct gate positions, topological endpoint and
linked-order constraints, certificate negative controls, gate-mouth assignment,
and turn confinement. Both executions exit 1.

Two distinct-wire segment pairs overlap in contract (`section-1`):

| Wires and requests | Shared interval | Length | Registered location |
| --- | --- | ---: | --- |
| w31: node-2 → node-3; w63: node-2 → node-6 | y=397, x=1267…1303 | 36 | Right/left terminal junction on `section-1:vertical:1312:248` |
| w61: node-2 → node-4; w62: node-2 → node-5 | x=1135, y=471…513 | 42 | Bottom/top terminal junction on `section-1:horizontal:528:640` |

The four uncertified transverse contacts are at the two endpoints of those
intervals: (1267,397), (1303,397), (1135,471), (1135,513). They are not independent
unrelated failures. Body avoidance and individually planar terminal fans do not
establish pairwise separation through the joined junctions. The witnesses locate
the failure; a minimized root-cause proof or routing repair was not attempted
after STOP. This does not prove that every scene satisfying the prescribed shape
is impossible.

## Baseline and repository verification

Both the candidate repository check and the restored final repository check
exit 0. The passing suite does not supersede the failing geometry verifier.

```text
pnpm check — candidate: exit 0
Test Files  70 passed (70)
Tests       208 passed (208)
pnpm check — restored final source: exit 0
Test Files  70 passed (70)
Tests       208 passed (208)
```

Full logs: [candidate](candidate-pnpm-check.txt), [restored final](final-pnpm-check.txt).

```text
node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs
exit 0
PASS frozen nodes/sections/road ids + bounds/wire routes/gates: byte-identical
PASS deterministic regeneration: two fresh scene serializations byte-identical
PASS current canonical scene matches fresh public builder: 24 nodes / 26 wires
PASS zero new tracked *.test.ts files

node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs
exit 0
INSPECTION {"corridors":[],"nodeBodies":[],"boundaries":[],"continuity":[]}
OVERLAPS []
CROSSINGS {"world":76,"section-1":12,"section-2":0,"section-3":0,"section-4":36,"section-5":0,"section-6":0,"section-7":0,"section-8":6,"section-9":0}
CERTIFICATION 130 certified / 0 uncertified
```

Full logs: [nested structural identity](nested-identity-output.txt),
[templates invariant suite](baseline-templates-output.txt).

A separate whole-serialization comparison against `git show f77907c:<scene>`
checks **all** public scene bytes, without exclusions, plus production source,
selection-runner identity and absence of new tests. [Full proof output](baseline-proof-output.txt):

```text
PASS nested: fresh full public scene and canonical artifact byte-identical to f77907c; sha256=946bb1e9836c4242382a534ab97f4752b24d7bcc230e85be2835f720145a8e8a
PASS templates: fresh full public scene and canonical artifact byte-identical to f77907c; sha256=1940f9b9619a98fd600299aac5f40376184f9d8915d04e8bcbad0b43b4743253
PASS all production source unchanged from f77907c; candidate route is retained only in the diagnostic patch
PASS zero new tracked or untracked *.test.ts; STOP commit 60ae5d7 retained
```

Selection runner byte identity is verified; runner execution is **not** claimed.
No screenshots or browser timings were collected.

## Amended DoD — binary statuses

Unimplemented or unverified items are FAIL, never inferred PASS.

| # | Status | Evidence / limit |
| --- | --- | --- |
| 1. `pnpm check`, ≥208 tests, zero new test files | PASS | Candidate and restored final both exit 0; 70 files / 208 tests; zero tracked or untracked new `*.test.ts`. |
| 2. Nested and templates baseline identity, templates 130/0 | PASS | Unchanged verifiers exit 0; full serializations and canonical artifacts equal f77907c; templates 130/0. |
| 3. Generator, shape, full scale suite, ops/clone/loads, compounding answer | FAIL | Deterministic 40/75 semantic candidate proven; invariant suite exits 1: 2 overlaps and 4 uncertified contacts. Generator/route/verifier retained only as patch. No ops, 40→80 clone or five-load measurements. |
| 4. Part C A/B complete, parameter OFF, defaults unchanged | FAIL | A/B and parameter not implemented after STOP. Defaults unchanged; no adoption. |
| 5. Six required 1920×1440 screenshots on 5191 | FAIL | No headless browser/server launched; no captures or visual acceptance claim. |
| 6. Selection runners unchanged and pass, zero recalcs per click | FAIL | Runner bytes unchanged; not executed this attempt. No drag requirement substituted. |
| 7. README design, all-scene ops, A/B recommendation, weaknesses | FAIL | STOP appendix/design/failure evidence provided; ops and A/B deliverables unavailable. Compaction explicitly deferred to M7.5. |
| 8. Branch, sliced B/C commits, clean status, six-entry log | FAIL | Correct branch and retained original STOP commit; clean evidence handoff recorded after commit. No accepted B/C implementation slices. |

## Scale outlook and honest weaknesses

**Does any term compound toward 150 nodes / 300 wires, and what breaks first?**
No new operations, clone or load experiment was completed, so no compounding
bound or extrapolated timings can be asserted. The first *observed* failure in
this attempt is geometric at 40 nodes / 75 wires: two joined terminal junctions
produce coincident segments and uncertified contacts. That is not proof of the
first failure under every workload or of an asymptotic limit.

A/B wire length, per-section counts and compile comparisons do not exist; there
is no evidence-backed port-position recommendation. No adoption is warranted
from this attempt. Compaction remains M7.5 per ruling #4; sparse section panels
and overview density are not fixed here. The contract section's 94 transverse
contacts also exceed the general dense-map benchmark of six per section, even
before considering the two overlaps. No organized-flow, screenshot, reference
parity, or 150-node readiness claim is made.
