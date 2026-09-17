# Drag UX evidence — 17 September 2026

**Verification completed; two UX assertions diverge.** Real React Flow drags work headlessly, so the STOP condition was not reached. Cursor tracking exceeds the 3 CSS px tolerance, and a click moving 1 px on each axis does not select. No behavior was changed.

Branch: `feat/drag-swap`. Existing server: `http://127.0.0.1:5188/roads-prototype.html?nested`. Browser interaction used only Playwright's headless CLI session and real `page.mouse` events. No server was started/stopped; no application source, existing verifier, reference image, or test file was changed. No push or PR.

## Method and evidence

[verify.mjs](verify.mjs) is the observation harness; [run.py](run.py) runs it through the installed Playwright CLI. Each UX probe starts from a fresh page at 1920 × 1440, zoom 0.62, roads hidden. Events are trusted browser events, captured in [verify.json](verify.json) with coordinates, buttons, target, and timestamps. The harness never calls production drag handlers, rewrites geometry, or synthesizes DOM drag events. Its only injected state is event-observation storage and an abort controller for those listeners.

Every drag has at least 12 individual mouse moves. The screenshot-free cursor pass has **16.5 ms median** sampling intervals; the five timing drags have **16.2–17.6 ms** medians. The frame sequences use separate identical-path drags: one screenshot follows every move, plus before/hover/after images. **Capture overhead slows these sequences to 50.1 ms median per move for valid and 97.6 ms for invalid. They are not 60 fps recordings.** Use the coordinates/timestamps for motion measurements and the images for spatial review; no smoothness verdict is assigned here. This is the capture-cadence limitation of the delivered harness.

Scene preservation compares SHA-256 and byte length of the complete serialized scene. No-op bounds also compare every rendered node's literal transform/width/height strings. The cursor probe additionally compares the source's complete `getBoundingClientRect().toJSON()` result byte-exact. Selection records are sorted by identity so DOM order changes during a swap cannot masquerade as selection changes. Assertions retain expected and actual values; reported divergences are not silently passed.

## Per-probe results

| Probe | Result and measured evidence | Images |
| --- | --- | --- |
| Cursor tracking, node-4 toward node-1, released between cells | **DIVERGENCE:** maximum center-to-pointer distance **10.33334 CSS px**, exceeding 3 px. 12 steps, median interval **16.5 ms**. The first move activates dragging without moving the center; the subsequent center positions retain an offset. All samples and the event trace are in `probes[0]`. | Separate capture replay: [invalid hover](invalid-hover.png) |
| Empty-space snap-back | **PASS:** original and final screen bounds are exactly `{x:299.08001708984375,y:595.760009765625,width:119.03997802734375,height:59.52001953125}` (full rect in JSON). All rendered transforms/dimensions and the complete serialized scene digest remain identical; layout count **1 → 1**. | [Before](invalid-before.png), [after](invalid-after.png) |
| Same-section valid swap | **PASS:** node-4 exchanges `{x:272,y:800,width:192,height:96}` with node-1's `{x:272,y:400,width:192,height:96}`. Layout count **1 → 2**, with no recalc during motion; selection unchanged. The unchanged M5 verifier independently checks the other 22 nodes, all rendered bounds, all 26 paths, and a fresh semantic rebuild. Capture-path center deviation: **21.33335 px**. | [Before](valid-before.png), [hover](valid-hover.png), [after](valid-after.png) |
| Swap-target feedback | **OBSERVED:** node-1's wrapper/card/descendant classes, background, border, outline, shadow, opacity and filter are identical before and during hover. No added target highlight or outline is visible. The source wrapper has React Flow's `dragging` class; the source overlaps the target at hover. | [Hover node-1](valid-hover.png), [last valid frame](frames/valid-12.png) |
| Drag ≠ click, 18 px horizontal movement | **PASS:** node-7 is selected first; moving node-4 18 px in 12 steps preserves the complete M2 selection state, scene and rendered geometry. Layout count **1 → 1**. | [Selected baseline](drag-not-click-before.png), [after drag](drag-not-click-after.png) |
| Click with 1 px x / 1 px y movement (1.414 px total, below 3 px) | **DIVERGENCE:** primary and secondary selections remain empty. The trace contains trusted pointerdown/mousedown, move, pointerup/mouseup and click events targeting node-7. Expected primary: node-7; expected secondaries: node-12, node-23, node-5, w12, w13, w21. Layout delta **0**. | [After small-movement click](click-1-selection.png) |
| Zero-movement click control | **PASS:** node-7 becomes primary; exact six-element M2 neighborhood above becomes secondary. Layout delta **0**. | [After stationary click](click-0-selection.png) |
| Past canvas top edge | **PASS for drop semantics:** 30 moves to `(358.600006,69)`, 20 px above the pane's top. No crash, no swap, complete scene and world transforms unchanged, layout delta **0**. Camera y translation changes **10.76 → 224.135 px** due to edge panning and remains there after release; therefore the source's final screen location changes despite its original world position being restored. | [Hover outside](past-edge-hover.png), [after](past-edge-after.png) |
| Different section, node-4 → node-7 | **PASS:** 20 moves; source section-1, target section-2. No swap, no crash, scene and rendered transforms/dimensions unchanged; layout delta **0**. | [Hover](cross-section-hover.png), [after](cross-section-after.png) |
| Section boundary/frame | **PASS:** 20 moves to `(963.719971,185.080002)`, 1 px inside section-1's top frame. No swap, no crash, scene and rendered transforms/dimensions unchanged; layout delta **0**. | [Hover](section-frame-hover.png), [after](section-frame-after.png) |

