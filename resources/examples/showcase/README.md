# Agent-authored diagram showcase

24 original diagrams: three structurally distinct examples in each of eight families. Each source creates a separate readable collection. The additional [mixed authoring collection](mixed-authoring-contract.canvas) combines an explanatory infographic and typed module diagram in 60 lines. The former oversized all-in-one source is retired.

## Sources

| Family / batch | DSL | Lines | Distinct structure |
| --- | --- | ---: | --- |
| ER / 1 | [er-museum-loans](er-museum-loans.canvas) | 38 | Movement chain with junction and optional inspections |
| ER / 2 | [er-course-enrollment](er-course-enrollment.canvas) | 51 | Five-part composite identity and dependent assessment |
| ER / 3 | [er-habitat-survey](er-habitat-survey.canvas) | 43 | Self-referencing habitat with several evidence contributors |
| Modules / 1 | [modules-document-publishing](modules-document-publishing.canvas) | 43 | Inward interface dependency across an external vendor boundary |
| Modules / 2 | [modules-sensor-gateway](modules-sensor-gateway.canvas) | 34 | Two transport adapters converge on a typed input port |
| Modules / 3 | [modules-payroll-policy](modules-payroll-policy.canvas) | 47 | Several callable rules implement two contracts |
| Flow/SOP / 1 | [flow-research-approval](flow-research-approval.canvas) | 41 | Parallel reviews converge with a revision loop |
| Flow/SOP / 2 | [flow-equipment-return](flow-equipment-return.canvas) | 20 | Inspection decision and repair recheck |
| Flow/SOP / 3 | [flow-emergency-dispatch](flow-emergency-dispatch.canvas) | 29 | Escalation branches converge at handoff |
| Sequence / 1 | [sequence-payment-settlement](sequence-payment-settlement.canvas) | 29 | Nested loop and alternatives plus asynchronous confirmation |
| Sequence / 2 | [sequence-library-reservation](sequence-library-reservation.canvas) | 25 | Alternative reservation and waitlist paths |
| Sequence / 3 | [sequence-incident-notification](sequence-incident-notification.canvas) | 26 | Independent optional fragments and self-calls |
| State / 1 | [state-batch-job](state-batch-job.canvas) | 36 | Retry/cancellation branches and durable outcomes |
| State / 2 | [state-exhibition-lifecycle](state-exhibition-lifecycle.canvas) | 31 | Publication lifecycle and rollback |
| State / 3 | [state-membership-reinstatement](state-membership-reinstatement.canvas) | 34 | Suspension, review and monitored re-entry |
| Tree/mindmap / 1 | [tree-field-research](tree-field-research.canvas) | 29 | Uneven evidence hierarchy with cross-reference |
| Tree/mindmap / 2 | [tree-course-objectives](tree-course-objectives.canvas) | 27 | Deep learning prerequisite hierarchy |
| Tree/mindmap / 3 | [tree-incident-causes](tree-incident-causes.canvas) | 29 | Downward causal hypotheses with unequal depth |
| Story/infographic / 1 | [story-water-treatment](story-water-treatment.canvas) | 74 | Serpentine barrier process with monitoring and side streams |
| Story/infographic / 2 | [story-evidence-lesson](story-evidence-lesson.canvas) | 44 | Contrasting evidence converges on a principle and transfer check |
| Story/infographic / 3 | [story-safe-deployment](story-safe-deployment.canvas) | 51 | Bounded rollout with healthy/unsafe feedback decisions |
| Grid/comparison / 1 | [grid-research-methods](grid-research-methods.canvas) | 28 | Single aligned matrix of shared comparison dimensions |
| Grid/comparison / 2 | [grid-archive-comparison](grid-archive-comparison.canvas) | 19 | Three nested operating-model columns |
| Grid/comparison / 3 | [grid-feedback-methods](grid-feedback-methods.canvas) | 21 | Four illustrated method quadrants with paired strengths and limits |

## Run locally

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @novakai/canvas-web build
pnpm dev --port 5185 --workspace .local/atlas-demo
```

In a second terminal, from the same root:

```sh
pnpm canvas theme admit resources/atlas.theme --server http://127.0.0.1:5185 --workspace .local/atlas-demo --request atlas-theme
pnpm canvas theme admit resources/studio.theme --server http://127.0.0.1:5185 --workspace .local/atlas-demo --request studio-theme
pnpm canvas create resources/examples/showcase/story-water-treatment.canvas --server http://127.0.0.1:5185 --workspace .local/atlas-demo --request water-create
pnpm canvas read story-water-treatment --server http://127.0.0.1:5185 --workspace .local/atlas-demo --out .local/atlas-demo/water-readout.canvas
```

Open `http://127.0.0.1:5185/?collection=story-water-treatment`. Create any other source using its table link and a fresh request ID. Select another port consistently if 5185 is occupied. Use Fit collection for context, then zoom/pan for readable detail. The UI redesign remains deferred.

For edits, obtain the current revision with `canvas list`, edit readable DSL and run `canvas replace FILE --revision N` with a fresh request ID and the same server/workspace options. Ordered `canvas patch` is also supported. Inspect the committed receipt; process exit alone does not establish admission. Restart with the same workspace path to retain content and resources.

## Reusable authoring

DSL expresses meaning, grouping, ordering, size classes and optional attachment/routing intent. It contains no authored JSON coordinates. Themes select shared visual roles and pinned fonts; local original SVGs illustrate reusable concepts, never whole reference diagrams. Asset provenance is in [assets/README](assets/README.md). [Eight recipes](../../recipes/) supply starting intent.

[Final gallery and acceptance evidence](../../../quality/agent-diagrams/visual-quality/stage-5/README.md) links actual browser captures, native SVG/PNG, committed receipts and readouts. [Build docs and benchmark targets](../../../docs/agent-diagrams/visual-quality/README.md) preserve the purpose and acceptance criteria.
