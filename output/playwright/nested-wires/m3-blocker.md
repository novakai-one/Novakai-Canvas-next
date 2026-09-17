> **Historical, resolved 2026-09-17:** the corrected brief requires w01/w15. All six corrected sharing prerequisites pass. Current STOP: [straight-through junction conflict](m3-junction-blocker.md). The text below records the previous attempt.

# M3 STOP — prescribed w02/w15 road sharing is absent

The 2026-09-17 gate-mouth ruling is accepted. It resolves the previous exact-point gate conflict. This STOP is a different, reproduced topology prerequisite failure in Part 1 / DoD 3c.

The six exact addendum pairs are now present in tracked `capability/layout/core/nested-wire-routing.ts`. No law, registry, placement, gate, lane or width implementation was changed. The branch was already `feat/wire-lanes` at the required base `2c8ca32` when this attempt began.

## Reproduction

```sh
node --import tsx output/playwright/nested-wires/verify-m3-topology.mjs
```

Expected current exit: **1**. Full actual output: [m3-topology-output.txt](m3-topology-output.txt).

The script imports the public layout contract and exercises tracked source directly. It does not use the previous `.local` bundle or inject substitute requests. All 18 wires route, all three required gate-sequence equalities pass, and five of the six required road-sharing comparisons pass. The failure is:

```text
FAIL DoD 3c: w02/w15 shared=[]; required>=1
w02: node-1:exit-bottom -> node-3:entry-top; corridors=["drive:node-1:exit-bottom","section-1:horizontal:648:368","drive:node-3:entry-top"]
w15: node-1:exit-right -> node-4:entry-left; corridors=["drive:node-1:exit-right","section-1:vertical:704:248","drive:node-4:entry-left"]
STOP: unchanged routing law fails required road sharing: w02/w15
```

## Why lane allocation cannot correct this

`nested-wire-law.ts:pair()` first selects bottom/top for w02 because nodes 1 and 3 share x=536. Those accesses own the horizontal road at y=648. For w15, the right/left shared-road rule selects the vertical road at x=704. `trunk()` uses each pair's already-shared road directly. Neither wire needs a highway or gate.

Per-road lane offsets change perpendicular positions within those assigned corridors; they do not change access ownership or insert a detour to another road. Assigning w02 to w15's vertical road would require changing the prescribed law/route, special-casing a wire, or mislabelling ownership. Those changes are prohibited. Widening cannot erase this topology distinction while preserving containment and non-overlap constraints.

Diagnostic only: **w01 and w15** actually share `drive:node-1:exit-right` and `section-1:vertical:704:248`. This suggests a possible wire-ID typo in the brief, but no substitution has been made. The orchestrator needs to correct the w15 sharing requirement or issue a new routing authorization before implementation can continue.

## Definition-of-done status at STOP

| Item | Status | Evidence / remaining work |
|---|---|---|
| 1 | PASS | `pnpm check` output in `m3-checks.txt`; no new test files. |
| 2 | PASS | 18 prescribed wires; all three gate equalities in topology output. |
| 3 | FAIL | 3c w02/w15 share zero corridors; 3g determinism passes. Lane allocation, assigned gate positions and the remaining lane checks have not been implemented. |
| 4 | NOT VERIFIED | Operation evidence not regenerated after STOP. |
| 5 | NOT VERIFIED | Five-load timing and 44-node growth not run after STOP. |
| 6 | NOT VERIFIED | Selection expectations remain at M2; acceptance not rerun. |
| 7 | NOT COMPLETE | This blocker is linked from README; capacity formula/scaling summary awaits implementation. |
| 8 | NOT VERIFIED | No M3 screenshots; no visual acceptance claimed. |
| 9 | NOT COMPLETE | Existing scene/oracle/calculation/metric artifacts remain historical M1.5 evidence. |
| 10 | PARTIAL | Correct branch; partial implementation and STOP evidence committed in separate reviewable slices. This is not a completed M3. |

The user’s explicit STOP instruction ends implementation at this prerequisite failure. No push, PR, server restart, law patch, replacement pair, or new test file was performed. Vite PID 13216 was observed listening on 127.0.0.1:5188 after the reproduction.

## Changed application-source review

Re-read `nested-wire-routing.ts` and its law/access/registry/record collaborators after adding the six requests. Scores in the sixteen standard-anchor order: **10, 6, 7, 10, 10, 10, 9, 10, 10, 10, 10, 10, 8, 10, 7, 10 = 147/160 >144**.

- SRP/OCP: the file owns request routing; six static pairs at lines 28–33 use existing generic execution. OCP remains 6 because request/pipeline axes require source edits.
- LSP/ISP/DIP: no substitutable implementation (LSP exactly 7); records and direct own-core collaborators only; no framework, adapter or ambient I/O dependency.
- DRY/KISS/YAGNI: request identities derive once from list order (lines 181–189); no per-wire branch or duplicated routing logic. Existing hierarchy/gate state costs one KISS point.
- Typed outcomes/retry/depth: nullable internal failures become the public discriminated `NestedWireResult` at lines 193–203; the entry documentation names caller-owned display/retry; no partial set is published.
- Demeter/immutability/type safety: readonly constructed records and direct collaborators; invocation-local `firstGate` selection mutation remains the two-point deduction; no new casts or `any`.
- Cognitive style/testability: existing conditional record expressions retain the three-point style deduction; the executable Sonar gate separately requires complexity ≤2. Inputs and measurement are injected; the public-contract preflight verifies exact requests and surfaces the failed topology requirement.

Worst three findings remain the fixed OCP axis, local gate-selection mutation, and conditional assembly style. The new `.mjs` file is a standalone terminal audit, following the existing source-review distinction for evidence scripts: Node owns assertion failures and reruns have no side effects. It is linted and intentionally exits nonzero on the reproduced blocker; it is not a placeholder passing test.
