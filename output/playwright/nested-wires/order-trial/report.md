# Order trial — templates scene node reordering (Track C)

Date: 2026-09-17. Branch `feat/order-trial` at b14ea8b. Scene: templates (`?templates`, 16 nodes / 9 sections / 29 wires). No layout, routing or renderer source changed; everything here is new files under `output/playwright/nested-wires/order-trial/`.

## What was tested

Chris's question: does re-ordering nodes inside each section — main import/export hub (`index.ts`) top-left, then descending connectivity to already-placed nodes — improve the diagram, before anyone builds an automatic ordering rule?

The spec `nodes` array order **is** the placement-order field: `gridNodes` in `capability/layout/core/prototype-nested-placement.ts` lays a section's nodes row-major from the interior top-left in exactly spec order (`columns = ceil(sqrt(count))`). Reordering that array is a faithful "human dragged nodes into this order" simulation.

## Deliverable 1 — replica

`set-node-order.mts` takes a scene spec JSON plus an ordering map (section id → ordered node-id list), validates each listed section is an exact permutation (nothing added/dropped), rewrites only the `nodes` array order, and rebuilds twice through the real builder (`createNestedRoadScene`, the same public contract called by `apps/web/cli/templates-scene.ts`), asserting byte-identical output.

```bash
node --import tsx output/playwright/nested-wires/order-trial/set-node-order.mts \
  --spec  output/playwright/nested-wires/templates-scene/scene-spec.json \
  --order output/playwright/nested-wires/order-trial/variant-a-order.json \
  --out   output/playwright/nested-wires/order-trial/variant-a
```

Order-map keys accept `section-N` or `N`; entries accept node numbers, `node-N`, or labels (resolved within the named section). Unlisted sections keep their order. Requests and wire metadata are never touched (verified: requests/wires/node-sets byte-identical between baseline and variant specs). Determinism assertion printed `byte-identical two builds: true (770866 bytes)`; the rebuilt `variant-a/scene.json` is byte-identical to the invariant suite's own rebuild of the same spec.

## Variant A ordering (derived by `derive-variant-a-order.mts`)

Hub = `index.ts` if present, else highest in+out-degree node (ties → lowest node number); then greedy: next node = highest request count (both directions, multiplicity) to already-placed nodes, ties → lowest node number.

| Section | Baseline order | Variant A order | Changed |
| --- | --- | --- | :-: |
| section-1 contract | api, brands, compose, errors, index, types | **index, api, compose, brands, errors, types** | yes |
| section-2 contract/ports | codecs, identity | codecs, identity | no |
| section-3 contract/records | failure-source, preset | **preset, failure-source** | yes |
| section-5/6/7 (core sub) | plan / select / instantiate | unchanged (single node) | no |
| section-8 core/validation | catalog, outcomes | catalog, outcomes | no (catalog already highest degree) |
| section-9 adapters | identity | unchanged | no |

Only sections 1 and 3 change. Section 4 (core) has no direct nodes.

## Metrics (measured identically on both rebuilt scenes)

Wire length = Σ |Δx|+|Δy| over all segments; bends = direction changes per wire; per-section = segment length attributed to the smallest section containing the segment midpoint (same `owner()` rule the invariant suite uses for crossings). Crossings/certification from the unchanged `verify-templates-scene.mjs`. Scripts: `measure-scene.mjs`; data: `{baseline,variant-a}/metrics.json`, `invariant-output.txt`.

### Totals

| Metric | Baseline | Variant A | Δ |
| --- | ---: | ---: | ---: |
| Total wire length | 100,846 | 104,124 | **+3,278 (+3.25%)** |
| Bends | 441 | 459 | **+18** |
| Segments | 652 | 670 | +18 |
| Crossings (total) | 130 | 139 | **+9** |
| Certified / uncertified crossings | 130 / 0 | 139 / 0 | +9 / 0 |
| Positive-length overlaps | 0 | 0 | 0 |

### Crossings by owner

| Region | Baseline | Variant A | Δ |
| --- | ---: | ---: | ---: |
| world | 76 | 69 | **−7** |
| section-1 contract | 12 | 29 | **+17** |
| section-4 core | 36 | 36 | 0 |
| section-8 core/validation | 6 | 5 | −1 |
| sections 2,3,5,6,7,9 | 0 | 0 | 0 |

### Per-section wire length

| Region | Baseline | Variant A | Δ |
| --- | ---: | ---: | ---: |
| world | 38,884 | 38,812 | −72 |
| section-1 contract | 22,784 | 26,188 | **+3,404** |
| section-2 contract/ports | 0 | 0 | 0 |
| section-3 contract/records | 1,342 | 1,300 | −42 |
| section-4 core | 29,968 | 29,968 | 0 |
| section-5 core/admission | 1,019 | 1,019 | 0 |
| section-6 core/discovery | 656 | 656 | 0 |
| section-7 core/expansion | 584 | 584 | 0 |
| section-8 core/validation | 5,070 | 5,058 | −12 |
| section-9 adapters | 539 | 539 | 0 |

### Per-wire (changed wires only; full table in `*/metrics.json`)

