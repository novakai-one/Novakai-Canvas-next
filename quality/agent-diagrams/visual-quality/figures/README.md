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
