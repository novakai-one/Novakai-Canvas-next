# M10f-1 — junction-mediated connector ownership

Amendment 1's candidate achieves the narrow corridor milestone: **4 → 2 exactly**. Only **w41:16/17 `corridorId`** changes, from `section-14:horizontal:1792:6208` to the incoming street **`section-14:vertical:6208:1552`**, registered at containing junction **J280**. Coordinates, lane IDs and every other serialized real-scene field match committed M10b `1ff0be8`. The scene is **not legal**. This report supersedes the historical Run 1 `stop-report.md`, whose rejected containment-only candidate is recorded for provenance.

## Binary acceptance evidence

| Gate | Result / receipt |
| --- | --- |
| Real authoring rebuilt twice, deterministic | PASS: `verify.mjs after`, `after.json`; all five scenes independently built twice and serialized bytes compared. Final scene verification repeated after strengthening the corrected-owner assertion to require a street. |
| Corridor improvement and unchanged failures | PASS: corridors exactly w03:5/w23:5; node-body **40**, boundary **87**, continuity **0**, exact inspection arrays unchanged apart from the two corrected corridors. |
| Overlap and proof catalogs | PASS: entire **18-entry** overlap catalog and proof output byte-equivalent to committed M10b; **1,273** uncovered contacts remain. Existing proof abort remains `J17/J145 proof regions overlap`. |
| Geometry and diff scope | PASS: serialized scene with only segment `corridorId` fields omitted equals committed M10b; only two corridor fields differ, and both changed segments have no laneId. No road, junction, node, port, wire order, coordinate, lane ID or lane record changed. |
| Default / templates / scale preservation | PASS: entire scene serialization equals archived pre-change bytes. Hub also passes as an additional retained control. Archived `*-baseline.json.gz` are lossless copies of Run 1's pre-change rebuilds; no fixture content was edited. |
| General rule / negative control | PASS: membership-first candidate derivation, complete junction and road containment, street priority; `source-review.md` traces the rule and templates negative control. No hard-coded identities in product source. |
| Operation counts | PASS under the brief's **equal or justified** criterion: routing/discovery unchanged; compile increase confined entirely to ownership checks in lane projection. Exact costs and limitations below. |
| Repository gate | PASS: `pnpm check` exit **0**, **70 files / 208 tests**, typecheck, lint (Sonar ≤2), formatting and architecture. Receipt: `pnpm-check.txt`. |
| Product source review | PASS: projection **150/160** (diff-scope), scene assembly **153/160** (whole-file); all sixteen scores and deductions in `source-review.md`. |
| Headless rendered regression | PASS: before/after PNGs byte-identical for default, templates, scale, authoring overview and authoring Section 14 detail when both versions are built in Chromium. `browser-render-identity.json`; no page errors. Only port **5198** used. |
| Delivery | Product diff: **75 additions / 10 deletions**, two files. New audit runner is 120 lines, keeping total added/removed executable source below 300 lines. Commit/push target `feat/m10f-ownership`; PR base `feat/m10b-dogfood`. Git/GitHub receipts supplied with delivery. |

Real scene SHA-256 after: `58bdd5a97a1e235973743680999abc4718ed5c975d5a9ee536b1e98175dcd9e0`. Full scene and geometry/catalog hashes are printed in `before.json` and `after.json`.

## Operations — before and after

**Recorded real-scene ruling-#10 baseline: routing 6,140 / compile 103,171 / discovery 0.** After: **routing 6,140 / compile 280,075 / discovery 0**.

| Scene | Routing before → after | Compile before → after | Compile increase | Discovery before → after |
| --- | ---: | ---: | ---: | ---: |
| default | 667 → 667 | 16,018 → 33,313 | +17,295 | 0 → 0 |
| hub (extra control) | 992 → 992 | 19,768 → 48,070 | +28,302 | 0 → 0 |
| templates | 1,626 → 1,626 | 28,443 → 74,724 | +46,281 | 0 → 0 |
| scale | 2,088 → 2,088 | 43,876 → 104,617 | +60,741 | 0 → 0 |
| authoring | **6,140 → 6,140** | **103,171 → 280,075** | **+176,904** | **0 → 0** |

Receipts: `*-operations-before.json` and `*-operations-after.json`, using the unchanged retained AST meter. It counts executed numeric addition/subtraction, comparisons, Math.abs, min/max comparisons; it excludes multiplication/division, string comparisons, map lookups and native collection internals. These are operation counts, not elapsed time.

