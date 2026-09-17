# Track B2 — click tolerance fixed; cursor investigation stopped

**Click selection now tolerates 3 CSS px. The full requested all-green gate set is NOT met: cursor tracking still diverges.** Per the brief's explicit instruction to document a persistent offset and stop that part, cursor behavior was left intact. Selection discrimination required no re-architecture, so the global STOP condition was not triggered.

Branch: `feat/drag-swap`, starting commit `c98b406`. Only `RoadPrototype.tsx` changes application behavior: one constant feeds both `nodeDragThreshold` and `nodeClickDistance`. React Flow's independent click-suppression distance previously defaulted to zero. Changing only the drag threshold did not fix selection; matching both to the requested **3 px** did. See [code evidence](code-evidence.md) and [145/160 source review](source-review.md).

| Gate | Result | Evidence |
| --- | --- | --- |
| Zero-movement, 1.414 px and 2.8 px clicks select node-7 with exact M2 neighborhood | **PASS** | [threshold.json](threshold.json): primary `node-7`; secondaries `node-12`, `node-23`, `node-5`, `w12`, `w13`, `w21`; no layout recomputation. Extra 3 px click also passes. |
| ≥4 px drag discrimination, swap and snap-back | **PASS** | Exact 4 px movement produces one real `roads:drop` mark, no selection change, no geometry/scene change. A 4 px activation followed by node-1 drop swaps bounds exactly; empty-space release restores scene SHA-256/byte length and all rendered transforms/dimensions. [Boundary probes](threshold.json). |
| Original M5 verifier unchanged, exit 0 | **PASS** | [M5 output](m5-output.txt), [hash/exit gate](m5-gate.json), [fresh interaction result](m5-rerun/interaction.json). Verifies both swapped nodes, other 22 nodes, all 26 routes/rendered paths, independent semantic rebuild, return swap, exact selection and invalid drop. |
| Track B's previous click divergence now passes | **PASS** | Original `drag-ux/run.py` executed unchanged; both failed M2 assertions now pass. [Comparison](track-b-comparison.json), [rerun output](track-b-output.txt). |
| Track B's previous cursor divergence now passes | **FAIL / cursor work STOPPED** | Dedicated path max **10.333340 px**, unchanged. The original ≤3 px assertion remains false. [Rerun JSON](track-b-rerun/verify.json). |
| All previously-PASS Track B probes remain PASS | **PASS** | **47/47** preserved, zero regressions. Snap-back byte-exact, cross-section no-op, edge no-crash, 18 px drag ≠ click, no movement-time recomputation, zero browser errors. |
| Five swaps, median ≤100 ms, alone | **PASS: 69.2 ms** | Samples **107.0, 72.6, 69.2, 65.7, 64.8 ms**, all retained. [Timing JSON](timing.json), [exit gate](timing-gate.json). |
| `pnpm check`, alone, exit 0, 208 tests | **PASS** | **70 files / 208 tests**, typecheck/lint/format/architecture also pass. [Output](check-output.txt), [gate](check-gate.json). |
| No new `*.test.ts`; scope and branch retained | **PASS** | One renderer configuration change plus this evidence directory. No dependencies, lockfile, CSS, selection handler or drop handler changed. No push/PR. |

## Before and after

- [1.414 px click before](baseline/click-1-selection.png): no selected primary or neighborhood.
- [1.414 px click after](click-1-selection.png): node-7 primary and exact M2 secondary paint.
- [2.8 px click after](click-1.9798989873223327-selection.png).
- [4 px activation → swap before](boundary-valid-before.png), [after](boundary-valid-after.png).
- [4 px activation → empty drop before](boundary-invalid-before.png), [after](boundary-invalid-after.png).
- [Original Track B swap after](track-b-rerun/valid-after.png), [invalid hover](track-b-rerun/invalid-hover.png), [invalid after](track-b-rerun/invalid-after.png). Full before/hover/after and frame sequences are retained under `baseline/` and `track-b-rerun/`.

## Cursor result and stop boundary

