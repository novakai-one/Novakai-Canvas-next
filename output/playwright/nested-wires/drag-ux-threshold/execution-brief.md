# Track B2 — fix click/drag threshold defect (+ investigate cursor offset)

You are on branch `feat/drag-swap` in worktree `/Users/christopherdasca/Programming/Novakai-Canvas-next-roads` (stay on it). Server on **5188 is running — do not kill it, do not start servers**. HEADLESS only.

Track B (commit c98b406, evidence in `output/playwright/nested-wires/drag-ux/`) measured two divergences:

1. **DEFECT (fix now):** a click with 1.414 px total movement (1 px x + 1 px y) produces trusted pointer/mouse/click events on a node but NO M2 selection. Zero-movement clicks select correctly. Humans move 1–3 px on real clicks — selection must tolerate it. React Flow exposes `nodeDragThreshold` (or equivalent): sub-threshold movement must be treated as a click. Ship a threshold of **3 px** (or the smallest library-supported value ≥ 1.5 px — state what you used and why).
2. **INVESTIGATE (fix only if trivially safe):** cursor-tracking offset — the first mouse move activates dragging without moving the node center; a ~10.3 px center-to-pointer offset persists. If this is activation consuming the first move and your threshold change absorbs it, say so with measurements. If it persists after the threshold fix, DO NOT re-architect drag — document the residual offset and stop that part.

## Hard gates (binary)

- Click with 1.414 px movement on node-7: primary node-7 + exact M2 secondary set (per the Track B probe). Click with 2.8 px: same. Zero-movement click: unchanged.
- Drag of ≥ 4 px movement followed by drop on node-1: swap still lands exactly; drop on empty space: snap-back unchanged; drag ≥ 4 px does NOT alter selection.
- Post-fix cursor-tracking re-measure: report max center-to-pointer distance (expect large improvement if first-move consumption was the cause).
- `output/playwright/nested-wires/verify-drag-swap.mjs` (M5 verifier, unchanged) exit 0. Track B harness (`drag-ux/run.py`) re-run: the previous two DIVERGENCE probes now PASS; all previously-PASS probes still PASS (snap-back byte-exact, cross-section no-op, edge no-crash, drag≠click at 18 px).
- Five drag-swaps median ≤ 100 ms measured alone (record machine load).
- `pnpm check` alone, exit 0, 208 tests. No new `*.test.ts`.
- Evidence under `output/playwright/nested-wires/drag-ux-threshold/` (probe JSONs, before/after screenshots incl. one 1.414 px click selection, timing). Report with gate table + honest limits.
- Commit on `feat/drag-swap`. DO NOT push, DO NOT open a PR.

If the renderer's selection path cannot distinguish sub-threshold movement from drags without re-architecture, STOP with the exact code evidence — a correct STOP is success.
