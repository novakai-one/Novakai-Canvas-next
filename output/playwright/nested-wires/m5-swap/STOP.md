# M5 — STOP: unchanged full recompute exceeds compile ceiling

M5 is **not complete**. Started from `88c65fe` on `feat/drag-swap`.

The required semantic swap of node-4 and node-1 compiles at **20,107 numeric operations**, exceeding DoD 6's **20,000** ceiling by **107 (0.535%)**. The unchanged default scene costs 19,683. Both measurements use the retained TypeScript AST meter, with instrumented output byte-compared to the public builder. No production source, routing law, allocation, projection, pin, gate or topology implementation was changed.

The brief says “Only placement order + the interaction handler change,” forbids incremental-recompute machinery, and requires a STOP if a DoD cannot be made true. An interaction handler cannot lower this measured full-build cost. Proceeding requires an orchestrator ruling permitting a pipeline optimization that preserves geometry, or revising the compile ceiling. No threshold has been relaxed: the failing assertion remains `compiledTotal() <= 20000`. The new `--spec` input uses M5's explicitly allowed routing ceiling of 1,050; default invocations retain 1,000.

## Reproduction

```sh
node --import tsx output/playwright/nested-wires/verify-m5-preflight.mjs
# Expected exit 1 at the retained compile ceiling.
node --import tsx output/playwright/nested-wires/count-operations.mjs \
  --output .local/m5-preflight/default-calculations.json
# Default scene: exit 0. Alternate output preserves canonical M4.5 evidence.
pnpm check
```

`verify-m5-preflight.mjs` swaps only the first section's semantic node array, asserts the original order, builds the full scene, verifies node bounds and builder round-trip, then invokes the operation meter. It does not simulate a drag or claim UI acceptance. `swapped-spec.json`, `preflight-scene.json` and `calculations.json` retain its exact inputs and results.

| Compilation stage | Default | Required swap | Delta |
| --- | ---: | ---: | ---: |
| Wire registry | 928 | 928 | 0 |
| Lane allocation | 3,790 | 4,067 | +277 |
| Network | 11,021 | 11,020 | -1 |
| Lane projection | 3,944 | 4,092 | +148 |
| Total | 19,683 | **20,107** | +424 |

Routing passes at 1,025/1,050; maximum law leg is 44/60. Discovery is zero. Every recorded pipeline stage executes exactly once. Both normal and instrumented scenes are byte-identical. These successful parts do not cancel the compile failure.

## Binary DoD status

FAIL means unmet, including work deliberately not performed after the STOP.

| DoD | Status | Evidence / limitation |
| --- | --- | --- |
| 1 | PASS | `pnpm check` exits 0; 70 files / 208 tests; zero new `.test.ts` files. Full output in `pnpm-check.txt`. |
| 2 | FAIL | UI handler and headless drag runner not implemented after preflight STOP. Builder-only bounds, 26-wire admission, deterministic rebuild and round-trip passed; no UI/recalc/selection claim. |
| 3 | FAIL | Official swapped-scene invariant runners and bound prover not completed. Builder containment audit passed. An exploratory local bound run found 30 certified / 0 uncertified crossings, but retains default-only provenance/ceiling assumptions and is **not** formal M5 acceptance. |
| 4 | FAIL | Dirty-set report not produced after STOP. Swapped node coordinates are pasted below. |
| 5 | FAIL | No browser drag measurements; no median claimed. |
| 6 | **FAIL** | Compile **20,107 > 20,000**. Routing 1,025 <= 1,050; discovery 0; every stage once. |
| 7 | FAIL | Screenshots not produced after STOP; no visual acceptance claimed. |
| 8 | FAIL | Selection runners not re-run after STOP. Production renderer remains unchanged. |
| 9 | FAIL | README has a STOP entry; interaction/scaling timing is unmeasured, so no 150-node/300-wire or 100ms cutoff claim. |
| 10 | FAIL | Correct local branch and sliced evidence commits; clean working tree not claimed because two inherited selection-evidence changes are preserved. Local log pasted in the final response. |

No browser was opened or attached, headless or otherwise. No push, PR, server start, stop or kill. Existing Vite answered HTTP 200 on port 5188. No new test files. The initial local modifications to `m4-selection-output.txt` and `m4-selection.json` are preserved and excluded from these commits.

## Pasted failing output (exit 1)

```text
PASS builder-only preflight: semantic order [4,2,3,1,23,24]; exactly two nodes exchange bounds; other 22 unchanged
PASS builder-only preflight: all 26 wires route; corridors/nodeBodies/boundaries/continuity empty; deterministic build and exact round-trip
NOTE no UI drag, selection, render timing or screenshot claim; preflight precedes interaction implementation
MEASURE node-1 {"x":272,"y":400,"width":192,"height":96} -> {"x":272,"y":800,"width":192,"height":96}
MEASURE node-4 {"x":272,"y":800,"width":192,"height":96} -> {"x":272,"y":400,"width":192,"height":96}
MEASURE routing=1025; compile=20107; total=26564,44577; maxLeg=44; stages={"capacity":1,"nodes":1,"ports":1,"topology":1,"wire-registry":1,"wire:w01":1,"wire:w02":1,"wire:w03":1,"wire:w04":1,"wire:w05":1,"wire:w06":1,"wire:w07":1,"wire:w08":1,"wire:w09":1,"wire:w10":1,"wire:w11":1,"wire:w12":1,"wire:w13":1,"wire:w14":1,"wire:w15":1,"wire:w16":1,"wire:w17":1,"wire:w18":1,"wire:w19":1,"wire:w20":1,"wire:w21":1,"wire:w22":1,"wire:w23":1,"wire:w24":1,"wire:w25":1,"wire:w26":1,"lane-allocation":1,"main-roads":1,"driveways":1,"network":1,"lane-projection":1}
node:internal/modules/run_main:107
    triggerUncaughtException(
    ^

AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

  assert(compiledTotal() <= 20000)

    at <anonymous> (/Users/christopherdasca/Programming/Novakai-Canvas-next-roads/output/playwright/nested-wires/count-operations.mjs:292:1) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: false,
  expected: true,
  operator: '==',
  diff: 'simple'
}

Node.js v24.13.0
```

## Default-scene control (exit 0)

```text
PASS w26: 53 routing ops; executed legs 11,11,11
PASS routing total=992 <=1000; maximum law leg=41 <=60
PASS lane allocation + registry compilation=19683 <=20000; components={"wire-registry":928,"lane-allocation":3790,"network":11021,"lane-projection":3944}
PASS per-wire road-pair discovery checks=0
PASS 24/48 nodes: total ops=26107/44120; growth=1.6899682077603708 <=2.5; byte-identical instrumented scenes
PASS one-way pipeline: every recorded construction/allocation/projection stage executes exactly once
```

## Repository gate (exit 0)

```text
 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  15:31:52
   Duration  20.03s (tests 74%, import 14%, transform 10%, environment 2%)

```

`git diff --name-only 88c65fe -- '*.test.ts'`: no output (zero new or changed test files).