The first movement activates dragging without moving the center. XYDrag constructs its drag offset from that activation event rather than the original mousedown. A 3 px setting therefore does not absorb a first sampled movement of ~10.3 px. Dedicated screenshot-free path maximum remains **10.333340 px**; same-section swap maximum is **21.333347 px**; maximum over all Track B paths is **57.147725 px** on the longer cross-section path. [Exact installed-code locations and first two sample measurements](code-evidence.md).

The brief simultaneously asks for both old divergences to pass and expressly says to stop the cursor portion if the offset persists. This result follows that scope boundary and records the unmet cursor gate; it does not reinterpret DIVERGENCE as PASS. No third-party patch, zero-threshold workaround or replacement drag architecture was made.

## Execution and limits

Every browser session was headless and used trusted `page.mouse` events against the already-running 5188 server. No server was started, killed or restarted. No application handlers, coordinates or scene state were injected. Original Track B and M5 scripts remain byte-identical; the preservation wrapper saved their fresh outputs and restored their original tracked evidence. The original Track B runner exits 0 for a completed observation even when status is DIVERGENCE; inspect the JSON assertions, not that process exit alone.

The minimized baseline command was `python3 output/playwright/nested-wires/drag-ux-threshold/run.py clicks`: moving clicks diverged while zero movement passed. `baseline/clicks.json` captures the original result and `drag-threshold-only/clicks.json` captures the single-variable 4→3 drag-threshold experiment. Final `threshold` mode includes the same clicks and 4 px boundary probes and rejects a non-PASS result. Full original baseline is `baseline/verify.json`.

Click distance labels describe the requested CDP mouse path: diagonal movement is `(distance/√2, distance/√2)`, including `(1,1)` for 1.414 px. Pointer events preserve fractional coordinates; native mouse events may quantize client coordinates. Both are retained in traces. Browser/device behavior beyond this headless Chromium fixture at 1920×1440 and zoom 0.62 was not generalized; touch, pen and other zooms were not tested.

Timing ran alone at **2026-09-17 13:38:16–13:38:22 UTC**, without screenshots, M5, Track B verification or tests. Ten logical CPUs; initial load averages **5.21 / 5.14 / 4.76**. Background `mediaanalysisd` was **58.1% CPU** initially (93.3% afterward), WindowServer 42.7%, and `textunderstandingd` 19.9%. Thus isolation means no concurrent task verification, not an idle OS. [Before](timing-load-before.json), [after](timing-load-after.json). The measure is the existing drop-handler-to-React-ready/two-frame metric, not GPU or mouse hardware latency. No sample was discarded and no faster rerun substituted.

`pnpm check` ran alone after browser sessions closed, **13:38:30–13:39:01 UTC**. Its initial process snapshot is [recorded](check-load-before.txt). The inherited harness's screenshot sequences are frame captures with screenshot overhead, not 60 fps recordings; cursor measurement uses the separate screenshot-free path.

Visual review personally compared baseline/selected overview, swapped output and invalid hover against [References.md](../../../../docs/agent-diagrams/visual-quality/References.md), retained Docker/AWS images and [benchmark gates](../../../../docs/maintenance/diagram-quality-improvements.md). Selection visibly identifies node-7 and its neighborhood; swapped cards and routed wires settle correctly. Existing limitations remain: tiny port captions at overview, repeated plain cards, large panel voids, and detached committed wire endpoints during dragging. This narrow interaction fix does **not** establish a broad diagram-quality benchmark pass: contrast, crossing budgets, export readability and panel occupancy were not re-certified or redesigned. Approved reference images were preserved.

## Reproduction

With the existing 5188 server running, execute sequentially from the repository root:

```sh
python3 output/playwright/nested-wires/drag-ux-threshold/run.py threshold
python3 output/playwright/nested-wires/drag-ux-threshold/run-existing.py track-b
python3 output/playwright/nested-wires/drag-ux-threshold/run-existing.py m5
# Record machine load and run alone:
python3 output/playwright/nested-wires/drag-ux-threshold/run.py timing
# After all browser runners close, run alone:
pnpm check
```

The preservation wrapper copies original evidence directories before invoking unchanged runners, archives their results, and restores originals in `finally`. A rerun may also copy historical files from those original directories; this delivery retains only fresh generated results in the two `*-rerun/` directories. `sha256.json` inventories delivered evidence. No production debugging instrumentation was introduced.
