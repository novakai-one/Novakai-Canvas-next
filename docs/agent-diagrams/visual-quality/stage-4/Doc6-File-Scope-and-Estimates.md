# Candidate file scope and estimates

Baseline `38ea827`. Physical LOC, including comments/blanks. Churn = added/deleted lines during stage; final includes earlier estimated stage edits. Not frozen targets or auditor mandates. Tests are governed by Doc5; candidates can consolidate into existing public-contract suites.

| File | Current LOC | Estimated churn | Estimated final LOC | Purpose |
| --- | ---: | ---: | ---: | --- |
| `capability/presentation/core/content/fields.ts` | 97 | +30 / −10 | 117 | Entity field, PK/FK and row-anchor alignment. |
| `capability/presentation/core/content/signature.ts` | 99 | +30 / −8 | 121 | Member and function signature hierarchy. |
| `capability/presentation/core/content/table.ts` | 116 | +25 / −7 | 134 | Readable tabular alignment and separators. |
| `capability/presentation/core/notation/nodes.ts` | 24 | +16 / −4 | 36 | Appropriate existing semantic node treatments. |
| `capability/presentation/core/notation/markers.ts` | 62 | +15 / −6 | 71 | Cardinality shape/clearance refinement, retaining correct meaning. |
| `capability/presentation/adapters/react/NodeContent.tsx` | 167 | +22 / −8 | 186 | Shared engineering headers and compartments. |
| `capability/presentation/tests/notation.test.ts` | 107 | +65 / −10 | 162 | Crow-foot meaning, compartments and anchor correspondence. |
| `capability/presentation/tests/engineering-density.test.ts` | 0 | +120 / −0 | 120 | Long types, composite keys and dense module interfaces. |
| `capability/layout/core/sequence/participants.ts` | 43 | +20 / −6 | 57 | Measured participant heading spacing. |
| `capability/layout/core/sequence/frames.ts` | 157 | +25 / −8 | 174 | Readable nested fragments and branch headings. |
| `capability/layout/core/sequence/events.ts` | 56 | +25 / −8 | 73 | Message/return separation based on measured labels. |
| `capability/layout/core/placement/policy.ts` | 93 | +15 / −5 | 103 | Refine existing tree/layered policy only when examples expose a gap. |
| `capability/layout/tests/engineering.test.ts` | 0 | +140 / −0 | 140 | Dense ER/module/sequence/tree arrangements through public contracts. |
| `resources/examples/showcase/er-museum-loans.canvas` | 37 | +150 / −37 | 150 | Typed tables, composite/optional relationships and labeled wires. |
| `resources/examples/showcase/modules-document-publishing.canvas` | 29 | +25 / −8 | 151 | Final engineering refinements. |
| `resources/examples/showcase/sequence-payment-settlement.canvas` | 21 | +100 / −21 | 100 | Messages, returns and nested alternatives. |
| `resources/examples/showcase/state-batch-job.canvas` | 31 | +95 / −31 | 95 | Guards, effects and recovery loops. |
| `resources/examples/showcase/tree-field-research.canvas` | 23 | +90 / −23 | 90 | Hierarchy plus explicitly distinct cross references. |
