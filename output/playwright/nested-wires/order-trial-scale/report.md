# Scale-scene ordering trial — STOP at step 5

Date: 2026-09-18. Worktree: `/Users/christopherdasca/Programming/Novakai-Canvas-next-ordertrial`. Branch: `feat/order-trial`.

## Binary outcome

**STOP; experiment not completed.** Amendment 1 fixed the seed loss, but the regenerated variant fails the existing scale invariant verifier (exit **1**). Baseline verifier exits **0**. No better/worse/mixed verdict is supported for an invalid variant.

The brief requires: **“If any gate fails, any expected file/tool is missing, or the specs differ in a way this brief did not anticipate: STOP.”** No assertion was weakened and no routing or application source was changed. The verifier itself collects multiple failures before exiting; no downstream trial step was run after that exit.

## Failure evidence

Full logs: [baseline/invariant-output.txt](baseline/invariant-output.txt), [variant-a/invariant-output.txt](variant-a/invariant-output.txt). Machine summary: [stop-evidence.json](stop-evidence.json). Detailed geometry witnesses: [variant-a/invariant-audit.json](variant-a/invariant-audit.json); certification witnesses: [variant-a/crossing-certificates.json](variant-a/crossing-certificates.json).

The variant reports:

```text
INSPECTION {"corridors":[],"nodeBodies":[],"boundaries":["w16:19","w17:20","w18:21","w19:21"],"continuity":[]}
FAIL all wires inside corridors; gate-mouth crossings only; no body or continuity failures
FAIL actual crossing count equals additive endpoint and linked-order lower bound: 101 !== 85
CERTIFICATION 85 certified / 16 uncertified
FAIL zero uncertified crossings: 16 !== 0
FAIL every gate traversal crosses its own mouth at its assigned distinct offset: w19 missing owned gate crossing
```

Baseline passes the complete suite: 112 certified / 0 uncertified crossings, no boundary/continuity/corridor/node-body violations, zero positive-length overlaps. Variant also has zero positive-length overlaps, but that does not excuse its failed gates.

## Amendment 1 and completed gates

- Canonical versus worktree scale spec: **byte-identical, diff exit 0**. SHA-256: `1b619c567767f279409e05abacc97a178938fbef8c8584d833362385623ad251`.
- URL returned HTTP **200**; port 5192 listener PID 73285 has cwd in this worktree's `apps/web`.
- Previous `baseline/` was discarded and regenerated from the canonical-identical worktree spec.
- [set-node-order.mts](set-node-order.mts) is the Track C replica with exactly one behavioral change: `{ ...spec, sections: <reordered sections> }`. The original Track C file was not modified.
- Rebuilt baseline versus canonical: **byte-identical**, exceeding the formatting-only allowance. No top-level key added/removed; keys are `seed`, `sections`, `requests`; `seed === 7007`. See [baseline/spec-preservation.json](baseline/spec-preservation.json) and [baseline/spec-diff.txt](baseline/spec-diff.txt).
- Variant versus baseline: **only recursive `sections[].nodes` array order differs**; seed and all other data preserved. Comparison recursively sorted node arrays by node number and asserted full-spec equality.
- Real builder double-build determinism: **TRUE for both**; compact scene bytes baseline **1,462,875**, variant **1,459,331**. See each directory's `replica-output.txt`.
- Scale verifier exists at `../scale-scene/verify-scale-scene.mjs`. Local [verify-scale-scene.mjs](verify-scale-scene.mjs) adapts only input/output paths through a run-directory argument. All semantic assertions, including seed 7007, are unchanged. It invokes the original `../templates-scene/verify-templates-scene.mjs` with 40 nodes / 12 sections / 75 wires and the exact supplied spec shape. This retains the original scale verifier's `expectedShape` behavior and declares the reordered variant explicitly.

## Wiring and degree invariance

**Requests byte-identical: TRUE. Wires byte-identical: TRUE (optional metadata absent in both). Per-node degree identical for all 40 nodes: TRUE.**

The canonical scale spec has no optional top-level `wires` key. Both generated specs preserve that absence; no key was invented. The 75 ordered directed connections live in `requests`, whose values and sequence are identical. Wire geometry in rebuilt `scene.json` may differ with placement; no geometry byte-identity claim is made.

Machine evidence: [invariance-proof.json](invariance-proof.json). For each field, proof compared UTF-8 bytes of compact JSON `{ "present": <key exists>, "value": <field or null> }`, making absence explicit. SHA-256 of identical request proof bytes: `74e4657c34c218ecf106e22e24648a727589112a4dbbaf756ba0388cba485e97`; optional wires proof bytes: `f35a0cf0ef896a2236d8419cac8a2d85bfb33d12859af555f9cf7825dc785109`.

Degree is in-degree + out-degree, counting request multiplicity, independently computed from each spec's requests.

