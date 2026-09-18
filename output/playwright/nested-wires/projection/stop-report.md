# M10f-2 STOP — restored dogleg changes protected catalogs

Branch `feat/m10f2-projection` was created from **b9e098a** in the prescribed worktree. The first clamp-only candidate is **rejected**, not a completed projection fix. No commit, push or PR was made: delivery was conditional on green. The one-line candidate and extended verifier remain uncommitted for inspection; `rejected-candidate.patch` preserves the exact product delta.

## Why implementation stopped

The brief's literal STOP clause is:

> Anything beyond mechanical self-correction: STOP with evidence. Never tune the fixture, never weaken a gate, never claim legality. If fixing the clamp requires moving nodes or changing demand/capacity (spike step 3 territory), STOP and report — that boundary is M10f-3's.

Its allowance is:

> Self-correction allowance for mechanical fallout; judgment calls STOP.

Its retained-scene requirement is:

> default / templates / scale (+ hub control) scenes BYTE-IDENTICAL after the change. If any retained scene's bytes move, STOP — that means the fix is not defect-scoped.

The retained byte gate **passed**. The STOP here is a different gate: a geometrically correct restoration of the far dogleg column changes the explicitly protected body/contact counts and exposes a true shared segment. Repairing that requires choosing different geometry or changing the acceptance requirement; it is not a syntax, formatting or harness correction. No alternate geometric policy was tried after observing this failure. This evidence **does not prove that every possible projection-only repair is infeasible**, or that changing capacity is necessarily required.

## Candidate and exact results

`nested-lane-projection.ts:334` changes the clamp from moving every via point to moving only points on `c.from`'s original column. Thus both median doglegs keep their distinct destination columns. No fixture, lane assignment, road, node, capacity, junction or pin data changes. The only changed wires are **w03 and w23**. Source/target fan repair and the other reversed segments were not implemented after the STOP.

| Gate | Baseline → candidate | Required | Verdict |
| --- | ---: | ---: | --- |
| Diagonal segments | 2 → 0 | 0 | Pass |
| Corridors | 2 → 0 | 0 | Pass |
| Reversed assigned segments | 28 → 28 | 0 | Incomplete |
| Overlap witnesses | 18 → 7 | 4, O3 only | Fail |
| Node-body witnesses | 40 → 41 | 40 unchanged | **STOP** |
| Boundary witnesses | 87 → 87 | 87 unchanged | Pass, exact catalog |
| Uncertified contacts | 1,273 → 1,282 | 1,273 unchanged | **STOP** |
| Missing owned gates | 96 → 96 | 96 unchanged | Pass, exact catalog |
| Continuity violations | 0 → 0 | 0 | Pass |
| Retained scenes | default, hub, templates, scale identical | byte-identical | Pass |
| Double rebuild | all five identical within each revision | byte-identical | Pass |

`ownership/verify.mjs` was extended in place with `projection-before` / `projection-after` modes, retaining its old ownership gates. The new mode prints the exact counts and writes catalogs before asserting the unchanged targets. Baseline mode passed; candidate mode exited **1**. `clamp-only-log.txt` contains the original assertion failure; `final-verifier-log.txt` confirms identical rejected counts after the mechanical audit cleanup (exit 1). A public-builder red reproduction also reported precisely `w03:5` and `w23:5` as diagonals before editing.

Catalog transitions (`catalog-transitions.json`, complete before/after catalogs):

- All twelve old diagonal-bounding-box O1 records disappear. **One real overlap appears:** w03's horizontal median segment `(3089.5,454)→(3247,454)` shares `(3190,454)→(3196,454)` with w13's terminal segment, length **6**.
- Both O2 terminal-sharing records remain byte-identical. All four O3 records remain byte-identical. Hence **1 + 2 + 4 = 7**, not 4.
- w03's old diagonal becomes a horizontal segment plus a vertical segment at x=3247. Both enter node-3's interior; the subsequent backwards connector also remains inside it. The body catalog changes from two w03 witnesses to three (`w03:5/6/7`); the other 38 records are unchanged.
- The uncovered-contact catalog removes **1** record and adds **10**, net **+9**. Proof still aborts at `J17/J145 proof regions overlap`; lower bound remains 0. Nothing was certified or declared legal.

