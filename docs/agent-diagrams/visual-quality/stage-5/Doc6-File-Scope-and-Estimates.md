# Candidate file scope and estimates

Baseline `38ea827`. Physical LOC, including comments/blanks. Churn = added/deleted lines during stage; final includes earlier estimated stage edits. Not frozen targets or auditor mandates. Tests are governed by Doc5; candidates can consolidate into existing public-contract suites.

| File | Current LOC | Estimated churn | Estimated final LOC | Purpose |
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
| `resources/examples/showcase/showcase-manifest.json` | 0 | +110 / −0 | 110 | New provenance and navigation manifest listing individual sources and families; not diagram geometry. |
| `capability/language/tests/showcase-roundtrip.test.ts` | 0 | +130 / −0 | 130 | Public-contract corpus read/print/edit agreement; no browser/E2E runner. |
| `capability/export/tests/showcase-fidelity.test.ts` | 0 | +120 / −0 | 120 | Shared measured artifact contract across diagram families. |
| `quality/agent-diagrams/visual-acceptance.json` | 0 | +240 / −0 | 240 | Human-inspected evidence register: source, revision, screenshots, export and result per example. |
