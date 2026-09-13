# Parametric figures — zero-hand-art proof

Claim: showcase infographics render completely from declared parametric figures; no hand-authored artwork, no asset bindings, no coordinates.

| Step | Observed result | Evidence |
| --- | --- | --- |
| Author water-treatment DSL with `figure` blocks only (`screen`, `vessel`, `layered-bed`, `gauge`) | Collection admitted and committed through the real CLI/service path | [DSL source](../../../../resources/examples/showcase/story-water-treatment-figures.canvas) |
| Re-encode real SVG and PNG from the admitted scene | Six distinct `figure:` digests present, zero `asset:` media; same panels, story order, wires and cards as the hand-art stage-5 final | [SVG](story-water-treatment.svg), [PNG](story-water-treatment.png) |
| Author context-engineering DSL with the extended vocabulary (`gate`, `stack`, `window`, `gauge`) | Admitted and committed at workspace sequence 4; group-title anchor corrected at sequence 5 | [DSL source](../../../../resources/examples/showcase/story-context-engineering.canvas) |
| Re-encode real SVG and PNG | Five figure forms render themed (primary accent, success, neutral tint); numbered flow and dashed failure references intact | [SVG](story-context-engineering.svg), [PNG](story-context-engineering.png) |
| Open both collections in the real browser canvas | Figures render as ordinary media primitives; browser independently admits the new block kinds | Browser proof at `?collection=story-context-engineering` |
| Author image-supply teaching collection (3 sections: story, story, grid on one canvas) | Admitted at sequence 6; trap-wire retarget and section-title wrap corrected at sequence 7 | [DSL source](../../../../resources/examples/showcase/story-image-supply.canvas) |
| Re-encode the teaching collection | Three scenes render side by side: preference cascade, one-form-many-scenes computability demo, cost-curve comparison | [PNG](story-image-supply.png), [SVG](story-image-supply.svg) |

Method: local service on loopback (clean proof workspace, studio theme admitted via `canvas theme admit`), `canvas create/replace` for admission, `.local/export-ctx.mjs` (same contract-only re-admission pattern as `.local/export-current.mjs`) for encoding.

Limitations: parametric artwork is schematic; hand-authored asset libraries remain the admitted path for literal per-domain art. Figure palette derives from theme roles (`primary` accent, `success` marks, `neutral` tint) with neutral fallbacks; themes without those roles render in neutral inks.

## Polish pass (presentation-5, 2026-09-13)

Target references (review material, retained at `quality/agent-diagrams/references/target/`): ByteByteGo system-design cheat sheet and design-patterns cheat sheet. Plan and audited scope: [polish-plan.md](polish-plan.md). Changes: per-role tinted fills via one design-system definition release (`rolefill.*` roots, warning/decision hue split, ink dark-scope overrides), strong heading face (Inter Tight 700 pinned as `font.strong`; heading typography roles pin it end to end), figure band chroma raised to a 3:1-floor strength, showcase DSLs re-tiled (principles boxes, legend/records cards, small figures in warning cards).

Contrast evidence (studio scope, WCAG relative-luminance ratios; figure bands composited over their white compartment ground):

| Pair | Ratio | Floor | Pass |
| --- | --- | --- | --- |
| decision text / fill | 13.63 | 4.5 | yes |
| success text / fill | 13.03 | 4.5 | yes |
| warning text / fill | 11.95 | 4.5 | yes |
| supporting text / fill | 5.28 | 4.5 | yes |
| neutral text / fill | 14.62 | 4.5 | yes |
| decision stroke / fill | 5.62 | 3.0 | yes |
| success stroke / fill | 5.58 | 3.0 | yes |
| warning stroke / fill | 4.82 | 3.0 | yes |
| supporting stroke / fill | 5.28 | 3.0 | yes |
| neutral stroke / fill | 5.71 | 3.0 | yes |
| liquid band accent@0.70 / ground | 3.28 | 3.0 | yes |
| charge+priority band accent@0.70 / ground | 3.28 | 3.0 | yes |
| strata amber band @0.70 / ground | 3.42 | 3.0 | yes |
| strata ink band @0.85 / ground | 10.19 | 3.0 | yes |
| strata grey separator @0.65 / ground | 1.42 | n/a (separator between stronger bands; outlines carry structure) | noted |

Hierarchy evidence (exported SVG, story-context-engineering): section heading 41.6px = 2.6× body (floor 2×), node heading 21.6px = 1.35× body (floor 1.3×); 17 heading runs pin the Inter Tight digest, distinct from 33 body runs.

Regression evidence: `er-museum-loans`, `modules-document-publishing`, `sequence-payment-settlement` re-exported after the release; no clipped or overlapping text; layout deltas trace to heading font metrics only.

Deferred trigger (M5, inline emphasis spans): evaluated at 100% crop against reference 1 — a majority of section descriptions would read better with ≥1 emphasized keyword, so the trigger FIRES. M5 is its own pre-registered slice (language grammar → model → presentation per-span measurement → both renderers, with version bumps and a second scene invalidation) and is not started here; the emphasis marker syntax is a DSL-surface decision for the owner.
