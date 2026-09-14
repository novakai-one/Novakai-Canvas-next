# Stage 4 — A2 correctness audit

One read-only bounded audit; five test targets, six selected cases passed in 1.17 s; ten unrelated cases skipped. No edits, browser or full suite.

| Category | Finding | Evidence / disposition |
| --- | --- | --- |
| engineering violation | None found | Public projection, Layout and exported SVG assertions retain observable contracts. |
| major build risk | None found | Three attempted counterexamples below did not falsify assertions. |
| minor | Evidence wording | Tree fixture uses synthetic fixed-width measurements and real native engines. Presentation cases and actual authored exports use pinned real fonts. Recorded distinction; no test rewrite needed. |

Counterexamples: combined PK/FK overlaps or lost anchors; asymmetric endpoint swap or hidden kind under frame; sequence text inheriting foreground stroke. Assertions inspect extents/identity, all 16 endpoint pairs and 16 kind/frame combinations, and the nearest SVG stroke ancestor respectively. Uneven-tree case additionally checks increasing parent-depth geometry and independently labelled reference plus public inspection.

Targets: Presentation engineering-density, engineering-identity, changed projection assertions; Layout engineering-tree; Export native first case. No second audit.
