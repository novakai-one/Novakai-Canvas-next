# M9a-fix — spotlight gate reliability

PASS. Branch `feat/m9a-spotlight-fix`, base `94c605feb7445ed3756ee2efaa42fe84be8607e9`. Fix is exclusively in the acceptance probe and its evidence driver. No application behavior, renderer, scheduler, scene, token, SVG exporter or selection implementation changes. No push or PR; no server started/stopped; no subagent used.

## Mechanism and correction

The old probe samples **between the wire commit and React Flow's subsequent controlled-node commit**. It either waits for any spotlight class or sleeps 180ms, neither of which establishes that the complete net has rendered. React Flow propagates the controlled `nodes` prop through a passive StoreUpdater effect; wires render directly in the parent tree.

[Mechanism established before editing](mechanism.md), [failing instrumented trace](trace-02.json): hub→w01 enters at 1950.9ms; timer fires at 2052.5ms; wires commit at 2134.4ms; probe samples at 2135.5ms and rejects node-3, which still has the old hub spotlight. Nodes converge to exactly node-1/node-2/w01 at 2179.3ms, without another input. The superseded leave timer was cancelled and never fired. A second trace reproduces the same failure ([trace 04](trace-04.json)). This is evidence for a probe synchronization defect, not an app timer-cancellation defect or a persistently leaked net.

`m9a/spotlight.mjs` now polls the **entire exact identity/class collection** until it matches on two consecutive animation frames, with a 5000ms timeout. Idle, hover and selected paint all use the same settling helper. Original exact class, opacity, accent, label, geometry, camera and recalc assertions remain. Deliberate 25ms pointer stimuli remain; negative cancellation/flicker checks observe through the original 180ms interval using a polled observation deadline. No fixed sleep is used to decide that paint has settled.

[Wrong-net counterfactual](fail-closed.log): adding node-3 to the expected w01 net still produces `page.waitForFunction: Timeout 5000ms exceeded`. The application is not changed for this check. The first counterfactual driver treated that expected CLI nonzero exit as an unexpected wrapper exception; [first driver log](fail-closed-driver-first.log) is retained. The driver was corrected to inspect the expected timeout, then [passed](fail-closed-summary.log). No hard-gate failure was retried or hidden.

## Reliability evidence

Ten unmodified base runs, before the fix: **7/10 failed** with the exact reported `net membership node-1` or `node-3` symptom. Exit codes ([raw](base-exits.json), individual `base-01.log` through `base-10.log`):

```text
1, 1, 0, 1, 0, 1, 1, 0, 1, 1
```

Same-count after sample: final runs 1–10, **0/10 failed**. Full required consecutive batch: **20/20 exit 0**, serial, no retries. [20-run log](20-run-log.txt); individual `spotlight-01.log` through `spotlight-20.log` retain full reports and exits.

```text
run:   01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20
exit:   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
```

Then `verify-browser.py` three times: **0, 0, 0** ([exits](browser-exits.json), `browser-01.log` through `browser-03.log`). Each run retains its own browser and selection JSON.

## Standing gates

| Gate | Result / evidence |
| --- | --- |
| `pnpm check`, alone | Exit 0; **70 files, 208/208 tests**; [full log](pnpm-check.txt). No new `*.test.ts`. |
| Full scene bytes | Fresh nested/templates/scale serialization equals the original standing baseline; [identity](identity.txt). Also identical to this branch's `94c605f` base, with byte counts and SHA-256 pairs: [base bytes](base-byte-identity.json). |
| Invariants | Templates **130 certified / 0 uncertified**, scale **112 / 0**, zero overlaps; [templates](templates-invariants.txt), [scale](scale-invariants.txt). Verifier sources unchanged. |
| Exact compile/routing/discovery | Nested **19,768/992/0**, templates **28,443/1,626/0**, scale **43,876/2,088/0**; [offline replay](offline-output.txt). |
| Other standing offline gates | Identity, nested wires, invariants, topology, pins, geometry, structural identity, lanes, static, oracle and topological bound all exit 0; same offline replay. |
| Scale roads-off five-load medians | Browser runs 1–3: **233.4 / 232.8 / 233.2ms**, each ≤300ms. |
| Templates five-load medians | **187.1 / 185.3 / 186.9ms**, each ≤250ms. |
| M2 selection | Unchanged assertion body passes 3×; medians **183.2 / 178.5 / 182.0ms**, all ≤450ms. |
| Hover/selection layout | **delta = 0** in every accepted spotlight and selection run; exact geometry and camera snapshots retained. |
| No labels on hover | Original zero-label/zero-primary assertions pass for node and wire hover; selection retains the primary wire label and overrides hover. |
| Hysteresis | Scheduler source unchanged at 100ms. Instrumented actual timer delays **100.5–102.9ms**; zero cancelled-before-fire timers subsequently fired: [timer summary](timer-summary.json). 25ms pass and brief-leave checks pass in all 20 runs. |
| Renderer / SVG export | Source bytes unchanged; [runtime hashes](runtime-identity.json), full `git diff 94c605f -- capability apps` empty. Native export assertions pass in `pnpm check`. |
| Tokens | [tokens:check](tokens-check.txt), exit 0. |
| Visual inspection | Overview, wire hover and contract-detail hub hover reviewed against reference context; [visual review and inherited gaps](visual-review.md). |

## Reproduction and limits

Reuse the orchestrator's existing Vite server on **5191**, which resolves to this checkout's `apps/web` ([server cwd](server-cwd.txt)). Every browser session is headless and closed by its runner. No operation targets server ports 5188/5190.

- `python3 output/playwright/nested-wires/presentation/m9a-fix/run-gates.py` runs the fixed spotlight gate 20×, then the unchanged browser gate 3×, serially, stopping on any nonzero exit.
- `python3 output/playwright/nested-wires/presentation/m9a-fix/diagnose.py` replays the base probe from `git show 94c605f` with browser-lifetime event/timer/commit instrumentation. It is diagnostic-only and can produce expected failures.
- `python3 output/playwright/nested-wires/presentation/m9a-fix/verify-fail-closed.py` checks the wrong-membership timeout.
- `python3 output/playwright/nested-wires/presentation/m9a-fix/run-standing.py` replays offline/byte/token gates. Then run `pnpm check` **alone**.

The first diagnostic iteration inserted a protocol round trip before reads and passed 10/10 (`diagnosis-*.json`): that instrumentation perturbed the race. The retained diagnostic script removes it; its five replays reproduce two failures (`trace-*.json`). Those instrumented samples are not included in the unmodified-base or fixed-gate rates.

These are finite, same-machine observations, not proof of zero lifetime flake probability. The two-frame/5000ms wait permits asynchronous render completion but still rejects a persistently wrong net. The unchanged 100ms hysteresis delay is distinct from event-to-first-class latency: the final batch observed **125.2–131.3ms** including React render time. No renderer change was made or justified to force DOM paint inside the timer window. Existing broader visual gaps remain documented rather than silently claimed solved. All debug instrumentation is confined to the explicitly marked diagnostic harness; application sources are untouched.
