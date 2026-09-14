# Agent-authored visual quality — reviewed direction and file scope

Planning only. Baseline: `38ea827` (PR #24). No application code changed in this pass. One Kimi K3 headless review, configured thinking effort `max`, completed in 99.4 seconds. No second audit.

Build-spec status: the five template-based build documents plus file appendix for each stage now live in [visual-quality/README.md](visual-quality/README.md). This earlier directional plan remains estimation and review history; the stage contracts and current SOP govern implementation.

Review evidence: [Kimi report](../../quality/agent-diagrams/visual-plan-review/kimi-review.md), [verified dispositions](../../quality/agent-diagrams/visual-plan-review/verified-dispositions.md), [run metadata](../../quality/agent-diagrams/visual-plan-review/kimi-run.json).

## Outcome and scope

- Target: editable, agent-authored educational diagrams and engineering diagrams at the visual quality of the reference set. Images are assets inside diagrams; the diagram itself must not be a flattened image.
- Agent authors readable semantic DSL, never JSON coordinates. Theme tokens own paint and sizing; Layout owns positions and routing. Authoring remains the only write gate.
- Each showcase `.canvas` source stays at or below 300 physical lines, including comments and blank lines. Split at coherent diagram boundaries; do not split a required wire across collections or compress declarations to game the limit.
- Three original examples per family: story/infographic, comparison grid, ER, modules/interfaces/functions, flow/SOP, sequence, state, tree/mindmap. At least one collection mixes different diagram types if its readable source fits the limit; otherwise use separate collections. The manifest links collections without pretending to create cross-collection wires.
- Human panel redesign remains deferred. Native React Flow nodes/edges remain; shared measured SVG content inside them is valid. No renderer replacement or new routing package is planned.

## Six previous visual PRs: what they supplied

| PR | Achieved foundation | Remaining visual work |
| --- | --- | --- |
| #15 | Grid columns, nested groups, represented objects, checked DSL composition. | Those controls alone do not create rich in-node composition. |
| #16 | Pinned fonts, measurement, wrapping and sizing. | Stronger hierarchy and figure/caption arrangements. |
| #17 | Assets, theme roles and pinned resources. | Prominent pictorial actors instead of small icons in every card. |
| #18 | Nested placement, constraints and sequence spacing. | Composition appropriate to each explanatory structure. |
| #19 | Native routing, attachments, corridors and label placement. | Cleaner returns, dense branches and annotation-aware clearance. |
| #20 | 24 DSL examples, CLI/read/edit and browser/persistence evidence. | Current stories omit wires; breadth and numerical checks did not establish benchmark quality. |

## Two additional visual references

1. [ByteByteGo: How does Docker work?](https://bytebytego.com/guides/how-does-docker-work/) — [image](https://assets.bytebytego.com/diagrams/0414-how-does-docker-work.png). Target qualities: strong heading, colored bands, prominent figures, grouped contents and differentiated flows. Do not copy its subject, branding or legend treatment. Our meaningful wires still need explicit readable labels.
2. [AWS: Serverless Architecture for Global Applications](https://docs.aws.amazon.com/reference-architecture-diagrams/latest/serverless-global-applications/serverless-global-applications.html) — [image](https://docs.aws.amazon.com/images/reference-architecture-diagrams/latest/serverless-global-applications/images/serverless-global-applications.png). Target qualities: nested boundaries, compact typed actors, labeled orthogonal routes, numbered explanations and consistent dense alignment. It supplements, rather than replaces, the existing ER and module targets.

Both images were visually inspected in this planning pass. They are reference material, not bundled redistributable template assets. Retain existing infographic/module/ER targets as well.

## Responsibility and standing gates

| Owner | Responsibility in these stages |
| --- | --- |
| Model | Checked diagram meaning and closed presentation/annotation intent. No pixels, font measurement or routing policy. |
| Language | Readable syntax, lowering, printing and patches that preserve those intents. |
| Design System | Small root token set and derived theme metrics; no hardcoded paint in diagram renderers. |
| Presentation | Measure content/notation once, project geometry and render shared primitives. |
| Layout | Arrange measured nodes and groups; route and independently check connections/annotations. |
| Canvas | Render that scene as React Flow nodes and edges; preserve existing selection, drag and camera behavior. |
| Export | Encode the same measured scene and pinned resources. |
| Assets / Templates | Reuse admitted assets and existing preset mechanisms; change their internals only if an authored case proves a missing contract. |
| Authoring / Persistence / Library | Existing write, durability and collection boundaries remain; verification exercises them without speculative changes. |

- Before implementation, each stage follows the agreed bounded SOP: explicit specs → one scoped pressure test → verified fixes → build and DSL dogfood → two scoped auditors → verified fixes → PR. This Kimi pass reviews direction; it does not substitute for those specs or score unbuilt files.
- Changed first-party source must retain explicit types, useful TSDoc, readable names, closed vocabularies, curated contract entries, the approved Result protocol and import boundaries; Sonar cognitive complexity ≤2. Each source file requires evidenced >144/160, never a pre-awarded score. No invented 300-line TypeScript cap.
- Each general visual construct gets at least two appropriate diagram-family usages before its stage closes. Family-specific ER/sequence notation gets structurally distinct cases within that family; do not force meaningless cross-family usage.
- Measurement, rendered bounds, fonts and export agreement are checked as the relevant changes are built. Unit/contract tests establish correctness; visible browser inspection establishes visual experience. No new E2E tests.
- Story semantics must be visibly conveyed through relationships, grouping, alignment, hierarchy or comparison as appropriate. Process/dependency edges retain explicit labels; a grid comparison need not invent causal arrows.
- Final captures show unclipped figures/text/frames; labels remain attributable to their wires; cardinality/port anchors are correct; avoidable overlaps and detours are repaired. Crossing counts alone cannot approve or reject a diagram. Inspect overall composition at fit view and text/detail at a useful reading zoom.
- First full benchmark infographic is an explicit Stage 3 exit. Stage 1 is a truthful composition diagnostic, not a premature benchmark claim. Necessary generic work can move between Stages 2/3 without weakening the visual exit.

## Estimation rules

Physical lines include comments and blank lines, counted from actual files at the baseline. `0 — new` means a proposed path, not an existing implementation. Churn is added/deleted lines for this stage. Final is projected cumulative LOC after this stage, including earlier changes when a file recurs. Consequently Current + stage churn alone does not equal Final for repeated files.

These are midpoint planning allowances (roughly ±40–50%), not targets, restrictions or a promise to change every candidate. Confirm necessity with the authored proofs. Counts include focused tests and generated files where listed. CSS/token outputs are regenerated through the existing tool, never hand edited. Historical presets need not be migrated; new built-ins need regeneration only if their contract actually changes.

Independent stage time estimates include authoring and verification; total 38–66 active hours. Waiting for reviews or CI adds elapsed time. These replace the earlier coarse 25–45-hour estimate: the file map now explicitly includes create/read/edit consistency, boundary schemas and early export checks.

The tables cover expected TS/TSX/CSS/DSL/JSON changes. Stage specs, review records and original visual asset artwork are additional non-code deliverables. Budget approximately 8–16 reusable SVG assets across the proof subjects within the time ranges; do not import unlicensed reference artwork. Local persisted JSON/SQLite and exported artifacts are generated by the app, not agent-authored diagram source.

## Stage 1. Re-author connected proofs with the existing DSL

Three original subjects expose declared relationships: water treatment, research approval, and document publishing. Record the remaining visual gaps. This is a diagnostic proof, not a claim of benchmark completion.

Estimated active work: **3–5 h**.

| File (relative to repository root) | Current LOC | Estimated churn | Estimated final LOC | Purpose |
| --- | ---: | ---: | ---: | --- |
| `resources/examples/showcase/story-water-treatment.canvas` | 19 | +120 / −19 | 120 | Replace disconnected numbered cards with a connected illustrated process. |
| `resources/examples/showcase/flow-research-approval.canvas` | 32 | +100 / −32 | 100 | Branch, rejection and return flow; second-family reuse probe. |
| `resources/examples/showcase/modules-document-publishing.canvas` | 29 | +110 / −29 | 110 | Typed module relationships and subsystem boundaries as a control. |
| **Stage touched-file totals** | **80** | **+330 / −80** | **330** | Baseline and cumulative totals are for this stage's file set only. |

## Stage 2. Reusable measured composition and visual hierarchy

Closed, readable presentation intents support figures, captions, frame-free actors, callouts and horizontal/vertical content. Tokens control their visual hierarchy. Exercise each general construct in two applicable diagram families; compare real canvas and exported output now.

Estimated active work: **12–20 h**.

| File (relative to repository root) | Current LOC | Estimated churn | Estimated final LOC | Purpose |
| --- | ---: | ---: | ---: | --- |
| `capability/model/contract/records/composition.ts` | 0 — new | +70 / −0 | 70 | New closed presentation-intent vocabulary; no coordinates or arbitrary CSS. |
| `capability/model/contract/records/object.ts` | 43 | +8 / −2 | 49 | Canonical presentation defaults. |
| `capability/model/contract/records/section.ts` | 136 | +15 / −3 | 148 | View and container appearance overrides. |
| `capability/model/contract/records/content.ts` | 134 | +12 / −4 | 142 | Semantic text role / caption intent, retaining content identities. |
| `capability/model/contract/index.ts` | 42 | +8 / −0 | 50 | Explicit curated public names only. |
| `capability/model/tests/composition.test.ts` | 0 — new | +110 / −0 | 110 | Valid/invalid intent and inheritance contract examples. |
| `capability/language/core/vocabulary/properties.ts` | 103 | +20 / −2 | 121 | Closed intent and text-role vocabulary. |
| `capability/language/core/vocabulary/constructs.ts` | 281 | +22 / −8 | 295 | Allow intents only on appropriate constructs. |
| `capability/language/core/vocabulary/patch-properties.ts` | 60 | +14 / −4 | 70 | Editing has the same surface as creation. |
| `capability/language/core/lowering/content.ts` | 67 | +18 / −6 | 79 | Preserve canonical composition fields. |
| `capability/language/core/lowering/views.ts` | 98 | +18 / −6 | 110 | Lower view/container overrides. |
| `capability/language/core/printing/content.ts` | 34 | +14 / −4 | 44 | Readable lossless authoring output. |
| `capability/language/core/printing/views.ts` | 50 | +14 / −4 | 60 | Round-trip view/container intents. |
| `capability/language/tests/composition.test.ts` | 0 — new | +140 / −0 | 140 | Create/read/patch round trips and unsupported-value diagnostics. |
| `capability/presentation/contract/records/style.ts` | 105 | +25 / −5 | 125 | Token-derived figure and caption metrics. |
| `capability/presentation/contract/records/visual.ts` | 187 | +35 / −6 | 216 | Explicit frame and content primitives; measured bounds. |
| `capability/presentation/contract/records/interchange.ts` | 83 | +14 / −2 | 95 | Serialized projection retains new measured fields. |
| `capability/presentation/contract/records/content-context.ts` | 20 | +8 / −2 | 26 | Pass resolved composition policy to measurement. |
| `capability/presentation/contract/index.ts` | 72 | +8 / −0 | 80 | Expose only required public types. |
| `capability/presentation/core/projection/node.ts` | 316 | +35 / −90 | 261 | Extract frame/body policy rather than grow the existing projector. |
| `capability/presentation/core/projection/section.ts` | 76 | +15 / −3 | 88 | Project title and container appearance. |
| `capability/presentation/core/content/composition.ts` | 0 — new | +120 / −0 | 120 | New pure horizontal/vertical arrangement of measured content. |
| `capability/presentation/core/content/frames.ts` | 0 — new | +90 / −0 | 90 | New pure frame/header/caption geometry policy. |
| `capability/presentation/core/content/blocks.ts` | 97 | +15 / −4 | 108 | Dispatch semantic text and composition policies. |
| `capability/presentation/core/content/media.ts` | 62 | +35 / −12 | 85 | Large figures and intrinsic aspect ratio, separate from icon sizing. |
| `capability/presentation/core/content/sizing.ts` | 52 | +30 / −10 | 72 | Measure arranged content before node width/height are fixed. |
| `capability/presentation/adapters/react/NodeContent.tsx` | 167 | +40 / −35 | 172 | Consume measured frames; no unconditional card or renderer reflow. |
| `capability/presentation/adapters/react/ContentBlocks.tsx` | 78 | +25 / −5 | 98 | Paint admitted measured primitives. |
| `capability/presentation/tests/composition.test.ts` | 0 — new | +170 / −0 | 170 | Bounds, captions, aspect ratios, content growth and mixed arrangements. |
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
| `capability/export/tests/composition.test.ts` | 0 — new | +100 / −0 | 100 | Real SVG encoding retains scene bounds, pinned fonts and figures. |
| `resources/atlas.theme` | 5 | +10 / −2 | 13 | Portable theme DSL; a few roots rather than per-object paint. |
| `resources/examples/showcase/story-water-treatment.canvas` | 19 | +25 / −10 | 135 | Apply the admitted figure/composition semantics. |
| `resources/examples/showcase/modules-document-publishing.canvas` | 29 | +20 / −8 | 122 | Transfer figure/container semantics to engineering. |
| `resources/examples/showcase/grid-research-methods.canvas` | 42 | +100 / −42 | 100 | Structured comparison with figure/caption hierarchy. |
| **Stage touched-file totals** | **5039** | **+1816 / −352** | **6685** | Baseline and cumulative totals are for this stage's file set only. |

## Stage 3. Connections, annotations and routing polish

Measured wire badges and labels, clean branches/joins, member attachments and sensible return corridors. Keep existing native engines. Finish the first benchmark-quality infographic here, then prove the same routing behavior on a different engineering topology.

Estimated active work: **9–16 h**.

| File (relative to repository root) | Current LOC | Estimated churn | Estimated final LOC | Purpose |
| --- | ---: | ---: | ---: | --- |
| `capability/model/contract/records/relationship.ts` | 42 | +8 / −2 | 48 | Optional semantic step/annotation identity; no manual geometry requirement. |
| `capability/model/contract/records/section.ts` | 136 | +10 / −2 | 156 | Closed route intent only where existing side/route controls are insufficient. |
| `capability/model/tests/relationships.test.ts` | 0 — new | +85 / −0 | 85 | Admit/reject annotation and routing intent independently of geometry. |
| `capability/language/core/vocabulary/properties.ts` | 103 | +10 / −2 | 129 | Wire step and any proven missing route vocabulary. |
| `capability/language/core/vocabulary/constructs.ts` | 281 | +8 / −2 | 301 | Wire and connect surfaces. |
| `capability/language/core/vocabulary/patch-properties.ts` | 60 | +8 / −2 | 76 | Editable wire metadata. |
| `capability/language/core/printing/views.ts` | 50 | +8 / −2 | 66 | Preserve route intent on readout. |
| `capability/language/tests/wire-annotations.test.ts` | 0 — new | +105 / −0 | 105 | Creation, edits and readable annotation round trips. |
| `capability/presentation/contract/records/visual.ts` | 187 | +16 / −4 | 228 | Measured compound wire label/badge data. |
| `capability/presentation/contract/records/interchange.ts` | 83 | +10 / −2 | 103 | Transport preserves annotation primitives. |
| `capability/presentation/core/projection/section.ts` | 76 | +16 / −5 | 99 | Measure wire annotation before routing. |
| `capability/presentation/core/notation/annotations.ts` | 0 — new | +85 / −0 | 85 | New reusable measured badge/label composition. |
| `capability/presentation/tests/annotations.test.ts` | 0 — new | +100 / −0 | 100 | Label and badge footprint agrees with painted primitives. |
| `capability/layout/core/routing/wires.ts` | 313 | +35 / −70 | 278 | Extract route choice policy; preserve bounded recovery. |
| `capability/layout/core/routing/route-policy.ts` | 0 — new | +100 / −0 | 100 | New local orchestration of candidate selection. |
| `capability/layout/core/routing/endpoints.ts` | 180 | +40 / −12 | 208 | Exact member and fork/join attachment clearance. |
| `capability/layout/core/routing/labels.ts` | 89 | +45 / −15 | 119 | Joint badge/label clearance on actual wire runs. |
| `capability/layout/core/routing/corridors.ts` | 116 | +45 / −15 | 146 | Local return corridors and stable deterministic scoring. |
| `capability/layout/core/routing/obstacles.ts` | 34 | +20 / −5 | 49 | Group/header and annotation obstacle treatment. |
| `capability/layout/core/routing/checks.ts` | 127 | +30 / −8 | 149 | Independent checks include annotation and endpoint extents. |
| `capability/layout/core/placement/groups.ts` | 167 | +30 / −8 | 189 | Reserve measured group/route clearance. |
| `capability/layout/core/placement/spacing.ts` | 136 | +25 / −7 | 154 | Use compound annotation bounds before routing. |
| `capability/layout/tests/routing.test.ts` | 884 | +120 / −25 | 979 | Fan-out, join, return, group crossing and long-label cases. |
| `capability/layout/tests/annotations.test.ts` | 0 — new | +110 / −0 | 110 | Reject collisions; verify feasible routes, not a fabricated green score. |
| `capability/canvas/adapters/react-flow/SceneEdge.tsx` | 69 | +15 / −5 | 79 | Paint shared measured annotation in the existing edge. |
| `capability/canvas/adapters/react-flow/SceneEdge.module.css` | 24 | +5 / −1 | 28 | Token-only annotation styling. |
| `capability/export/adapters/svg/wires.tsx` | 26 | +12 / −3 | 35 | Consume the same measured wire annotation. |
| `capability/export/tests/annotations.test.ts` | 0 — new | +80 / −0 | 80 | Encoded labels, badges and route points agree with admitted scene. |
| `resources/examples/showcase/story-water-treatment.canvas` | 19 | +20 / −8 | 147 | Connected proof reaches visual benchmark; not merely no collisions. |
| `resources/examples/showcase/flow-research-approval.canvas` | 32 | +25 / −8 | 117 | Branches, labeled returns and step annotations. |
| `resources/examples/showcase/modules-document-publishing.canvas` | 29 | +20 / −8 | 134 | Topology transfer check with member endpoints. |
| **Stage touched-file totals** | **3263** | **+1246 / −221** | **4682** | Baseline and cumulative totals are for this stage's file set only. |

## Stage 4. Engineering notation refinement

Refine existing ER/module/sequence/state/tree notation without replacing renderers. Typed rows, correct cardinalities, labeled imports, functions/interfaces, container hierarchy and readable dense layouts. Add only deltas demonstrated by authored examples.

Estimated active work: **6–11 h**.

| File (relative to repository root) | Current LOC | Estimated churn | Estimated final LOC | Purpose |
| --- | ---: | ---: | ---: | --- |
| `capability/presentation/core/content/fields.ts` | 97 | +30 / −10 | 117 | Entity field, PK/FK and row-anchor alignment. |
| `capability/presentation/core/content/signature.ts` | 99 | +30 / −8 | 121 | Member and function signature hierarchy. |
| `capability/presentation/core/content/table.ts` | 116 | +25 / −7 | 134 | Readable tabular alignment and separators. |
| `capability/presentation/core/notation/nodes.ts` | 24 | +16 / −4 | 36 | Appropriate existing semantic node treatments. |
| `capability/presentation/core/notation/markers.ts` | 62 | +15 / −6 | 71 | Cardinality shape/clearance refinement, retaining correct meaning. |
| `capability/presentation/adapters/react/NodeContent.tsx` | 167 | +22 / −8 | 186 | Shared engineering headers and compartments. |
| `capability/presentation/tests/notation.test.ts` | 107 | +65 / −10 | 162 | Crow-foot meaning, compartments and anchor correspondence. |
| `capability/presentation/tests/engineering-density.test.ts` | 0 — new | +120 / −0 | 120 | Long types, composite keys and dense module interfaces. |
| `capability/layout/core/sequence/participants.ts` | 43 | +20 / −6 | 57 | Measured participant heading spacing. |
| `capability/layout/core/sequence/frames.ts` | 157 | +25 / −8 | 174 | Readable nested fragments and branch headings. |
| `capability/layout/core/sequence/events.ts` | 56 | +25 / −8 | 73 | Message/return separation based on measured labels. |
| `capability/layout/core/placement/policy.ts` | 93 | +15 / −5 | 103 | Refine existing tree/layered policy only when examples expose a gap. |
| `capability/layout/tests/engineering.test.ts` | 0 — new | +140 / −0 | 140 | Dense ER/module/sequence/tree arrangements through public contracts. |
| `resources/examples/showcase/er-museum-loans.canvas` | 37 | +150 / −37 | 150 | Typed tables, composite/optional relationships and labeled wires. |
| `resources/examples/showcase/modules-document-publishing.canvas` | 29 | +25 / −8 | 151 | Final engineering refinements. |
| `resources/examples/showcase/sequence-payment-settlement.canvas` | 21 | +100 / −21 | 100 | Messages, returns and nested alternatives. |
| `resources/examples/showcase/state-batch-job.canvas` | 31 | +95 / −31 | 95 | Guards, effects and recovery loops. |
| `resources/examples/showcase/tree-field-research.canvas` | 23 | +90 / −23 | 90 | Hierarchy plus explicitly distinct cross references. |
| **Stage touched-file totals** | **1162** | **+1008 / −200** | **2080** | Baseline and cumulative totals are for this stage's file set only. |

## Stage 5. Breadth, editability and visual acceptance

24 original diagrams: three genuinely distinct examples in each of eight families. Connected meaning survives collection splitting. Exercise DSL create/read/edit, content growth, refresh/restart and export. Visible in-app browser checks; no new E2E suite or stray browser processes.

Estimated active work: **8–14 h**.

| File (relative to repository root) | Current LOC | Estimated churn | Estimated final LOC | Purpose |
| --- | ---: | ---: | ---: | --- |
| `resources/examples/showcase/story-water-treatment.canvas` | 19 | +15 / −5 | 157 | Final edit/content-growth proof. |
| `resources/examples/showcase/story-evidence-lesson.canvas` | 17 | +115 / −17 | 115 | Original branching evidence explanation. |
| `resources/examples/showcase/story-safe-deployment.canvas` | 23 | +125 / −23 | 125 | Original deployment control-loop explanation. |
| `resources/examples/showcase/grid-research-methods.canvas` | 42 | +15 / −5 | 110 | Final comparison proof. |
| `resources/examples/showcase/grid-feedback-methods.canvas` | 21 | +100 / −21 | 100 | Comparison with another information structure. |
| `resources/examples/showcase/grid-archive-comparison.canvas` | 19 | +100 / −19 | 100 | Visual comparison with different content density. |
| `resources/examples/showcase/er-museum-loans.canvas` | 37 | +15 / −5 | 160 | Final member/cardinality proof. |
| `resources/examples/showcase/er-habitat-survey.canvas` | 39 | +145 / −39 | 145 | Different ER topology and cardinalities. |
| `resources/examples/showcase/er-course-enrollment.canvas` | 45 | +155 / −45 | 155 | Associative entities and composite relationships. |
| `resources/examples/showcase/modules-document-publishing.canvas` | 29 | +15 / −5 | 161 | Final typed dependency proof. |
| `resources/examples/showcase/modules-sensor-gateway.canvas` | 34 | +130 / −34 | 130 | Different boundaries and interface topology. |
| `resources/examples/showcase/modules-payroll-policy.canvas` | 42 | +135 / −42 | 135 | Functions and typed rule dependencies. |
| `resources/examples/showcase/flow-research-approval.canvas` | 32 | +15 / −5 | 127 | Final branching-flow proof. |
| `resources/examples/showcase/flow-emergency-dispatch.canvas` | 29 | +120 / −29 | 120 | Parallel dispatch and convergence. |
| `resources/examples/showcase/flow-equipment-return.canvas` | 20 | +105 / −20 | 105 | Loop and exception process. |
| `resources/examples/showcase/sequence-payment-settlement.canvas` | 21 | +15 / −5 | 110 | Final sequence proof. |
| `resources/examples/showcase/sequence-library-reservation.canvas` | 25 | +110 / −25 | 110 | Alternative and timeout sequence. |
| `resources/examples/showcase/sequence-incident-notification.canvas` | 26 | +115 / −26 | 115 | Asynchronous fan-out and recovery. |
| `resources/examples/showcase/state-batch-job.canvas` | 31 | +15 / −5 | 105 | Final state proof. |
| `resources/examples/showcase/state-exhibition-lifecycle.canvas` | 31 | +105 / −31 | 105 | Different lifecycle and guards. |
| `resources/examples/showcase/state-membership-reinstatement.canvas` | 32 | +110 / −32 | 110 | Re-entry and recovery transitions. |
| `resources/examples/showcase/tree-field-research.canvas` | 23 | +15 / −5 | 100 | Final hierarchy proof. |
| `resources/examples/showcase/tree-course-objectives.canvas` | 27 | +95 / −27 | 95 | Learning hierarchy and dependencies. |
| `resources/examples/showcase/tree-incident-causes.canvas` | 29 | +105 / −29 | 105 | Cause tree with distinct cross references. |
| `resources/examples/showcase-collection.canvas` | 696 | +0 / −696 | 0 | Remove oversized combined source; individual collection sources remain the authoring units. |
| `resources/examples/showcase/showcase-manifest.json` | 0 — new | +110 / −0 | 110 | New provenance and navigation manifest listing individual sources and families; not diagram geometry. |
| `capability/language/tests/showcase-roundtrip.test.ts` | 0 — new | +130 / −0 | 130 | Public-contract corpus read/print/edit agreement; no browser/E2E runner. |
| `capability/export/tests/showcase-fidelity.test.ts` | 0 — new | +120 / −0 | 120 | Shared measured artifact contract across diagram families. |
| `quality/agent-diagrams/visual-acceptance.json` | 0 — new | +240 / −0 | 240 | Human-inspected evidence register: source, revision, screenshots, export and result per example. |
| **Stage touched-file totals** | **1389** | **+2590 / −1195** | **3500** | Baseline and cumulative totals are for this stage's file set only. |

## Final acceptance

1. All 24 sources use genuine readable DSL, each ≤300 physical lines. No manually authored placement JSON, embedded full-diagram poster or subject-specific renderer.
2. Three visibly different structures per family; new constructs have documented reuse evidence. Shared themes and ordinary assets produce the visual hierarchy.
3. Real canvas screenshots and exported artifacts substantiate the quality comparison; source, app revision and collection ID are recorded for each.
4. DSL edits to an open diagram, longer content, renamed members and changed connections retain correct meaning and update the display through Authoring. Reload and service restart preserve admitted output.
5. App standards, focused correctness checks and the bounded per-PR review process are complete. A populated showcase, an image count or a green suite alone is not acceptance.
