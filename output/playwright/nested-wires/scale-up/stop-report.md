# M7 — STOP in Part A: demand-reservation sizing misses occupancy

**Milestone incomplete. No compaction, scale route, generator, or port A/B was installed.**
Work remained on `feat/m7-scale`, starting at `f77907c`. The complete production
source and both canonical scenes remain unchanged. No push, PR, subagent,
new test file, browser session, or server operation was performed. Port 5190
was never contacted; port 5191 was not needed before this STOP.

## What was attempted, and why it stopped

Read the milestone and M6.5 stop report before evaluating Part A. The offline
probe consumes the fresh public templates scene's **actual per-road lane demand**.
It evaluates a conservative reservation policy, rather than another fixed inset:

- Lane pitch `p = 6`, checked against the production declaration; demanded road
  radius `r = p × (lane count + 1)`, checked against every consumed road's bounds.
- Terminal fan depth `f = max(0, terminal lane count − 0.75) × p`, matching
  `nested-road-capacity.ts`; positive stem `s = p / 4`.
- Street-to-node clearance `r + f + s`; boundary-to-street clearance `r + s`.
- Side midpoint mouth / node-pin separation is the sum of their demanded road
  radii plus `s`. Required top/bottom content margins are enlarged only by
  `max(0, 2 × separation − abs(top margin − bottom margin))`, on the already
  larger side. This derives the asymmetry from demand, not the historical 24 units.
- Width sums the actual node widths, adjacent inner clearances, and outer street
  padding. Height is actual node height plus the required top/bottom margins.
  Both start with content extent and grow to satisfy the reserved turn geometry.

The candidate predicate is exactly `directNodeCount <= 2`. Enumeration includes
zero-direct-node `core`; the feasibility probe evaluates **leaf** sizing only.
Parent reflow, final placement, retained-plan remapping, and projection were not
implemented after the leaf gate failed.

Four of seven leaf sections miss the requested thresholds. For `core/validation`,
the top and bottom streets carry 5 and 8 lanes: radii 36 and 54. Its terminal fans
need 13.5 and 19.5 units. With positive stems, top and bottom margins become 88.5
and 130.5 units, giving height `96 + 88.5 + 130.5 = 315`. The width is 456; two 192×96
nodes occupy only 25.6642% of that rectangle. This is the concrete rejected
sizing result, **not a proof that every demand-derived design is impossible**.

This conservative policy keeps full street/fan reservations distinct. A different
mouth topology, tighter reservation model, or different distribution of traffic
could improve it. None has been implemented or certified here. Changing those
requires a fresh actual geometry/certification pass; the green baseline cannot
stand in for one. Per the milestone's STOP instruction, B and C were not started.

## Before / rejected sizing / actual final occupancy

The proposed column is a sizing calculation, **not rendered geometry**. No
candidate crossing certification or visual safety claim is made. Actual final
occupancy equals the unchanged baseline. Parent occupancy remains 65.1254%
empty for `contract` and 57.2184% for `core`.

| Leaf | Nodes | Before empty | Proposed sizing empty | Final empty | Limit | Candidate |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| contract/ports | 2 | 88.9231% | 43.8366% | 88.9231% | ≤65% | PASS |
| contract/records | 2 | 88.9231% | 54.5344% | 88.9231% | ≤65% | PASS |
| core/admission | 1 | 90.4509% | 65.6549% | 90.4509% | ≤60% | FAIL |
| core/discovery | 1 | 90.4509% | 65.6549% | 90.4509% | ≤60% | FAIL |
| core/expansion | 1 | 90.4509% | 64.3578% | 90.4509% | ≤60% | FAIL |
| core/validation | 2 | 88.9231% | 74.3358% | 88.9231% | ≤65% | FAIL |
| adapters | 1 | 90.4509% | 55.7811% | 90.4509% | ≤60% | PASS |

## Reproducibility and exact outputs

The rejected offline probe and read-only baseline proof are retained in
[diagnostic-scripts.patch](diagnostic-scripts.patch), not installed in the app or
accepted as production source. Apply it in an isolated copy of this branch to
reproduce the commands below. It adds only the two named audit scripts. No
network/server/browser is needed. Each script's Node process owns failures;
rerunning deterministically replaces the probe JSON. No existing verifier was
changed, weakened, or re-baselined.

```sh
git apply output/playwright/nested-wires/scale-up/diagnostic-scripts.patch
node --import tsx output/playwright/nested-wires/scale-up/probe-demand-clearance.mjs
# Expected exit 1: rejected sizing policy.
node --import tsx output/playwright/nested-wires/scale-up/verify-baseline-proof.mjs
# Expected exit 0: original scenes unchanged and trigger enumeration.
```

The complete demand records are in [demand-clearance-probe.json](demand-clearance-probe.json).
Probe stdout:

