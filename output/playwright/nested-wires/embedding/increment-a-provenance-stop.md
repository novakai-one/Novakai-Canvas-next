# Increment A — STOP: pre-existing ordinary-builder baseline mismatch

**Increment A is not complete. No support-ledger operation was implemented.** The initial ordinary-builder byte gate fails before any product edit: the preserved, rejected M10f-2 projection candidate changes the authoring scene relative to `b9e098a`. This is a baseline failure, not a finding of binding default/hub constraints or an admission result for the proposed constraint graph.

## Ratification-relevant status

| Required evidence | Status at STOP |
| --- | --- |
| Full authoring constraint-graph admission | Not implemented or established |
| Complete default/hub support slack | Not established; matching scene bytes do not establish support slack |
| Templates/scale spill populations 13/7 | Prior design evidence only; not a completed ledger verification |
| Calibrated preflight operations and T/C/G/V/E | Not measured; no preflight exists |
| Ordinary builder equals `b9e098a`, twice per scene | **Fails for authoring**; both builds of each version are deterministic |
| Product changes / geometry changes in this attempt | None |
| Commit / push / PR | Withheld under STOP; evidence remains local |

The ratification amendment authorizes A only. B/C/D were not started. No server, browser, or protected port was used.

## Why execution stopped

The Increment A brief at `/Users/christopherdasca/Documents/Codex/2026-09-16/fi/orchestration/m10f3-increment-a.md` requires:

> All five ordinary builder serializations byte-equal to b9e098a, twice per scene.

Its allowance and STOP clause are:

> Mechanical self-introduced lint/typecheck/complexity/formatting: fix and continue. Everything else STOPs

The initial worktree was on `feat/m10f3-embedding`, HEAD `a5f013033edc09bfa19028e77581a1fd5d215757`, with these pre-existing changes:

- `capability/layout/core/nested-lane-projection.ts`: one-line rejected M10f-2 clamp candidate.
- `output/playwright/nested-wires/ownership/verify.mjs`: extended M10f-2 verifier.
- Untracked `output/playwright/nested-wires/projection/` evidence.

The ratified design's introduction explicitly records and preserves these changes and excludes the candidate from its model. They were left untouched here. However, the current ordinary public builder still executes that candidate. Using only a pinned builder for acceptance would conceal the current builder's failing bytes. Removing or setting aside the pre-existing product edit would be a separate workspace-state action, outside the brief's mechanical self-correction allowance. Execution therefore stopped for a ruling on that action.

The committed Layout source at HEAD has no diff from `b9e098a`. The issue is the local product delta, not the ratified design commit.

## Measured baseline gate

The diagnostic bundled the public Layout exports from Git object `b9e098aab6bb66c3359211efecd721023c59f06f` entirely in memory using the installed esbuild dependency. Every first-party TypeScript module in that bundle was read with `git show`. It separately imported the current worktree's public `capability/layout/contract/index.ts`. Both builders used the same semantic specs, each scene was built twice per version, and full `JSON.stringify` serializations were compared. No source was temporarily replaced. The diagnostic exited **1** on the mismatch.

Full SHA-256 values, byte lengths, public inspection counts and changed wire identities are in [increment-a-baseline-gate.json](increment-a-baseline-gate.json).

| Scene | Baseline bytes | Current bytes | Byte equal | Twice deterministic, both versions |
| --- | ---: | ---: | --- | --- |
| default | 649,257 | 649,257 | Yes | Yes |
| hub | 713,191 | 713,191 | Yes | Yes |
| templates | 764,731 | 764,731 | Yes | Yes |
| scale | 1,462,875 | 1,462,875 | Yes | Yes |
| authoring | 1,953,839 | 1,954,029 | **No** | Yes |

Only authoring wires `w03` and `w23` differ. Public inspection changes corridors **2→0** and node-body violations **40→41**; boundaries remain **87**, continuity **0**. This agrees with the prior rejected-candidate report at `../projection/stop-report.md`.

The complete 40/87/1,273/18/28/96 catalog was not re-certified in this attempt. The prior M10f-2 report records the rejected candidate's 41/87/1,282/7/28/96 counts and changed operation totals. Those are historical evidence, not fresh measurements here. Neither version is claimed legal; routing success is not legality.

To reproduce the current-tree mismatch against the measured committed baseline receipt, from this worktree:

```sh
node --import tsx --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createNestedRoadScene } from './capability/layout/contract/index.ts';
const root = 'output/playwright/nested-wires/';
const spec = JSON.parse(readFileSync(root + 'authoring-scene/scene-spec.json', 'utf8'));
const receipt = JSON.parse(readFileSync(root + 'embedding/increment-a-baseline-gate.json', 'utf8'));
const serialized = JSON.stringify(createNestedRoadScene({ spec }));
assert.equal(serialized, JSON.stringify(createNestedRoadScene({ spec })));
const hash = createHash('sha256').update(serialized).digest('hex');
assert.equal(hash, receipt.scenes.authoring.baselineSha256, 'ordinary builder must equal b9e098a');
JS
```

This assertion is expected to fail while the rejected projection candidate remains active. It does not overwrite prior evidence.

## Remaining authorization decision

`pnpm check` exited **0**, with **70/70 test files and 208/208 tests** passing; the full output is [increment-a-pnpm-check.txt](increment-a-pnpm-check.txt). Repository health does not override the failed byte gate. No product file was added or changed in this attempt, so no new product source score is claimed.

Resume only after a ruling on preserving the rejected candidate as evidence and restoring the committed projection source for the ordinary builder. This report does not authorize that action, waive any binary gate, or claim Increment A passed. Every unperformed ledger, negative-control, admission, operation and source-review obligation remains outstanding.
