# M6.5 — STOP: occupancy candidate fails frozen geometry invariants

This milestone is **not complete**. Work stayed on `feat/m65-presentation`,
starting at `b20053d`. No push, PR, subagent, browser launch, or server operation
was performed. In particular, port 5190 was never contacted. Verification
stopped before a port-5191 browser server was needed.

The production tree and original M6 evidence are restored byte-for-byte to
`b20053d`. Only this diagnostic evidence and the README appendix are committed.
There is no active compaction or styling implementation in the final tree.

## Blocking evidence

The retained [candidate patch](candidate-placement.patch) changes only
`prototype-nested-placement.ts`. The predicate is exactly
`directNodeCount <= 2`, including the zero-direct-node parent. It uses 36 world
units of uniform padding around leaf node content: 30 inside the street frame
and six outside it. The two-node content gap remains 144 units. Node sizes,
section-port midpoint calculation, routing/lane/gate/pin/topology code are
unedited. Nevertheless, the resulting geometry fails the unchanged verifier.

```text
$ node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs
exit 1
INSPECTION counts: corridors=18, nodeBodies=0, boundaries=13, continuity=0
OVERLAPS []
PASS all 29 value wires route ok:true
PASS 3c/d all pin rows exact, centered, ordered, pitch 6, >=6 end margins; 192x96 nodes; single-wire pins unchanged; globally unique terminals
FAIL four owned port sides; assigned lanes distinct, pitch 6 and forward; all gate positions distinct: no forward lane w17:9
FAIL topological endpoint ranges and linked road-order constraints: J6/J40 proof regions overlap
CERTIFICATION 0 certified / 168 uncertified
FAIL every gate traversal crosses its own mouth at its assigned distinct offset: w17 missing owned gate crossing
```

Full stdout/stderr: [candidate-final-invariants.txt](candidate-final-invariants.txt).
Exact rejected geometry: [rejected-scene.json](rejected-scene.json).
Segment/road witnesses: [rejected-invariant-audit.json](rejected-invariant-audit.json).

A concrete failure is `w07:17` at core/validation: its segment runs from
`(1806,1008)` to `(1806,948)` but its assigned horizontal corridor's vertical
extent is `[984,1056]`. This is an actual out-of-corridor path, not merely an
outdated certificate. Another is `w10:11` at the core parent: it reaches
`y=823.5` while the assigned corridor begins at `y=876`.

Shrinking the section inset leaves insufficient room between its midpoint
mouth and widened internal street/turn geometry. Symmetric content placement
also aligns single-node left/right pins with the section's midpoint mouths;
the old asymmetric top/side padding separated them vertically by 24 units.
These observations explain why section sizing cannot be accepted solely from
occupancy and `wiring.ok`. They are not a proof that every possible placement
policy is impossible under the brief.

Nine padding/clearance probes were run through the unchanged templates runner;
all exited 1. [compaction-probes.json](compaction-probes.json) includes every
failure message. Candidate variants at 32 and 36 total padding meet occupancy
but fail corridor and boundary checks. Even the tested 120-unit padding variant
still has one boundary violation and fails occupancy. No routing repair, gate
move, lane reassignment policy, pin-pitch change, verifier relaxation, or fake
passing check was introduced. A passing implementation under the frozen scope
has not been established, so the brief's STOP instruction applies.

## Before / rejected candidate / restored final occupancy

The M6 diagnostic counts direct node and immediate child rectangles, divided by
section area. It is not pixel coverage. Single-node candidate panels are
264×168; two-node panels are 600×168; all nodes remain 192×96.

| Section | Meaning | M6 empty | Rejected candidate empty | Restored final empty |
| --- | --- | ---: | ---: | ---: |
| section-1 | contract | 65.1254% | 81.8635% | 65.1254% |
| section-2 | contract/ports, 2 nodes | 88.9231% | 63.4286% | 88.9231% |
| section-3 | contract/records, 2 nodes | 88.9231% | 63.4286% | 88.9231% |
| section-4 | core parent | 57.2184% | 63.5466% | 57.2184% |
| section-5 | core/admission, 1 node | 90.4509% | 58.4416% | 90.4509% |
| section-6 | core/discovery, 1 node | 90.4509% | 58.4416% | 90.4509% |
| section-7 | core/expansion, 1 node | 90.4509% | 58.4416% | 90.4509% |
| section-8 | core/validation, 2 nodes | 88.9231% | 63.4286% | 88.9231% |
| section-9 | adapters, 1 node | 90.4509% | 58.4416% | 90.4509% |

