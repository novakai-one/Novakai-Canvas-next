# M4 STOP — pin-row rule conflicts with the preservation exception

2026-09-17. Branch: `feat/fan-in-hub`; HEAD: `2f9b762`. **Milestone incomplete.**

The resumed brief requires every multi-wire node side to use distinct pins, with no shared terminals anywhere. It also requires the default scene to remain byte-identical to committed M3 evidence except for w12/w18 at node-12's exit-bottom. These requirements cannot both hold: five other default-scene sides share exact terminals. This is a contradiction in the acceptance gates, independent of the routing/projection implementation.

The law extension, semantic spec, placement and existing uncommitted source edits were left intact. No pin implementation or preservation-gate relaxation was attempted. Only this new STOP evidence and a README note were added. The earlier STOP report remains historical evidence.

## Reproduce and pasted output

`node output/playwright/nested-wires/verify-m4-pin-preservation.mjs` exits **1**:

```text
PASS default complete serialization remains byte-identical to M3 commit 2f9b762
PASS hub ok=true; nodes=24; wires=26; imports=w19–w24; exports=w25,w26
WITNESS node-1:exit-right: w01,w15 share {"x":632,"y":448}; exception=false
WITNESS node-5:exit-right: w04,w13 share {"x":1440,"y":552}; exception=false
WITNESS node-11:exit-right: w07,w14 share {"x":464,"y":1488}; exception=false
WITNESS node-18:entry-top: w10,w17 share {"x":1984,"y":1440}; exception=false
WITNESS node-16:exit-right: w11,w17 share {"x":1136,"y":1728}; exception=false
WITNESS node-12:exit-bottom: w12,w18 share {"x":704,"y":1536}; exception=true
FAIL ruling #2 versus DoD 3b: 5 shared sides outside the sole w12/w18 exception
STOP: byte-preserving those endpoints keeps shared pins; separating their pins violates the enumerated preservation exception.
```

The witness reads the immutable M3 scene using `git show`, compares the entire default serialization, and checks hub counts and wire identities through the public Layout contract. It does not derive the contradiction from the previous failed hub candidate.

For example, w01 and w15 both have source `(632,448)`. A centered two-pin row at pitch 6 requires coordinates 3 units either side of the legacy point along the node side. Neither source can remain at the legacy point. Since neither source is covered by DoD 3b's exception, even this single pair proves impossibility. The other four unexempted sides are independent witnesses.

## Required ruling

To retain the universal pin-row rule, extend the default preservation exception to terminal pin-row fans on **all six enumerated shared sides**, with exact computed pin assertions and preservation of the rest of the scene. The current instruction explicitly limits the exception to w12/w18, so this report does not assume that broader authorization.

## Binary DoD status

| Item | Status and evidence |
| --- | --- |
| 1 | **PASS** — `pnpm check` exits 0; 70 files / 208 tests. Zero added/modified `*.test.ts` paths in both tracked and untracked inventories. |
| 2 | **PASS** — public builder `ok=true`, 24 nodes, 26 wires, exact w19–w24 hub imports and w25/w26 api exports; pasted above. |
| 3 | **FAIL** — universal distinct terminals and enumerated default preservation cannot both pass. Existing complete default preservation still passes. Other geometry/oracle acceptance was not resumed after this STOP. |
| 4 | **FAIL — unverified** — M4 operation ceilings and stage counts not rerun after STOP. |
| 5 | **FAIL — unverified** — five browser loads and 48-node probe not run after STOP. |
| 6 | **FAIL — unverified** — M4 selection verification not run after STOP. |
| 7 | **FAIL — incomplete** — STOP recorded; complete accepted metrics and scaling answer unavailable. |
| 8 | **FAIL — unverified** — no new screenshots or visual acceptance; organised fan is not claimed. |
| 9 | **FAIL — incomplete** — canonical evidence remains M3; no invalid candidate promoted. |
| 10 | **FAIL — incomplete** — correct branch; pre-existing edits and new STOP evidence remain uncommitted. No completion commits or clean-status claim. |

No browser session was opened, attached or controlled. No push or PR. The existing port-5188 listener remains PID 13216.

## Pasted full-gate summary

`pnpm check` exits **0**. Full output: `m4-pin-ruling-checks.txt`.

```text
 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  11:16:02
   Duration  17.72s (tests 73%, import 14%, transform 10%, environment 2%)
```

Both test-file inventory commands return empty output:

```sh
git diff --name-only -- '*.test.ts'
git ls-files --others --exclude-standard -- '*.test.ts'
```

## Git log

```text
2f9b762 test(layout): run selection verification headless
5aeb348 docs(layout): publish M3 capacity metrics screenshots and verification evidence
b8223f1 test(layout): verify M3 lane geometry operations and selection topology
9b955b5 feat(layout): allocate directional wire lanes and size final corridors from demand
e84df66 docs(layout): preserve lane candidate and straight-junction STOP evidence
f81368e test(layout): correct M3 parallel-sharing topology expectation
```