| Wire | Endpoints (node numbers) | Δ length | Δ bends |
| --- | --- | ---: | ---: |
| w08 | 4→6 (compose→index) | +966 | +7 |
| w03 | 2→6 (api→index) | +705 | +10 |
| w05 | 3→6 (brands→index) | +665 | +2 |
| w25 | 16→2 | +643 | +1 |
| w21 | 15→2 | +631 | +1 |
| w20 | 14→2 | +619 | +1 |
| w19 | 13→2 | +607 | +1 |
| w18 | 12→2 | +595 | 0 |
| w06 | 3→10 (brands→preset) | +562 | −1 |
| w04 | 3→1 | +86 | −1 |
| w07 | 3→15 | +62 | −2 |
| w15 | 10→2 | −261 | 0 |
| w09 | 5→1 (errors→adapters/identity) | −330 | +1 |
| w13 | 5→15 | −330 | +1 |
| w10 / w11 / w12 / w14 | 5→12 / 5→13 / 5→14 / 5→16 | −336 each | +2/+2/+2/0 |
| w02 | 2→4 (api→compose) | **−598** | −7 |

Unchanged: w01, w16, w17, w22, w23, w24, w26, w27, w28, w29 (10 wires).

## Screenshots (1920×1440, headless Chrome 153.0.8010.48, server 127.0.0.1:5192)

| Scene | Roads off | Roads on |
| --- | --- | --- |
| Baseline | [baseline/baseline-roads-off.png](baseline/baseline-roads-off.png) | [baseline/baseline-roads-on.png](baseline/baseline-roads-on.png) |
| Variant A | [variant-a/variant-a-roads-off.png](variant-a/variant-a-roads-off.png) | [variant-a/variant-a-roads-on.png](variant-a/variant-a-roads-on.png) |

Both runs: 16 node labels / 29 wires rendered, `layoutRecalcCount = 1`, zero page errors, all nodes inside the fitted viewport (`browser.json` in each directory). Variant rendering uses a Playwright route interception of the vite-served `scene-spec.json` module (fulfilled with the variant spec) — no repository file is modified for the capture; the interception lives only in `capture.mjs`. Page footer changed from "625 inspectable areas" (baseline) to "623" (variant).

### Road-coverage audit (browser footer diagnostic; `audit-coverage.mjs` reruns it offline)

| Scene | roadArea px² | uncoveredArea | multiplyOwnedArea | outsideRoadArea | Footer |
| --- | ---: | ---: | ---: | ---: | --- |
| Baseline | 3,074,472 | 0 | 0 | 0 | "100% road area accounted for" |
| Variant A | 3,330,128 (+8.3%) | 0 | **1,240** | 0 | "Road coverage needs correction" |

Variant A's reordered placement produces 1,240 px² of multiply-owned road area (overlapping road rectangles), which trips the prototype's coverage footer. This diagnostic is not part of `verify-templates-scene.mjs`; the invariant suite itself passes fully on the variant.

## Invariants

`verify-templates-scene.mjs` run against both specs (config `{"directory": "<run dir>"}`; variant additionally passes `expectedShape` matching its intended per-directory file order — the check pins semantic content, so the reordered order is declared, not weakened):

- **Baseline:** all checks PASS — 16 nodes/9 sections containment, deterministic double build, 29/29 wires routed, zero corridor/boundary/continuity failures, zero overlaps, exact pin rows, distinct lanes, junction-only turns, **CROSSINGS {world 76, s1 12, s4 36, s8 6}, CERTIFICATION 130 certified / 0 uncertified**, exact directory tree. Byte-identical to the canonical committed `templates-scene/scene.json`.
- **Variant A:** all checks PASS with the same suite — zero overlaps, zero uncertified, **CROSSINGS {world 69, s1 29, s4 36, s8 5}, CERTIFICATION 139 certified / 0 uncertified**. No invariant was broken; the reorder produces a fully legal layout.

## Verdict (numbers only)

**Variant A worsens the totals: wire length +3,278 (+3.25%), bends +18, crossings +9 (130→139)** — with every crossing still certified and overlaps still zero. The deltas are regionally mixed: world crossings −7 and world wire length −72 (plus small section-3/section-8 reductions), but contract (section-1) crossings more than double (12→29) and contract wire length grows +3,404, which dominates. Putting `index.ts` top-left lengthens its three contract-internal inbound wires (w03/w05/w08, +2,336 combined) and the five core-section wires into api.ts (w18–w21, w25, +3,095 combined), while errors.ts's five outbound wires to core shorten (−1,674 combined) and api↔compose (w02) shortens −598. Net: this greedy hub-first order does not improve the measured diagram on this scene.

## Divergences from the brief

1. The brief described the templates scene as "6 sections … service, web, cli"; the actual committed spec has 9 sections (contract + ports/records children, core + 4 children, adapters). I followed the real spec.
2. No existing wire-length tool covers the templates scene (`verify-oracle.py` targets the default 24-node scene against a git baseline), so lengths/bends are computed by the committed `measure-scene.mjs` with the definitions above; crossing/certification numbers come unchanged from the existing invariant suite.
3. The variant's invariant run declares its reordered file order via the suite's existing `expectedShape` config option (otherwise the "exact directory tree" check would pin the baseline order); all other checks run unmodified.
4. Screenshots use in-browser request interception rather than swapping the committed spec file, keeping the working tree limited to `order-trial/`.

## Typecheck

- `pnpm exec tsc --noEmit` (repo-wide; the repo has no `apps/web` tsconfig — root tsconfig covers `capability/**` + `apps/**`): **exit 0**.
- Targeted strict check of the new scripts (they live outside the root include set): `tsc --ignoreConfig --noEmit --strict --exactOptionalPropertyTypes --noUncheckedIndexedAccess --module nodenext --moduleResolution nodenext --target es2023 --jsx react-jsx --allowImportingTsExtensions --types node set-node-order.mts derive-variant-a-order.mts`: **exit 0**.