There were **zero uncaught browser errors**. All movement probes kept the initial layout count until release. No tested drop diverged from “swap only within the same section, otherwise no-op.”

## Frame sequences for the orchestrator

- Valid swap: [frames/valid-01.png](frames/valid-01.png) through [frames/valid-12.png](frames/valid-12.png), followed by [valid-after.png](valid-after.png).
- Invalid drop: [frames/invalid-01.png](frames/invalid-01.png) through [frames/invalid-12.png](frames/invalid-12.png), followed by [invalid-after.png](invalid-after.png).
- [Contact sheet](contact-sheet.png): valid sequence above invalid; each includes before, all 12 move frames, and after. It crops `(230,300)–(880,720)` from the full screenshots and resizes only for the sheet. Original frames are unaltered 1920 × 1440 PNGs. Native pointer cursors are not painted into these screenshots; exact pointer positions are in the sample records.
- [contact-sheet.py](contact-sheet.py) regenerates the sheet from those saved images. Judgment of interaction feel is reserved for the orchestrator.

## Timing and regression gates

| Gate | Evidence |
| --- | --- |
| Five drag-swaps measured separately | **PASS, median 66.0 ms.** Samples: **108.2, 66.0, 66.2, 64.0, 64.7 ms**. [timing.json](timing.json), [output](timing-output.txt). Every swap changed exactly one layout count and produced a new ready measure. |
| Load and repeat | Ten logical CPUs. First pass: median **67.4 ms**, samples **108.8, 67.4, 69.0, 67.3, 66.2 ms**. Kimi was at 55.4% CPU in its initial load snapshot, so a quieter repeat was taken. Repeat's initial top process was WindowServer at **4.3% CPU**, load averages **3.57 / 4.88 / 4.78**. Both runs had no other task verification running. [First result](timing-first.json), [first load](timing-first-load-before.txt), [repeat load before](timing-load-before.txt), [repeat load after](timing-load-after.txt). |
| Existing M5 verifier, unchanged | **PASS, exit 0**, executed through its existing `verify-drag-swap.py` runner. Median **69.3 ms**. [Output](m5-output.txt), [exit and identical before/after MJS SHA-256](m5-gate.json), [fresh M5 evidence](m5-rerun/interaction.json). Existing tracked M5 artifacts were restored after preserving this rerun here. |
| `pnpm check`, alone | **PASS, exit 0; 70 files / 208 tests passed.** Typecheck, lint including Sonar ≤2, formatting, architecture, and tests all passed. Started 2026-09-17 13:25 UTC, after both headless verification sessions had closed. [Full output](check-output.txt), [gate record](check-gate.json), [process snapshot](check-load-before.txt). |
| Scope | Only this evidence directory is added. No `*.test.ts`; no production instrumentation was needed. No application/source behavior or existing verifier changes. |

Timing uses the existing `roads:drop-to-ready` performance measure: `onNodeDragStop` marks the start, and the committed React tree followed by two animation-frame opportunities marks readiness. This is drop-handler-to-render-ready latency, not mouse hardware latency or GPU execution time. Each five-sample set includes its first, slower swap; none was discarded. Screenshot capture and `pnpm check` were not running during timing.

## What a user sees today

The card moves while its wires remain at committed endpoints, then a same-section drop swaps both cards and reroutes the scene; an invalid drop restores the card. The observed gaps are a persistent cursor offset on the tested paths, no visible target feedback, and lost selection for a 1.414 px click gesture. Dragging beyond the edge pans the camera, and that pan survives an otherwise successful no-op snap-back.

The full overview, hover image, edge result and contact-sheet crop were inspected against [References.md](../../../../docs/agent-diagrams/visual-quality/References.md), its retained Docker/AWS target images, and the [benchmark gates](../../../../docs/maintenance/diagram-quality-improvements.md). This diagnostic fixture has nested aligned boundaries, but its tiny port captions and repeated plain cards do not establish the reference illustration/readability bar. No broad visual-quality pass is claimed: contrast, crossing budgets and panel voids were not re-measured, and transient dragged overlap/detached wires are visible. This task records existing output; it does not authorize the benchmark redesign/fix loop.

## Reproduction and audit scope

Run commands sequentially from the repository root, with the existing 5188 server already running:

```sh
python3 output/playwright/nested-wires/drag-ux/run.py
python3 output/playwright/nested-wires/drag-ux/contact-sheet.py
# Check current process load; run the following alone, without screenshot capture or check.
python3 output/playwright/nested-wires/drag-ux/run.py timing
python3 output/playwright/nested-wires/verify-drag-swap.py
# Close the headless sessions before the full gate (the runners close them in finally).
pnpm check
```

The UX runner reports `DIVERGENCE` as a completed observation, with every failed assertion retained. It returns `STOP` with trace evidence if the initial real drag cannot move; infrastructure errors terminate the process. Timing returns a failing process exit when its gate does not pass. A fresh-page rerun replaces generated evidence. The M5 runner writes its established `m5-swap/` artifact paths; preserve those if repeating it solely for comparison.

These MJS/Python programs use the repository's explicitly documented terminal-audit scope in [m4-source-review.md](../m4-source-review.md#audit-programs-and-evidence-scope) and [M5 source review](../m5-swap/source-review.md). They are not assigned application-source scores. No new scoring or lint exemption was introduced; the MJS passes the normal Sonar ≤2 gate. Application sources and their existing reviews are unchanged. Known harness limits are screenshot cadence, a fixed fixture/viewport, and browser-specific rendering/timing; observations are not generalized to other devices.
