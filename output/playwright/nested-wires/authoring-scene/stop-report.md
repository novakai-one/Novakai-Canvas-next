> Restored from git history (feat/m8-authoring-scene); relative links below resolve on that branch: git show feat/m8-authoring-scene:output/playwright/nested-wires/authoring-scene/stop-report.md
# M8 — required STOP: real authoring hub exceeds fixed pin capacity

**Outcome: correct STOP under the milestone's explicit exception. No accepted
`?authoring` scene is installed.** Branch remains `feat/m8-authoring-scene`, based
on `9bfe1d9f014c296d9293a8cf16ae5923012b6257`. No push, PR, subagent, new test file,
server, or browser operation. Ports 5188/5190/5191 were not contacted.

The source-derived graph is true: **38 files, 11 sections, 104 value wires**.
The milestone's ten directories are the populated directories; representing
real nesting also requires their empty `core` ancestor. Source membership,
ordering, imported names and five complete import/re-export spot checks are in
[the M8 README section](../README.md#m8--real-authoring-scene-required-geometry-stop-2026-09-17).
The five files were also read directly: compose, canonical, versions, outcomes,
and index. The type/value split in canonical (`Digest` versus `digest`), the
mixed value/type imports in outcomes, and the index's value/type re-exports
match the emitted and dropped entries.

## Decisive witness and demand math

`core/validation/outcomes.ts` is `node-36` in `section-10` (core/validation).
It supplies values to 19 files. Under the unchanged route selection, **17**
requests use `node-36:exit-right`, wires **w78–w94**. The two remaining outgoing
requests use its bottom port. [Machine witness](capacity-witness.json) preserves
all 17 right-port consumers and their exact output coordinates.

Node bounds: `{x:5800, y:1624, width:192, height:96}`.
Right port center: `{x:5992, y:1672}`. Frozen pin pitch is 6 px and each end
margin must be at least 6 px. Therefore:

```text
available side = 96 px
usable pin-center span = 96 − 2×6 = 84 px
capacity = floor(84 / 6) + 1 = 15 pins
real demand = 17 pins
required side = (17 − 1)×6 + 2×6 = 108 px
shortfall = 108 − 96 = 12 px (two pins)
```

Actual pin centers span y=1624…1720. Allowed centers span y=1630…1714.
`w94` starts at (5992,1624), and `w78` at (5992,1720): both use a node corner,
leaving zero end margin. The centered pin formula is unchanged in
`capability/layout/core/nested-terminal-pins.ts`; pitch and dimensions remain
those of the existing placement/node law. The inherited verifier asserts exact
centered rows, pitch, node dimensions and margins.

Permuting these 17 pins cannot fit 96 px with the required margins. Enlarging
nodes, reducing pitch/margins, redistributing endpoints between ports or altering
the placement/route choice would require a law change; removing wires or
changing source grouping would make the map false. This proves infeasibility
under the current fixed assignment and law, not impossibility under every
conceivable layout. No alternative numbering/order was searched to evade it.

## Additional inherited failures

The unchanged M6 verifier, reused as in M7, reports:

| Check | Result |
| --- | --- |
| Containment / finite bounds / actual counts | PASS, 38 nodes / 11 sections |
| Four ports per node | PASS, wrapper assertion |
| Semantic directory tree / per-directory order | PASS |
| Deterministic builds / every stage once | PASS |
| Routing returns all requests | PASS, 104 wires; this alone does not establish validity |
| Corridor / body / continuity failures | 0 / 0 / 0 |
| Gate boundary violations | **63** |
| Positive-length overlaps | **4** |
| Exact pin row margins | **FAIL**, witness above |
| Assigned lanes / forward travel | **FAIL**, `w36:14` has no forward lane |
| Proof-region disjointness | **FAIL**, `J4/J111` overlap |
| Certification | **0 certified / 1,077 uncertified** |
| Gate-mouth assignment | **FAIL**, `w11` missing owned gate crossing |
| Turn confinement | PASS |

The proof aborts at intersecting proof regions before collecting endpoint
certificates. Its zero lower bound is **not a valid lower-bound proof**; it must
not be interpreted as showing that all 1,077 observed crossings are avoidable.
Contract has 68 observed contacts, not a valid certified-count result. No
contract-section `>90` certified-crossing claim is supportable here.

| Wires | Coincident interval | Length |
| --- | --- | ---: |
| w43 / w48 | y=1771, x=1342.5…1345.5 | 3 px |
| w49 / w82 | y=1825, x=298.5…303 | 4.5 px |
| w74 / w75 | x=5689, y=1987…2005 | 18 px |
| w74 / w104 | x=5689, y=2012.5…2077 | 64.5 px |

Full [audit](invariant-audit.json), [public scene](scene.json),
[crossing evidence](crossing-certificates.json), and
[verifier output](verification-output.txt) are retained. These are failed
candidate artifacts, not accepted scene baselines. The decisive pin-capacity
proof does not depend on diagnosing every additional projection failure.

## Reproduction and deterministic extraction

From the repository root:

```sh
node --import tsx output/playwright/nested-wires/authoring-scene/extract-scene.mts
node --import tsx output/playwright/nested-wires/authoring-scene/verify-authoring-scene.mjs
# Expected exit 1: mapping passes, inherited geometry gates fail.
node --import tsx output/playwright/nested-wires/authoring-scene/verify-identity.mjs
# Expected exit 0: complete baseline scene bytes unchanged.
pnpm check
# Run alone. Expected exit 0, 208 tests.
```

The generator uses TypeScript's AST, resolver and symbol checker exactly as M6.
It derives directories, nodes and wires from source, excludes explicit type
statements/specifiers and non-value symbols, and retains value re-exports.
The current tree has 97 value imports and 7 value re-exports with no duplicate
pairs; it drops 120 internal type declarations and 8 external declarations.
The verifier reruns extraction twice, compares both semantic spec and complete
source evidence, checks actual source statements, tracked file membership,
parentage/order, one wire per pair and the M6.5b label rule, then invokes the
unaltered invariant suite. It does not convert the STOP into an exit-0 test.

Spec SHA256:
`694f9eac55ad87366de7ff56d174728f432ac2979bcaaaad8fe908b57da449d8`.
[Determinism record](determinism-output.txt).

Review scope follows the M6 terminal evidence-tool pattern: the `.mts` extractor
and `.mjs` diagnostic/identity runners are retained offline candidate evidence,
not admitted production modules. Their Node assertion/IO failures intentionally
terminate the process for correction and rerun. No production source-quality
score is invented for them. No application/capability file changed or requires
an admitted-source review. `pnpm check` is verification of the repository, not
acceptance of the failed candidate or a substitute for a source-quality score.

## Existing scenes and repository gates

Fresh **full serialized public output** and canonical artifacts match
`git show 9bfe1d9:<scene-path>` byte for byte, with no field exclusions.
[Identity log](identity-output.txt) also verifies offline road coverage, unchanged
layout/hosts/verifiers/selection runner and zero new tracked or untracked tests.

| Scene | Certified / uncertified | Complete serialization SHA256 |
| --- | --- | --- |
| nested | 23 / 0 | `946bb1e9836c4242382a534ab97f4752b24d7bcc230e85be2835f720145a8e8a` |
| templates | 130 / 0 | `1940f9b9619a98fd600299aac5f40376184f9d8915d04e8bcbad0b43b4743253` |
| scale | 112 / 0 | `5779c71c97d40fd0ae8b64fb903d603b019f4ccb528aa9dbc84b5a57fb50fd74` |

All 12 inherited baseline invocations passed, including nested geometry/pins/
lanes/topology/identity/static/oracle checks and templates/scale full suites;
see `*-baseline.txt`. `pnpm check` ran alone, exit 0, **70 files / 208 tests**:
[complete log](pnpm-check-output.txt). No baseline artifact was changed.

## Binary milestone accounting

STOP satisfies the explicitly requested stop condition; it does not turn
unimplemented or unmeasured DoD items into passes.

| DoD | Status | Evidence / limitation |
| --- | --- | --- |
| 1. Check / tests / no new tests | PASS | Standalone check, 208 tests, zero added tests |
| 2. Route / deterministic coordinate-free spec | INCOMPLETE | Spec/determinism pass; route not installed after STOP |
| 3. True map and five-file spot checks | PASS | Actual 38/11/104 map, 120 internal type-only drops, README table |
| 4. Full authoring invariant suite | FAIL | Capacity shortfall plus overlaps/boundaries/certification/forward/gate failures |
| 5. Baseline scenes/counts | PASS | Full bytes equal 9bfe1d9; inherited suites pass, counts unchanged |
| 6. Ops / clone / discovery | NOT RUN | Stopped before performance work; unchanged M6 invocation documented in README |
| 7. Five-load timings / decomposition | NOT RUN | No authoring host, browser, server or timing claim |
| 8. Nested selection ≤450 ms | NOT RUN | Runner byte identity proven; no fresh selection measurement |
| 9. Three screenshots | NOT RUN | No rendering/visual acceptance claimed after geometry STOP |
| 10. README | PARTIAL | Mapping, five-file evidence, STOP, scaling limits; unavailable measurements explicit |
| 11. Local commits / clean tree / log | Recorded at handoff | Evidence and report commits only; no push or PR |

## Compounding answer and remaining limits

At 38 files the fixed right port has already exceeded capacity; total scene size
is not a sufficient predictor of feasibility. A 76-node/208-wire disjoint clone
would repeat the same invalid hub even if operation growth were ≤2.5×. There is
no authoring ops/stage table, clone ratio or discovery count from this STOP, so
no quantitative 150-node performance extrapolation is justified. Lazy audit is
unchanged. An authorized law decision must resolve the pin-demand contradiction
before browser timing, selection, screenshots or visual acceptance can finish.

The graph also has intersecting proof regions and projection failures independent
of any performance claim. A successful future pin repair alone will not prove
the full scene valid; rerun every unchanged invariant. No reference-image or
benchmark parity is claimed. Approved reference images remain unchanged.

## Six-entry local log

Snapshot after the evidence commit, immediately before committing this report
and the README. The documentation commit adds no runtime/source changes.

```text
9630a69 chore(m8): retain source-derived authoring capacity stop evidence
9bfe1d9 fix(m76): reduce capture complexity without changing assertions
5cdb961 docs(m76): retain passing gates and stop on headless dropdown capture
24aee72 fix(prototype): defer road coverage and keep toolbar controls visible
5c43d23 docs(m76): stop on conflicting exact operation baselines
d720e7f feat(layout): evaluate left section entrances behind an off-by-default option
```
