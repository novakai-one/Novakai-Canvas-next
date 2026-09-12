# Candidate file scope and estimates

Baseline `38ea827`. Physical LOC, including comments/blanks. Churn = added/deleted lines during stage; final includes earlier estimated stage edits. Not frozen targets or auditor mandates. Tests are governed by Doc5; candidates can consolidate into existing public-contract suites.

| File | Current LOC | Estimated churn | Estimated final LOC | Purpose |
| --- | ---: | ---: | ---: | --- |
| `capability/model/contract/records/composition.ts` | 0 | +70 / −0 | 70 | New closed presentation-intent vocabulary; no coordinates or arbitrary CSS. |
| `capability/model/contract/records/object.ts` | 43 | +8 / −2 | 49 | Canonical presentation defaults. |
| `capability/model/contract/records/section.ts` | 136 | +15 / −3 | 148 | View and container appearance overrides. |
| `capability/model/contract/records/content.ts` | 134 | +12 / −4 | 142 | Semantic text role / caption intent, retaining content identities. |
| `capability/model/contract/index.ts` | 42 | +8 / −0 | 50 | Explicit curated public names only. |
| `capability/model/tests/composition.test.ts` | 0 | +110 / −0 | 110 | Valid/invalid intent and inheritance contract examples. |
| `capability/language/core/vocabulary/properties.ts` | 103 | +20 / −2 | 121 | Closed intent and text-role vocabulary. |
| `capability/language/core/vocabulary/constructs.ts` | 281 | +22 / −8 | 295 | Allow intents only on appropriate constructs. |
| `capability/language/core/vocabulary/patch-properties.ts` | 60 | +14 / −4 | 70 | Editing has the same surface as creation. |
| `capability/language/core/lowering/content.ts` | 67 | +18 / −6 | 79 | Preserve canonical composition fields. |
| `capability/language/core/lowering/views.ts` | 98 | +18 / −6 | 110 | Lower view/container overrides. |
| `capability/language/core/printing/content.ts` | 34 | +14 / −4 | 44 | Readable lossless authoring output. |
| `capability/language/core/printing/views.ts` | 50 | +14 / −4 | 60 | Round-trip view/container intents. |
| `capability/language/tests/composition.test.ts` | 0 | +140 / −0 | 140 | Create/read/patch round trips and unsupported-value diagnostics. |
| `capability/presentation/contract/records/style.ts` | 105 | +25 / −5 | 125 | Token-derived figure and caption metrics. |
| `capability/presentation/contract/records/visual.ts` | 187 | +35 / −6 | 216 | Explicit frame and content primitives; measured bounds. |
| `capability/presentation/contract/records/interchange.ts` | 83 | +14 / −2 | 95 | Serialized projection retains new measured fields. |
| `capability/presentation/contract/records/content-context.ts` | 20 | +8 / −2 | 26 | Pass resolved composition policy to measurement. |
| `capability/presentation/contract/index.ts` | 72 | +8 / −0 | 80 | Expose only required public types. |
| `capability/presentation/core/projection/node.ts` | 316 | +35 / −90 | 261 | Extract frame/body policy rather than grow the existing projector. |
| `capability/presentation/core/projection/section.ts` | 76 | +15 / −3 | 88 | Project title and container appearance. |
| `capability/presentation/core/content/composition.ts` | 0 | +120 / −0 | 120 | New pure horizontal/vertical arrangement of measured content. |
| `capability/presentation/core/content/frames.ts` | 0 | +90 / −0 | 90 | New pure frame/header/caption geometry policy. |
| `capability/presentation/core/content/blocks.ts` | 97 | +15 / −4 | 108 | Dispatch semantic text and composition policies. |
| `capability/presentation/core/content/media.ts` | 62 | +35 / −12 | 85 | Large figures and intrinsic aspect ratio, separate from icon sizing. |
| `capability/presentation/core/content/sizing.ts` | 52 | +30 / −10 | 72 | Measure arranged content before node width/height are fixed. |
| `capability/presentation/adapters/react/NodeContent.tsx` | 167 | +40 / −35 | 172 | Consume measured frames; no unconditional card or renderer reflow. |
| `capability/presentation/adapters/react/ContentBlocks.tsx` | 78 | +25 / −5 | 98 | Paint admitted measured primitives. |
| `capability/presentation/tests/composition.test.ts` | 0 | +170 / −0 | 170 | Bounds, captions, aspect ratios, content growth and mixed arrangements. |
| `capability/presentation/tests/rendering.test.ts` | 146 | +60 / −8 | 198 | Canvas slot and static renderer agree on primitives and pinned fonts. |
| `capability/design-system/contract/records/theme.ts` | 76 | +24 / −4 | 96 | Named figure/caption/frame style projection. |
| `capability/design-system/core/themes/diagram.ts` | 187 | +30 / −8 | 209 | Resolve new metrics from existing token authority. |
| `capability/design-system/tokens/definitions.tokens.json` | 486 | +60 / −10 | 536 | Small root controls and derived diagram metrics. |
| `capability/design-system/tokens/semantics.tokens.json` | 558 | +35 / −8 | 585 | Semantic aliases for visual hierarchy. |
| `capability/design-system/tokens/themes/paper.theme.json` | 6 | +8 / −2 | 12 | Theme defaults through roots. |
| `capability/design-system/tokens/themes/ink.theme.json` | 107 | +8 / −2 | 113 | Alternative theme through roots. |
| `capability/design-system/contract/generated/token-names.ts` | 114 | +14 / −0 | 128 | Regenerated, not hand edited. |
| `capability/design-system/adapters/styles/tokens.generated.css` | 68 | +10 / −2 | 76 | Regenerated token variables. |
| `capability/design-system/adapters/styles/semantics.generated.css` | 53 | +8 / −2 | 59 | Regenerated semantic variables. |
| `capability/design-system/adapters/styles/themes.generated.css` | 229 | +16 / −4 | 241 | Regenerated theme variables. |
| `capability/design-system/tests/themes.test.ts` | 179 | +65 / −5 | 239 | Admitted metrics and shared canvas/export projections. |
| `capability/canvas/adapters/react-flow/SectionFrame.tsx` | 33 | +14 / −5 | 42 | Use projected container treatment on real React Flow node. |
| `capability/canvas/adapters/react-flow/SectionFrame.module.css` | 12 | +8 / −2 | 18 | Token-only container styles; measured geometry stays in scene. |
| `capability/canvas/tests/react-bindings.test.tsx` | 249 | +35 / −5 | 279 | Framed/frame-free rendering retains node identity and interaction bindings. |
| `capability/export/adapters/svg/scene.tsx` | 78 | +18 / −6 | 90 | Consume the same section treatment as Canvas. |
| `capability/export/tests/composition.test.ts` | 0 | +100 / −0 | 100 | Real SVG encoding retains scene bounds, pinned fonts and figures. |
| `resources/atlas.theme` | 5 | +10 / −2 | 13 | Portable theme DSL; a few roots rather than per-object paint. |
| `resources/examples/showcase/story-water-treatment.canvas` | 19 | +25 / −10 | 135 | Apply the admitted figure/composition semantics. |
| `resources/examples/showcase/modules-document-publishing.canvas` | 29 | +20 / −8 | 122 | Transfer figure/container semantics to engineering. |
| `resources/examples/showcase/grid-research-methods.canvas` | 42 | +100 / −42 | 100 | Structured comparison with figure/caption hierarchy. |
