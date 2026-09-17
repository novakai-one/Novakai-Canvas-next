# M3 resume — STOP on Part 2.6's junction exception

The user-corrected w01/w15 expectation is implemented in the topology verifier. Sharing now excludes segments transverse to their assigned road: junction crossings are not counted as parallel travel. All six sharing requirements and all 18 prescribed routes pass. This report does not reopen either previous blocker.

## Reproduced conflict

The brief says:

> No two wire centrelines may coincide, overlap, or cross inside any road. (Crossings at road junctions where wires genuinely turn are fine; parallel wires must never touch.)

It also prohibits changing the law. `nested-wire-law.ts` is byte-identical to accepted M2 commit `2c8ca32`.

- w05 is node-6 → node-9. Their centres share x=1680. The band rule chooses bottom/top; both accesses meet the same horizontal road at y=672. The law traverses that road vertically without a turn there.
- w06 is node-8 → node-10. Its unchanged detour uses the horizontal road `section-2:horizontal:672:1176`, between the vertical roads x=1512 and x=1848. It traverses w05's junction horizontally without turning there.
- The two paths consequently cross in that junction. The candidate's right-hand offsets place the crossing at **(1677,675)**. Both wires have **zero turns** in junction J74, bounds **x=1668,y=660,width=24,height=24**.
- This is inherited topology, not a new lane-allocation choice: the accepted M2 fixture crosses at **(1680,670.5)**; current 18-wire source crosses at **(1680,661.5)**. Both likewise have zero turns in J71.

Per-road offsets can move a north–south traversal and a west–east traversal inside this junction, but cannot make them disjoint. The one-lane source and target driveways of w05 have equal direction-aware offsets, so there is no lane transition requiring a turn at this junction. The law's nearest-highway choice for w06 is unchanged. Selecting another detour, inserting a turn solely to gain an exception, or silently permitting straight-through crossings would alter the brief's requirements. None was done.

A ruling allowing straight-through crossings at registered junctions, or explicit authorization to change this routing behaviour, is needed to proceed. This is a specification conflict under the exact “genuinely turn” wording, not a claim that general road routing cannot support this topology.

## Reproduce

```sh
node --import tsx output/playwright/nested-wires/verify-m3-topology.mjs
# exits 0: corrected topology prerequisites
node --import tsx output/playwright/nested-wires/verify-m3-junction-blocker.mjs
# exits 1: actual straight-through crossings violate Part 2.6
pnpm check
# exits 0: retained application source and committed evidence tools
```

Full pasted output is in [m3-topology-output.txt](m3-topology-output.txt), [m3-junction-output.txt](m3-junction-output.txt), and [m3-resume-checks.txt](m3-resume-checks.txt). The blocker verifier reads the public builder, the accepted M2 Git fixture, and the separately saved candidate; its failure is intentional evidence, not a passing test standing in for implementation.

## Candidate retained for continuation, not installed

The lane work is saved as [m3-lane-candidate.patch](m3-lane-candidate.patch); its generated scene is [m3-candidate-scene.json](m3-candidate-scene.json). Application sources were restored to the two accepted commits after STOP. No user changes existed when work began.

The candidate retains the original law, plans its assignments once at zero global offset, allocates right-hand lanes by wire ID, sizes streets and all driveways with **f(n)=12+12n**, and projects the retained assignments. Lane pitch is **6**; direction-side lane centres are **±(index+0.5)×6**. Gate mouths use assigned lane positions; shared node terminals fan into separate lanes. Final contact ownership is inherited from the construction registry, without per-wire road-pair discovery. These design choices are not claimed as accepted DoD evidence.

[Candidate verification](m3-candidate-verification.txt) passed distinct lanes, gate-mouth positions, right-hand ordering, width equations, all corrected shared-corridor requirements and byte determinism. The independent inspector found no wire containment, node-body, continuity or gate-lane errors. It failed the stricter crossing check at w05/w06.

The candidate also has a separate **fixable geometry defect**, which remains uncorrected after STOP: an empty street's retained 24-unit end cap overlaps the widened section-1 gate driveway (`world:vertical:1344:1184` / `drive:section-1:exit-bottom`). Final street caps need to consume neighboring final widths. Its verification script also needs two cognitive-complexity refactors. The patch is a resumable work product, **not a green or complete implementation**; the successful `pnpm check` applies to retained source, not this patch.

## Every DoD item at STOP

| DoD | Status | Evidence |
|---|---|---|
| 1 | PASS for retained source | `pnpm check` exits 0; 208 tests; zero new `*.test.ts` files. Candidate not installed or certified. |
| 2 | PASS | `ok=true`, 18 exact wires; w10/w16, w11/w17, w12/w18 gate lists equal. Full output in `m3-topology-output.txt`. |
| 3 | FAIL / incomplete | Corrected 3c and determinism pass. Part 2.6 straight-through crossing prevents lane acceptance; candidate also has the recorded cap defect. No final `verify-lanes.mjs` installed. |
| 4 | NOT VERIFIED | Candidate instrumentation was exploratory. Committed operation evidence has not been regenerated or certified for M3. |
| 5 | NOT VERIFIED | No M3 five-load timing or accepted 44-node total-op measurement; M2 reference remains 243.7 ms, M3 ceiling 280 ms. |
| 6 | NOT VERIFIED | Candidate includes the requested selection-expectation updates, but browser verification was not run before STOP. |
| 7 | INCOMPLETE | README reports STOP and candidate formula. No accepted M3 metrics or 100-node/200-wire cost claim. |
| 8 | NOT VERIFIED | No M3 screenshots or visual-completion claim. |
| 9 | INCOMPLETE | Canonical artifacts remain historical M1.5. The separate candidate scene contains 18 wires and is clearly named. |
| 10 | PASS for STOP delivery, not M3 completion | Branch `feat/wire-lanes`; original commits preserved; corrected verifier and STOP evidence committed separately; clean status. Final log/status is pasted in the end report. |

## Boundaries preserved

No production source remains changed by this resumed attempt. No routing-law patch, special-case wire, pair substitution, search, new test file, push or PR. Vite PID **13216** remains listening on **127.0.0.1:5188**; it was not restarted or killed. No subagents were used.