| Node number | Label | Baseline degree | Variant degree |
| --- | --- | ---: | ---: |
| 1 | kernel.ts | 12 | 12 |
| 2 | brands.ts | 5 | 5 |
| 3 | errors.ts | 5 | 5 |
| 4 | types.ts | 5 | 5 |
| 5 | api.ts | 6 | 6 |
| 6 | index.ts | 13 | 13 |
| 7 | store-port.ts | 4 | 4 |
| 8 | clock-port.ts | 2 | 2 |
| 9 | request.ts | 3 | 3 |
| 10 | receipt.ts | 3 | 3 |
| 11 | admit.ts | 4 | 4 |
| 12 | normalize.ts | 3 | 3 |
| 13 | authorize.ts | 3 | 3 |
| 14 | plan.ts | 5 | 5 |
| 15 | discover.ts | 5 | 5 |
| 16 | catalog.ts | 3 | 3 |
| 17 | match.ts | 3 | 3 |
| 18 | select.ts | 5 | 5 |
| 19 | expand.ts | 5 | 5 |
| 20 | instantiate.ts | 3 | 3 |
| 21 | bind.ts | 3 | 3 |
| 22 | assemble.ts | 5 | 5 |
| 23 | validate.ts | 3 | 3 |
| 24 | diagnose.ts | 2 | 2 |
| 25 | check.ts | 2 | 2 |
| 26 | result.ts | 3 | 3 |
| 27 | memory-store.ts | 4 | 4 |
| 28 | disk-store.ts | 2 | 2 |
| 29 | system-clock.ts | 3 | 3 |
| 30 | registry.ts | 3 | 3 |
| 31 | resource.ts | 3 | 3 |
| 32 | transaction.ts | 2 | 2 |
| 33 | endpoint.ts | 2 | 2 |
| 34 | server.ts | 2 | 2 |
| 35 | client.ts | 3 | 3 |
| 36 | presenter.ts | 2 | 2 |
| 37 | shell.ts | 2 | 2 |
| 38 | parse.ts | 3 | 3 |
| 39 | execute.ts | 2 | 2 |
| 40 | main.ts | 2 | 2 |

## Derived per-section order

Used the unchanged `../order-trial/derive-variant-a-order.mts`, parameterized with the regenerated baseline path. Hub is `index.ts` when present, otherwise maximum total degree with lowest-number tie break; remaining nodes use greedy request multiplicity to placed nodes, ties by node number. Exact map: [variant-a-order.json](variant-a-order.json); printed output: [variant-a-order-output.txt](variant-a-order-output.txt).

| Section | Baseline node order | Variant node order |
| --- | --- | --- |
| section-1 | 1:kernel.ts, 2:brands.ts, 3:errors.ts, 4:types.ts, 5:api.ts, 6:index.ts | 6:index.ts, 1:kernel.ts, 2:brands.ts, 3:errors.ts, 4:types.ts, 5:api.ts |
| section-2 | 7:store-port.ts, 8:clock-port.ts | 7:store-port.ts, 8:clock-port.ts |
| section-3 | 9:request.ts, 10:receipt.ts | 9:request.ts, 10:receipt.ts |
| section-4 |  |  |
| section-5 | 11:admit.ts, 12:normalize.ts, 13:authorize.ts, 14:plan.ts | 14:plan.ts, 11:admit.ts, 12:normalize.ts, 13:authorize.ts |
| section-6 | 15:discover.ts, 16:catalog.ts, 17:match.ts, 18:select.ts | 15:discover.ts, 16:catalog.ts, 17:match.ts, 18:select.ts |
| section-7 | 19:expand.ts, 20:instantiate.ts, 21:bind.ts, 22:assemble.ts | 19:expand.ts, 20:instantiate.ts, 21:bind.ts, 22:assemble.ts |
| section-8 | 23:validate.ts, 24:diagnose.ts, 25:check.ts, 26:result.ts | 23:validate.ts, 24:diagnose.ts, 25:check.ts, 26:result.ts |
| section-9 | 27:memory-store.ts, 28:disk-store.ts, 29:system-clock.ts, 30:registry.ts | 27:memory-store.ts, 28:disk-store.ts, 29:system-clock.ts, 30:registry.ts |
| section-10 | 31:resource.ts, 32:transaction.ts, 33:endpoint.ts, 34:server.ts | 31:resource.ts, 32:transaction.ts, 33:endpoint.ts, 34:server.ts |
| section-11 | 35:client.ts, 36:presenter.ts, 37:shell.ts | 35:client.ts, 36:presenter.ts, 37:shell.ts |
| section-12 | 38:parse.ts, 39:execute.ts, 40:main.ts | 38:parse.ts, 39:execute.ts, 40:main.ts |

## Reproduction

From this worktree root, the verifier invocations were:

```sh
node --import tsx output/playwright/nested-wires/order-trial-scale/verify-scale-scene.mjs baseline
node --import tsx output/playwright/nested-wires/order-trial-scale/verify-scale-scene.mjs variant-a
```

Exit codes were 0 and 1 respectively. Replica invocation is the original CLI with the local seed-preserving copy, `--spec baseline/scene-spec.json`, `--order empty-order.json` or `variant-a-order.json`, and the corresponding `--out` directory (all paths beneath this trial directory). Baseline was recopied before its empty-order rebuild.

## Unperformed deliverables

Per the immediate STOP clause, steps 6–12 were not executed: no metrics tables, coverage audit, screenshots/browser capture, rendered placement proof, commit, push, or `pnpm check`. No browser was launched. No completion claim is made from determinism or partial passing assertions. All writes remain inside `order-trial-scale/`; the previous seed-loss stop evidence has been replaced with the current failure evidence.

## DIVERGENCES FROM THIS BRIEF

- None. Execution stopped at the failed step-5 invariant gate as required; outstanding deliverables are listed above.
