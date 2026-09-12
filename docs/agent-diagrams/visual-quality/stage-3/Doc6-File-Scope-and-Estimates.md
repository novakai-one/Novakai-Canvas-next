# Candidate file scope and estimates

Baseline `38ea827`. Physical LOC, including comments/blanks. Churn = added/deleted lines during stage; final includes earlier estimated stage edits. Not frozen targets or auditor mandates. Tests are governed by Doc5; candidates can consolidate into existing public-contract suites.

| File | Current LOC | Estimated churn | Estimated final LOC | Purpose |
| --- | ---: | ---: | ---: | --- |
| `capability/model/contract/records/relationship.ts` | 42 | +8 / −2 | 48 | Optional semantic step/annotation identity; no manual geometry requirement. |
| `capability/model/contract/records/section.ts` | 136 | +10 / −2 | 156 | Closed route intent only where existing side/route controls are insufficient. |
| `capability/model/tests/relationships.test.ts` | 0 | +85 / −0 | 85 | Admit/reject annotation and routing intent independently of geometry. |
| `capability/language/core/vocabulary/properties.ts` | 103 | +10 / −2 | 129 | Wire step and any proven missing route vocabulary. |
| `capability/language/core/vocabulary/constructs.ts` | 281 | +8 / −2 | 301 | Wire and connect surfaces. |
| `capability/language/core/vocabulary/patch-properties.ts` | 60 | +8 / −2 | 76 | Editable wire metadata. |
| `capability/language/core/printing/views.ts` | 50 | +8 / −2 | 66 | Preserve route intent on readout. |
| `capability/language/tests/wire-annotations.test.ts` | 0 | +105 / −0 | 105 | Creation, edits and readable annotation round trips. |
| `capability/presentation/contract/records/visual.ts` | 187 | +16 / −4 | 228 | Measured compound wire label/badge data. |
| `capability/presentation/contract/records/interchange.ts` | 83 | +10 / −2 | 103 | Transport preserves annotation primitives. |
| `capability/presentation/core/projection/section.ts` | 76 | +16 / −5 | 99 | Measure wire annotation before routing. |
| `capability/presentation/core/notation/annotations.ts` | 0 | +85 / −0 | 85 | New reusable measured badge/label composition. |
| `capability/presentation/tests/annotations.test.ts` | 0 | +100 / −0 | 100 | Label and badge footprint agrees with painted primitives. |
| `capability/layout/core/routing/wires.ts` | 313 | +35 / −70 | 278 | Extract route choice policy; preserve bounded recovery. |
| `capability/layout/core/routing/route-policy.ts` | 0 | +100 / −0 | 100 | New local orchestration of candidate selection. |
| `capability/layout/core/routing/endpoints.ts` | 180 | +40 / −12 | 208 | Exact member and fork/join attachment clearance. |
| `capability/layout/core/routing/labels.ts` | 89 | +45 / −15 | 119 | Joint badge/label clearance on actual wire runs. |
| `capability/layout/core/routing/corridors.ts` | 116 | +45 / −15 | 146 | Local return corridors and stable deterministic scoring. |
| `capability/layout/core/routing/obstacles.ts` | 34 | +20 / −5 | 49 | Group/header and annotation obstacle treatment. |
| `capability/layout/core/routing/checks.ts` | 127 | +30 / −8 | 149 | Independent checks include annotation and endpoint extents. |
| `capability/layout/core/placement/groups.ts` | 167 | +30 / −8 | 189 | Reserve measured group/route clearance. |
| `capability/layout/core/placement/spacing.ts` | 136 | +25 / −7 | 154 | Use compound annotation bounds before routing. |
| `capability/layout/tests/routing.test.ts` | 884 | +120 / −25 | 979 | Fan-out, join, return, group crossing and long-label cases. |
| `capability/layout/tests/annotations.test.ts` | 0 | +110 / −0 | 110 | Reject collisions; verify feasible routes, not a fabricated green score. |
| `capability/canvas/adapters/react-flow/SceneEdge.tsx` | 69 | +15 / −5 | 79 | Paint shared measured annotation in the existing edge. |
| `capability/canvas/adapters/react-flow/SceneEdge.module.css` | 24 | +5 / −1 | 28 | Token-only annotation styling. |
| `capability/export/adapters/svg/wires.tsx` | 26 | +12 / −3 | 35 | Consume the same measured wire annotation. |
| `capability/export/tests/annotations.test.ts` | 0 | +80 / −0 | 80 | Encoded labels, badges and route points agree with admitted scene. |
| `resources/examples/showcase/story-water-treatment.canvas` | 19 | +20 / −8 | 147 | Connected proof reaches visual benchmark; not merely no collisions. |
| `resources/examples/showcase/flow-research-approval.canvas` | 32 | +25 / −8 | 117 | Branches, labeled returns and step annotations. |
| `resources/examples/showcase/modules-document-publishing.canvas` | 29 | +20 / −8 | 134 | Topology transfer check with member endpoints. |