The parent occupancy regression is an additional weakness of this candidate.
The runnable [proof/occupancy audit](verify-compaction-proof.mjs) reads the
actual predicate from the retained patch and enumerates the public `?nested`
scene, rather than duplicating its trigger. [Full output](compaction-proof-output.txt):

```text
$ node --import tsx output/playwright/nested-wires/presentation/verify-compaction-proof.mjs
exit 0
ENUMERATION {"section":"section-1","directNodeCount":6,"compact":false}
ENUMERATION {"section":"section-2","directNodeCount":6,"compact":false}
ENUMERATION {"section":"section-3","directNodeCount":6,"compact":false}
ENUMERATION {"section":"section-4","directNodeCount":6,"compact":false}
PASS rejected compacting predicate matches zero ?nested sections
PASS restored ?nested full serialization byte-identical to b20053d
PASS rejected candidate meets leaf occupancy thresholds; invariant failure still rejects it
```

## Binary DoD record

FAIL includes explicitly unverified deliverables; it never means an unrun
check secretly passed. Baseline restoration checks do not validate M6.5.

| DoD | Status | Evidence / limitation |
| --- | --- | --- |
| 1. `pnpm check`, ≥208 tests, no new test files | PASS (restored tree) | Exit 0, 70 files / 208 tests; no new `*.test.ts`. [Output](restored-pnpm-check.txt). |
| 2. Required occupancy reduction | FAIL | Retained candidate meets the thresholds, but was rejected. Final production retains M6 occupancy; per-section numbers above. |
| 3. Nested byte identity + committed enumeration | PASS | Unchanged structural verifier exits 0 with the exact retained candidate and after restoration; enumeration is 6/6/6/6, zero matches. [Candidate](candidate-final-identity.txt), [restored](restored-identity.txt), [proof](compaction-proof-output.txt). |
| 4. Both scenes' invariant suites, templates 130/0 | FAIL | Candidate templates runner exits 1, reports 0/168, and real corridor/boundary/forward/gate failures. Restored templates baseline exits 0, 130/0. Remaining inherited runners were not re-run after STOP. |
| 5. Both-scene ops, stage deltas, discovery, clone | FAIL — unverified | Not run or republished after the geometry STOP. Prior M6 values are not claimed as fresh measurements. |
| 6. Five headless screenshots + visible improvements | FAIL — unverified | Not captured. No browser/server was launched. No visual improvement claim. |
| 7. Selection runners | FAIL — unverified | Not run after STOP; renderer untouched. An unchanged renderer alone is not a PASS. |
| 8. README, tokens, convergence, honest weaknesses | FAIL — incomplete feature | STOP appendix added. No new tokens or convergence treatment delivered. Weaknesses remain as below. |
| 9. Branch, logical commits, clean status, log | PASS at final handoff | Diagnostic evidence and STOP documentation committed separately on `feat/m65-presentation`; final status/log printed in handoff. No push/PR. |

Restoration verification:

```text
$ pnpm check
exit 0
Test Files  70 passed (70)
Tests       208 passed (208)

$ node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs
exit 0 (both retained candidate and restored source)
PASS frozen nodes: byte-identical to 0e5f21e
PASS frozen sections: byte-identical to 0e5f21e
PASS frozen road ids + bounds: byte-identical to 0e5f21e
PASS frozen wire routes (ordered road sequences): byte-identical to 0e5f21e
PASS frozen gates: byte-identical to 0e5f21e
PASS current canonical scene matches fresh public builder: 24 nodes / 26 wires
PASS zero new tracked *.test.ts files

$ node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs
exit 0 (restored baseline only)
INSPECTION {"corridors":[],"nodeBodies":[],"boundaries":[],"continuity":[]}
OVERLAPS []
CERTIFICATION 130 certified / 0 uncertified

$ git diff --exit-code b20053d -- capability apps output/playwright/nested-wires/templates-scene
exit 0
```

Full restored invariant output:
[restored-templates-invariants.txt](restored-templates-invariants.txt).
The structural verifier's 37 lane-index differences from historical `0e5f21e`
are inherited M4.5 differences; complete current nested serialization matches
`b20053d`, as separately checked above.

## Still visually weak / undelivered

No fresh screenshot judgment is claimed. The unchanged M6 review still records
large sparse panels, small fit-view labels, and the long adapters perimeter
route. Default wire prominence and convergence styling remain untouched.
**Token names used: none added or changed. Convergence treatment: not implemented.**
The approved reference assets and all existing verification runners are unchanged.

For reproduction, the patch is against `b20053d`; apply it only in an isolated
scratch copy, run the existing templates verifier, and expect exit 1. The nine
probe records vary only `compactInset` and `compactClearance` in that patch.
Do not install the rejected patch as a completed milestone.
