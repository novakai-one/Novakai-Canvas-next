# Stage 2 — one A1 / one A2, one verified fix round

Both agents were read-only, limited to eight minutes and five source targets. Neither launched a browser. No second audit requested.

| Auditor | Classification | Finding | Verification and disposition |
| --- | --- | --- | --- |
| A1 | engineering violation | Transparent represented group measured before receiving parent; dark ancestor foreground lost. | Verified public projection probe: child parent `view:group:outer`, child text `#0f172a` on black instead of `#ffffff`. Parent now supplied before measurement; existing composition case asserts actual ancestor/foreground. |
| A1 | engineering violation | PNG accepted renderer plus unused five-method encoding service. Predates stage change. | Verified createPngEncoder uses only renderer. Narrowed accepted dependency to Pick<RenderDependencies, 'renderer'>; no call-site rewrite or new wrapper. |
| A1 | minor | Captures do not establish exact wire-paint agreement. | Valid evidence limitation; no cause established. Recorded for Stage 3 comparison, no speculative change to audited sources. |
| A2 | major build risk | No-clipping case could pass displaced media, negative anchors or lost rendered caption suffix. | Verified assertions checked semantic outline but not complete rendered caption/media rectangle. Added exact joined caption, media extents and both anchor coordinate bounds to existing case. No production clipping defect asserted. |
| A2 | major build risk | SVG case could pass arbitrarily displaced image. | Verified only width/height/URI were asserted. Added viewport-plus-image x/y agreement with admitted measured primitive. The suggested direct image x/y comparison was rejected after verification: image-local origin is intentionally zero inside its measured SVG viewport. The viewport dimensions are also asserted. |
| A2 | minor | DSL roundtrip had no independent initial appearance/caption expectation. | Verified self-equality alone was insufficient. Added literal expected view frame/composition and caption role. |

A2 third counterexample: fractional PNG oracle correctly rejects nearest-rounding height 1040; specified height is 1041. No issue found there. Four test cases remain; findings were addressed by extending their assertions, not adding an E2E or broader suite.

## A1 scores before fixes

P1–P16 use the original sixteen anchors. LSP 7 means not demonstrated, not a fake perfect score. These are five independently sampled source scores, not an audit of the whole repo.

| Target | P1–P16 | Total |
| --- | --- | ---: |
| model/core/objects/composition.ts | 10,6,7,10,10,10,10,10,10,10,10,10,10,10,10,10 | 153 |
| presentation/core/content/composition.ts | 10,6,7,10,10,10,10,10,10,10,10,10,10,10,10,10 | 153 |
| presentation/core/projection/node.ts | 10,6,7,10,9,9,9,10,10,10,10,10,10,10,10,10 | 150 |
| presentation/adapters/react/NodeContent.tsx | 10,6,7,10,10,9,10,10,8,10,10,10,10,10,10,10 | 150 |
| export/adapters/native/png.ts | 10,6,7,5,10,10,10,10,10,10,10,10,10,10,10,10 | 148 |

Evidence: Model named pure rules and typed diagnostic recovery; composition fixed private measurement pipeline with readonly geometry; projector fixed pipeline/raw IDs/repeated engineering-shape policy; renderer shared measured primitives and named host recovery; PNG typed failures/disposal but unused accepted service. Targeted Sonar ≤2 passed independently. After correction the PNG dependency deduction is removed; the projector retains conservative pre-fix score. No re-audit performed.