**Justification and cost:** the old projector emits each chosen owner without validating connector ownership. The new projector indexes registered junction membership once, then checks the preferred road's registered junction bounds and adjacent candidate-road bounds for each connector call. All numeric changes occur in `lane-projection`: authoring **25,450 → 202,354**. Wire registry **2,183**, lane allocation **49,366**, network **26,172** and routing **6,140** remain exact. No topology rebuild, road-pair discovery, rerouting, geometric move or retry was added. The real compile increase is material (**2.71×**, about **+171%**), not an equal-cost result.

This implementation is indexed by road, but it does **not** establish a universal constant-per-piece bound. Work depends on local registered-junction incidence and membership lists (including temporary lists and repeated preferred-owner containment). Maximum junctions per road are 8 / 12 / 12 / 19 for default/templates/scale/authoring; maximum road memberships per junction are 3 / 3 / 3 / 5. Thus the spike's O(segments) constant-per-piece estimate is only a bounded-local-degree characterization, not a proved arbitrary-scene complexity guarantee. No performance optimization or acceptance threshold was invented in this milestone.

The existing fresh-ID doubled-scene meter passes for every scene: total-operation growth **2.014 / 2.024 / 2.038 / 2.024 / 2.039** (default/hub/templates/scale/authoring), under its unchanged ≤2.5 gate. Instrumented scenes equal the normal builder bytes, every measured stage executes once, and existing routing leg/whole-wire ceilings pass. These observations justify the measured additional ownership validation on the retained workloads; they do not prove performance for arbitrary growing junction degree.

## Visual review and runtime limitation

Read the visual SOP, `References.md` and diagram-quality benchmark gates, and inspected the approved AWS reference alongside the actual headless authoring/templates renders and Section 14 reading detail. Existing nested boundaries and aligned actors are retained. Existing visual gaps remain: fit overview hides node text at its low zoom; wire bundles cross the Section 14 input/plain-data boxes; routes remain dense and weakly differentiated. The known overlaps/crossings violate the broader polished-diagram bar. This metadata-only milestone makes **no visual improvement, full benchmark acceptance, export-quality or legality claim**; the brief explicitly retains those defects. Approved reference images were not modified. The authoring app entry remains dark; the inspection harness was temporary and used the actual public React renderer.

An initial mixed-runtime comparison rendered Node's frozen M10b snapshots against new Chromium rebuilds. Scale and authoring differed in some wire coordinates. A read-only replay of the **pinned M10b builder in the same Chromium** establishes that this divergence is pre-existing: baseline and candidate browser geometries are identical, and retained browser scenes are byte-identical. Example: authoring w07's row is y=1365 in the frozen Node baseline but y=1359 in **both** M10b and candidate Chromium builds. Root cause was not diagnosed or repaired. `browser-baseline-diagnostic.json` and `cross-runtime-render-identity.json` preserve this limitation; the corrected same-runtime rendered comparisons are all byte-identical. The committed-M10b geometry gate is asserted by the Node rebuild, not by a claim of cross-runtime determinism.

## NOT fixed in this milestone

- Node-body violations: **40**.
- Boundary violations: **87**.
- Uncertified contacts: **1,273** (proof still aborts).
- Overlap reports: **18**, entire catalog retained.
- Reversed assigned segments: **28**.
- Missing owned gate traversals: **96**.
- Remaining corridor violations: **2**, diagonal w03:5 and w23:5.
- Pre-existing Node/Chromium rebuild divergence for scale and authoring.

Continuity remains **0**. No fixture tuning, geometry repair or scene-legal declaration occurred.

## Reproduction and mechanical correction record

```sh
pnpm install
node --import tsx output/playwright/nested-wires/ownership/verify.mjs after
pnpm check
```

The verifier reads compressed pre-change scene evidence and committed M10b authoring data; it creates ignored `.local/m10f-ownership/*-spec.json` files for the meter. For each of default/hub/templates/scale/authoring, run the unchanged meter with the corresponding JSON argument, e.g.:

```sh
node --import tsx output/playwright/nested-wires/templates-scene/count-operations.mjs '{"directory":"output/playwright/nested-wires/ownership","specFile":".local/m10f-ownership/authoring-spec.json","outputFile":"authoring-operations-after.json"}'
```

`pnpm install` was the first environment-changing command. The original candidate was resumed; no baseline reset or alternate worktree was used. The first full product check passed. A later full check picked up scratch browser harness lint issues (unused expression, complexity, generated-bundle unused variable, temporary non-null assertion). Under the explicit mechanical allowance, the completed temporary harness/generated bundle were removed from the source scan; no lint rule, test, fixture, production behavior or acceptance assertion was relaxed. The final full check passed. Failed mechanical receipt: `mechanical-check-fallout.txt`.

No subagents, visible browser windows, external messages, or protected-port access. The only server was this worktree's Vite process on 5198; browser and server were stopped after capture.