```text
PASS section-2 nodes=2 before=88.9231% candidate=43.8366% limit=65% size=429x153 mouth-separation=13.5
PASS section-3 nodes=2 before=88.9231% candidate=54.5344% limit=65% size=429x189 mouth-separation=13.5
FAIL section-5 nodes=1 before=90.4509% candidate=65.6549% limit=60% size=267x201 mouth-separation=37.5
FAIL section-6 nodes=1 before=90.4509% candidate=65.6549% limit=60% size=267x201 mouth-separation=37.5
FAIL section-7 nodes=1 before=90.4509% candidate=64.3578% limit=60% size=253.5x204 mouth-separation=37.5
FAIL section-8 nodes=2 before=88.9231% candidate=74.3358% limit=65% size=456x315 mouth-separation=19.5
PASS section-9 nodes=1 before=90.4509% candidate=55.7811% limit=60% size=235.5x177 mouth-separation=25.5
RESULT 4/7 leaf occupancy gates fail; no candidate installed

```

Committed enumeration and full serialization proof (exit 0):

```text
ENUMERATION {"section":"section-1","directNodeCount":6,"compact":false}
ENUMERATION {"section":"section-2","directNodeCount":6,"compact":false}
ENUMERATION {"section":"section-3","directNodeCount":6,"compact":false}
ENUMERATION {"section":"section-4","directNodeCount":6,"compact":false}
PASS rejected sizing-policy trigger matches zero nested sections (no runtime compact path installed)
PASS fresh full nested serialization byte-identical to f77907c
PASS fresh full templates serialization byte-identical to f77907c
PASS production source unchanged from f77907c
PASS zero new tracked or untracked *.test.ts files

```

`node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs`
exited 0. [Full output](structural-identity-output.txt) includes frozen
nodes/sections/roads/routes/gates, canonical serialization, and no added tests.
The reported 37 lane-index differences are inherited relative to `0e5f21e`,
not changes from this branch's `f77907c` baseline.

`node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs`
exited 0. [Full output](baseline-templates-output.txt):

```text
INSPECTION {"corridors":[],"nodeBodies":[],"boundaries":[],"continuity":[]}
OVERLAPS []
CROSSINGS {"world":76,"section-1":12,"section-2":0,"section-3":0,"section-4":36,"section-5":0,"section-6":0,"section-7":0,"section-8":6,"section-9":0}
CERTIFICATION 130 certified / 0 uncertified
```

All existing containment, finite bounds, pin rows, gate mouths, forward lanes,
turn scope, topological negative controls, determinism and stages-once assertions
pass for the **unchanged templates baseline**. No new certification count is claimed.

`pnpm check` exited 0 with both audit scripts present; it was also rerun after
retaining them as a diagnostic patch. [First successful check](pnpm-check-output.txt),
[final check](final-pnpm-check-output.txt): 70 files / 208 tests. No new `*.test.ts`.

## Binary DoD record

FAIL includes unimplemented or unverified deliverables; it never means an unrun
check secretly passed.

| DoD | Status | Evidence and limit |
| --- | --- | --- |
| 1. `pnpm check`, ≥208 tests, zero new tests | PASS | Exit 0; 70 files / 208 tests; no new tracked or untracked `*.test.ts`. |
| 2. Nested byte identity + trigger enumeration | PASS, baseline/proposed predicate only | Exact public serialization equals `f77907c`; unchanged structural verifier exits 0; 6/6/6/6, zero trigger matches. No compact runtime path exists. |
| 3. Part A occupancy + complete templates re-verification | FAIL | Four proposed leaf sizes fail. Actual final occupancy remains baseline. Baseline verifier is 130/0; no post-compaction geometry exists to certify. |
| 4. Part B generator, scene, invariants, ops, clone, loads | FAIL — not started | Ordering preserved after Part A STOP. No 40-node claim, no scale route or generator. |
| 5. Part C A/B, parameter OFF, defaults unchanged | FAIL — not started | No parameter or A/B evidence. Default scene serializations unchanged. No adoption. |
| 6. Required 1920×1440 screenshots on 5191 | FAIL — unverified | No rendered candidate exists; no browser/server launched; no stale images substituted. |
| 7. Selection + drag regressions | FAIL — unverified | Selection runner present but not rerun after STOP. No M5 drag runner located in this checkout; inherited M6 report also records its absence. Requested its path during work; no PASS inferred. |
| 8. README mechanism, design, ops, A/B, weaknesses | FAIL — feature documentation incomplete | STOP appendix added; rejected sizing mechanism and limitations recorded. No fabricated scale design, operations table, A/B recommendation, or 150-node conclusion. |
| 9. Branch, sliced A/B/C commits, clean status, log | FAIL — feature commits absent | Branch stays `feat/m7-scale`; only STOP evidence/documentation committed. Clean status and six-entry log printed at handoff. No fake A/B/C implementation commits. |

## Remaining uncertainty / next engineering work

This is a rejected sizing-policy investigation, not an implementation attempt
that reached rendered verification. The current layout computes lane demand
after reservation placement. A working solution still needs to use that demand
for final embedding without rerouting or rerunning stages; it must also achieve
tighter leaf occupancy than this full-reservation policy. The midpoint-mouth
collision and wide `core/validation` streets remain concrete design constraints.
No bounds toward 150 nodes / 300 wires were measured here. No visual benchmark
acceptance, operations/discovery count, or interaction-regression acceptance is
claimed for M7.
