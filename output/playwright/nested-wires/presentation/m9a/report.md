# M9a — paint-only spotlight acceptance

PASS for the scoped milestone on `feat/m9a-spotlight`, based on `9bfe1d9`. Runtime commit: `8b0e132`. No STOP condition fired. No push or PR.

| Gate | Final evidence |
| --- | --- |
| `pnpm check`, run alone | Exit 0; 70 files / **208 tests**; [log](pnpm-check.txt) |
| New `*.test.ts` | **0**; existing native-export test gains assertions, test count unchanged |
| Full scene bytes | Fresh nested/templates/scale serialization equals committed `9bfe1d9` byte-for-byte; [identity](identity.txt) |
| Structural verifier | Exit 0; [log](verify-structural-identity.txt) |
| Invariants | Templates **130/0**, scale **112/0**, zero overlaps; [templates](templates-invariants.txt), [scale](scale-invariants.txt) |
| Exact compile/routing/discovery | Nested **19,768/992/0**; templates **28,443/1,626/0**; scale **43,876/2,088/0**; [offline run](offline-output.txt) |
| Scale roads-off, five-load median | **229.4 ms ≤ 300 ms** |
| Templates, five-load median | **190.2 ms ≤ 250 ms** |
| M2 selection | All unchanged assertion-body checks pass; median 183.1 ms; [selection](selection.json) |
| Hover/selection layout | **Zero recalculations**; exact node/road/port bounds, route attributes and camera retained |
| Hysteresis | 100 ms cancellation-aware enter/leave scheduler; 25 ms pass never flashes; 25 ms leave/reenter retains settled net |
| Hover labels/selection precedence | No wire labels or primary state on hover; a selected wire's labels and all object paint stay unchanged under hover |
| SVG | Exactly one route path with unchanged `d`; numeric published idle alpha on path and markers; no interaction attrs/classes; existing native-export assertion passes |
| Screenshots | Headless, 1920×1440, **5191 only**; [visual review](visual-review.md) |

## Behavior and publication

`wire.idleOpacity = 0.65` multiplies the previous idle stroke alpha (converging strokes therefore use 0.468). `wire.spotlightDimOpacity = 0.16` dims unrelated wire strokes while hovering. Both are published through generated CSS/token names. Static export imports `wireIdleOpacity` through the Design System public contract, reading the same source definition rather than duplicating a number or relying on browser CSS variables.

Hovering a node uses exactly the existing one-hop incident wires and endpoint nodes. Hovering a wire uses that wire and its two endpoints; it does not recursively expand beyond the M2 neighbour set. Highlighted wires use the existing accent and full opacity; nodes use the existing supporting fill/accent outline. Selection uses the unchanged M2 class function, opacity rules and primary-only label condition. Idle/hover alpha is applied to stroke children so existing group opacity and selection assertions remain exact.

The host supplies only a cancellable paint scheduler. The renderer owns ephemeral state, cancellation and unmount cleanup; no layout API is called. Native SVG title tooltips were replaced with accessible group labels, avoiding delayed visible labels on hover. Existing hit targets and path geometry are retained.

## Reproduction

Run `pnpm check` alone. After it exits, run `python3 output/playwright/nested-wires/presentation/m9a/verify-offline.py`, then `verify-browser.py` and `verify-spotlight.py` in that directory. Browser scripts require the checkout's Vite server on 5191 and use the existing Playwright CLI wrapper in a private `m9a` headless session. An existing 5191 server from this same checkout was verified and reused; it was not terminated. No requests or server commands target 5188/5190. Browser sessions were closed.

## Honest limits

Readiness is navigation through fonts/two animation-frame opportunities, not GPU paint time. The prescribed timer is 100 ms; observed mouse-event through React class commit was **132.7 ms**, including scheduling/render latency. Five-load samples and stage decomposition are retained in [browser.json](browser.json); these are same-machine observations, not a universal performance guarantee.

The 0.65 quieting ratio is within the explicit brief. It retains connectivity visually at overview and reading zoom, but inherited scene density, small overview text, empty panel space and crossings do not meet every general reference benchmark. Quiet converging strokes also fall below the generic 3:1 stroke contrast floor; this is explicitly recorded in the [visual review](visual-review.md), not silently claimed green. No layout or palette workaround was attempted outside the authorized paint scope.

Intermediate acceptance-script lint violations were fixed by splitting helpers; a new export assertion initially targeted the label group instead of the marker group and was corrected to select `g[opacity]`. Final source and runner checks are green; no assertion threshold was weakened. No subagent was used, following the task's project instructions.