The terminal traces also caution against a simple endpoint clamp: for example w36 arrives on vertical lane x=6301 while its target pin is x=6280 and its target fan starts at x=6250. w37 turns from a horizontal lane at y=1561 to a target fan starting at y=1534. Moving those joins blindly would leave their incoming assigned lanes. These are observations, not a proof of a sufficient repair or a justification to relabel reversed travel.

## Operation receipts

The unchanged retained AST meter ran before and after on all five scenes; instrumented output equals the ordinary builder in every run. All stages execute once; discovery stays **0**. Numbers count the meter's executed arithmetic/comparisons, not elapsed time. Native collection internals and multiplication/division remain excluded.

| Scene | Routing, unchanged | Compile before → candidate | Delta | Doubled total growth |
| --- | ---: | ---: | ---: | ---: |
| default | 667 | 33,313 → 33,313 | 0 | 2.014184 |
| hub | 992 | 48,070 → 48,071 | +1 | 2.024316 |
| templates | 1,626 | 74,724 → 74,729 | +5 | 2.038127 |
| scale | 2,088 | 104,617 → 104,625 | +8 | 2.024234 |
| authoring | 6,140 | 280,075 → 280,149 | +74 | 2.038582 |

All growth ratios pass **≤2.5**. The additional work is confined to lane projection: numeric column comparisons and the two restored emitted pieces. These are measurements of the rejected clamp-only candidate, not of an implemented terminal repair.

## Headless visual review

Vite ran only on **5198**. A temporary harness used the public scene builder and actual React/React Flow prototype renderer in headless Chromium. Before/after regional PNGs cover C1 w03, C1 w23 and the O2 terminals. Candidate section navigation captures cover Sections 2, 6 and 14. No approved reference image was modified.

Personally inspected the w03 before/after detail and candidate Section 2 against the approved AWS architecture reference and read the required visual SOP/reference/benchmark documents. The barely sloped w03 line becomes a visible rectangular out-and-back excursion into the destination box. Nested groups and alignment remain, but dense bundles and body penetrations remain obvious. This is not a visual-quality improvement claim: the scene fails the broader benchmark's overlap/crossing requirements.

The coordinate-cropped PNGs set only the viewport DOM transform to the same world region. They retain the prototype's overview semantic visibility, so node text is hidden in those crops; they are wire-shape evidence, not reading-zoom typography acceptance or export certification. The prior documented Node/Chromium ordering divergence is not repaired; numerical gates use Node, and both visual sides use Chromium. Three section captures that could have overlapped hot reload were discarded rather than used as baseline evidence. Temporary browser harness files were removed after capture. The dedicated headless browser session was closed; the requested Vite server remains running on 5198 for review. No protected port was accessed.

## NOT fixed / delivery status

Reversed travel **28**, terminal backtrack sharing **2**, O3 overlaps **4**, body violations **41 in the rejected candidate**, boundary violations **87**, uncertified contacts **1,282 in the rejected candidate**, missing gates **96**, and the existing proof abort remain. No node movement, demand/capacity change, gate weakening, fixture tuning or ownership relabeling was attempted.

The product source review is in `source-review.md`. Final `pnpm check` exited **0**, **70/70 files and 208/208 tests**, with typecheck, lint, formatting and architecture passing (`pnpm-check.txt`). This cannot override the failed mission verifier. The requested green commit/push/PR is intentionally withheld under the STOP clause.

Reproduce from this worktree, retaining the recorded baseline:

```sh
node --import tsx output/playwright/nested-wires/ownership/verify.mjs projection-after
pnpm check
```

Do not run `projection-before` on the candidate: its expected 2/28/18 baseline counts correctly fail, and it would overwrite local baseline snapshots. Baseline provenance is b9e098a, with hashes in `before.json` and `stop-evidence.json`.

Mechanical allowance record: two `pnpm check` attempts rejected the extended verifier for Sonar complexity. Fixed only audit-script branching: identical before/after expectations became a phase-keyed data table, and verifier selection moved to a top-level binding. No assertion or target changed. Receipts: `mechanical-check-fallout.txt` and `mechanical-check-fallout-2.txt`.
