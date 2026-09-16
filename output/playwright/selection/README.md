# M2 — two-level selection and primary wire labels

Branch: `feat/selection-labels`, based on M1.5 `2e4ce82`. No dependencies or test files added. Existing Vite on port 5188 retained; no push or PR.

## Acceptance evidence

- `pnpm check`: exit 0; **70 test files, 208 tests passed**. Complete output: [checks.txt](checks.txt).
- Browser acceptance: [verification.txt](verification.txt). The committed runner `apps/web/cli/verify-selection.py` invokes the Playwright body in `verify-selection.mjs`. It checks every one of 22 nodes and 12 wires by actual CSS class and computed opacity for each selected state, plus all roads/ports, labels, toggle, transfer, and clearing.
- Layout pipeline count: **1 before; 1 after each of b, c, d, e, f, g; delta 0**. All rendered node/road/port bounds, path points and camera transforms are also compared. `window.__layoutRecalcCount` increments immediately before the real scene builder executes.
- Five navigation-to-ready loads: **278.800, 235.000, 243.700, 251.900, 223.200 ms**. Median **243.700 ms**. Original M1 median **239.200 ms**, pinned in `output/playwright/nested-wires/before.json`; ceiling **275.080 ms**. Increase **1.88%**, below 15%. Measurement matches M1: warm-cache Chromium, 1920×1440, navigation start through fonts ready and two animation frames; includes coverage audit. It is not GPU paint duration.
- Screenshots: [default](default.png), [node-7 selected](node-selected.png), [w06 selected](wire-selected.png), [cleared](cleared.png). Default and cleared are byte-identical.
- Raw measurements: [metrics.json](metrics.json). Routing operation audit: [routing-operations.txt](routing-operations.txt). Independent geometry assertions: [invariants.txt](invariants.txt).

## Behaviour and implementation

One React primary ID determines all visual state. A wire primary yields only its two endpoint nodes. A node primary finds incident wires and their opposite endpoints. Replacing that ID recomputes the neighbourhood; selecting it again or clicking empty canvas clears it. No incremental class mutation can leave residues. Camera focus remains separate and memoized. Finished scene geometry and road/lane membership are reused.

Primary nodes use a full accent fill and outer outline; secondary nodes use a supporting fill and lighter outline. Primary wires use a stronger stroke; secondary wires retain moderate opacity. Nodes/wires/ports outside selection fade to 0.28; roads and junctions retain 0.55 to keep their structure visible. Secondary objects use 0.70. All opacity values come from centralized Design System tokens. Only the primary wire has a text element; its ID is centered at the arc-length midpoint and lifted 12 world units above the path. The midpoint is cached with the frozen wire data. Wide transparent stroke hit targets support real pointer selection without changing wire geometry.

## Scaling: selection at 100 nodes / 200 wires costs what, per click, and why

Selection computation is **O(W + degree)**: at most 200 wire-ID checks; a node click additionally scans 200 wires for incident endpoints and adds at most three IDs per incident wire to a Set. A wire click stops after lookup and adds exactly two node IDs. This is one hop, never a graph traversal.

Painting makes **100 node + 200 wire classification decisions**, plus classification of existing section/road/junction/gate view records. Set membership is expected O(1). React reconciles those records and port/lane children. The current SVG renderer also serializes existing segment coordinates for its three polylines per wire, so total per-click work is **O(N + W + R + J + P + L + C + S)**, where S is total wire segments and C covers existing inspector connection scans. Memory for replacement view records is linear in rendered objects; the secondary Set is O(degree). Fixed-degree roads/ports and bounded wire segment counts reduce this to O(N + W) for comparable fixtures. No claim of constant-time rendering or a measured 100-node millisecond result is made.

**Layout, road construction, driveway placement and wire routing cost exactly zero per selection click.** The initial pipeline and midpoint calculations are not rerun. Existing road-to-lane filtering is cached outside selection changes. The live counter and geometry comparisons establish that distinction.

## Visual review

Personally inspected all four full-resolution images against `docs/agent-diagrams/visual-quality/References.md` (including retained AWS and Docker images) and the maintenance benchmark rubric. Node-7 is immediately dominant; node-12 and w12 are visibly secondary. In the wire state, w06 and its label stand out with only node-8/node-10 secondary. Road silhouettes, dividers and directions remain visible. The cleared state matches the initial image exactly.

Primary node text/blue fill and the primary wire label/white halo retain the original token contrast (at least 5.89:1); heading/body ratio remains 1.4875. Dimming intentionally lowers contrast on unrelated objects as explicitly required by this milestone; it is not a claim that faded content meets active-text contrast floors. Road dividers and section borders are contextual separators. Only one label can exist, eliminating label/label collisions; the selected w06 label is clear of node bodies. Frozen M1.5 geometry retains zero positive-length wire overlaps and one crossing within S2's budget. Original sparse section spacing and plain rectangular actors remain inherited limitations: this selection milestone does not claim the infographic imagery or panel-density benchmark. Altering those would violate the frozen-layout requirement. No reference assets changed and no subagents were used.

## Reproduce

```sh
pnpm check
python3 apps/web/cli/verify-selection.py
pnpm exec tsx apps/web/cli/verify-nested-wires.ts
pnpm exec tsx output/playwright/nested-wires/verify-invariants.mjs
pnpm exec tsx output/playwright/nested-wires/count-operations.mjs
pnpm tokens:check
```

The browser runner fails on any assertion or CLI error. It writes metrics only after all interactions, timing and image-presence assertions pass. Re-running updates timing samples; update this README if retaining a new sample. Git cleanliness is checked after committing all evidence.
