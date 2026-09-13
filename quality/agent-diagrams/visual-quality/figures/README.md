# Parametric figures — zero-hand-art proof

Claim: the water-treatment infographic renders completely from declared parametric figures; no hand-authored artwork, no asset bindings, no coordinates.

| Step | Observed result | Evidence |
| --- | --- | --- |
| Author DSL with `figure` blocks only (`screen`, `vessel`, `layered-bed`, `gauge`) | Collection admitted and committed through the real CLI/service path (workspace sequence 3) | [DSL source](../../../../resources/examples/showcase/story-water-treatment-figures.canvas) |
| Re-encode real SVG and PNG from the admitted scene | SVG 176854 bytes; PNG rendered bytes differ from SVG digest; six distinct `figure:` digests present, zero `asset:` media | [SVG](story-water-treatment.svg), [PNG](story-water-treatment.png), [SVG sidecar](story-water-treatment.svg.json), [PNG sidecar](story-water-treatment.png.json) |
| Compare against the hand-authored stage-5 final | Same panels, story order, numbered wires, dashed monitoring wires, role cards and captions; illustrations are parametric, not bespoke | [Stage-5 final](../stage-5/final/story-water-treatment.png) |

Method: local service on loopback (fresh workspace, studio theme admitted via `canvas theme admit`), `canvas create` for admission, `.local/export-figures.mjs` (same contract-only re-admission pattern as `.local/export-current.mjs`) for encoding.

Limitations: parametric artwork is schematic; hand-authored asset libraries remain the admitted path for literal per-domain art. Figure palette derives from theme roles (`primary` accent, `success` marks, `neutral` tint) with neutral fallbacks; themes without those roles render in neutral inks.
