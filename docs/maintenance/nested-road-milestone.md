# Four-section nested road milestone

Open `http://127.0.0.1:5188/roads-prototype.html?nested`.

## Implemented scope

22 distinct nodes. Section 1 owns four directly and contains Section 2, which owns six. Section 3 and Section 4 each own six. The new fixture describes only counts and hierarchy; Layout calculates all coordinates. Earlier two-node and seven-node URLs remain available.

Creation policy:

1. Choose `ceil(sqrt(count))` columns; calculate rows from the count.
2. Size each child first from its content and reserved road spacing.
3. Place direct-node grids beside child sections; use an area-derived shelf width to wrap root sections.
4. Position each node once in its grid cell; read its four owned ports.
5. Build shared grid streets and perimeter roads, then connect the owner ports. Adjacent collinear streets are merged before lane compilation.

No convergence loop, randomized placement, handwritten node coordinates, or DOM measurement. Node 1–4 occupy a 2×2 grid; nodes 5–10 form Section 2's 3×2 grid. The other two sections each use 3×2. Section 2 has an explicit `parentSectionId`, and the renderer paints the parent behind it.

The previous zero-island proposal is not applied. Road perimeters remain visible through the Show roads switch; hiding them changes paint only.

## Verification

One-off geometry inspection, not new committed tests:

- direct membership: 4 / 6 / 6 / 6; geometric containment: 10 / 6 / 6 / 6;
- 88 node ports and 16 section ports, exactly four per owner;
- all six Section 2 nodes and its complete boundary lie inside Section 1;
- zero node–node and road–node overlaps;
- each section boundary is crossed by exactly its four gate roads;
- exact scene equality on repeated builds;
- 138 roads, 134 junctions, 412 lanes; 1,033 lane connections pass the existing travel validator;
- zero uncovered or multiply-owned road area;
- browser overview, section focus, and Show roads toggle inspected;
- `pnpm check`: typecheck, lint, formatting, architecture, 208 existing tests passed. No new test files.

Browser User Timing, one development navigation (milliseconds, not a statistical benchmark):

| Process | ms |
|---|---:|
| Capacity / recursive sizing | <0.1 |
| Node / section placement | 0.1 |
| Owner port locations | <0.1 |
| Main road construction | 0.2 |
| Driveways / gates | 0.2 |
| Lane / junction network compilation | 5.9 |
| Complete layout | 6.5 |
| Diagnostic coverage audit | 54.5 |
| Render request → fonts and two animation frames | 128.4 |
| Navigation → ready | 379.2 |

Frame readiness is not a GPU paint-duration measurement. Core timings vary between runs. The coverage audit remains more expensive than layout. No computation reduction claim is made.

Artifacts: `output/playwright/nested/scene.json`, `metrics.json`, `geometry-audit.json`, `overview-roads.png`, `overview-clean.png`, `section-1-clean.png`, `section-2-roads.png`.

## Source review and practical limits

- `prototype-nested-placement.ts`: `sizeSection` reserves child capacity before placement; `gridNodes` reads the node-owned footprint; `positionSection` is the sole coordinate writer. Stable input order determines output order. Local cursors are confined to one call.
- `prototype-nested-roads.ts`: `frame` and `internalStreets` own road rectangles; `mergeSpan` removes duplicate collinear corridors; `nodeDrive` / `sectionDrive` use owner port positions. No renderer behavior enters Layout.
- `prototype-nested-scene.ts`: six measured stages are explicitly sequenced; no placement stage reads road-network output. Measurement callbacks belong to the caller; browser startup failures are handled by `main` in `apps/web/cli/roads-prototype.ts`.
- Layout contract exports are explicit and additive. The host selects the new builder through the public contract. Canvas consumes finished bounds, adds section-focus navigation without requiring proof-catalog generation, and retains prior fixture initial-selection behavior.

Worst remaining limitations: this is a bounded creation fixture, not integration into production diagram creation; fixed corridor widths do not yet respond to wire demand; the existing network compiler still uses pairwise road intersection discovery. No new end-to-end wires are demonstrated in this milestone. Roadless views retain considerable clearance reserved for future routing, so this diagnostic fixture does not claim the production visual reference's compactness/imagery bar.
