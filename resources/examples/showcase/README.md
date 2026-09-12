# Atlas: 24 original DSL diagrams

Eight diagram families, three original subjects/compositions each. The combined source is [showcase-collection.canvas](../showcase-collection.canvas); each sibling `.canvas` file also creates a standalone collection.

|Family|Three examples and what changes|
|---|---|
|ER|Museum loans: movement chain; enrollment: composite identities and junction; habitat survey: self-reference and dated observations|
|Modules|Publishing: inward dependency boundary; sensor gateway: two input adapters; payroll: functions behind typed policy contracts|
|Flow/SOP|Equipment return: decision and repair loop; research approval: parallel reviews and revision; dispatch: grouped escalation and handoff|
|Sequence|Reservation: alternatives; settlement: retry loop and asynchronous confirmation; notification: optional fragments and self-call|
|State|Exhibition: release and rollback; batch job: retry/cancellation branches; membership: suspension and reviewed reinstatement|
|Tree/mindmap|Field study: branching evidence plan; objectives: deeper learning hierarchy; incident causes: uneven causal branches|
|Story/infographic|Teaching: three horizontal stages; deployment: two stages above feedback; water: process grid beside checks|
|Grid/comparison|Archive: three repeated columns; feedback: four illustrated quadrants; research: tabular comparison above varied guidance|

## Create in a fresh local workspace

From the repository root, install with `pnpm install --frozen-lockfile`, then:

```sh
pnpm --filter @novakai/canvas-web build
pnpm dev --port 5185 --workspace .local/atlas-demo
```

In a second terminal, from that same root:

```sh
pnpm canvas theme admit resources/atlas.theme --server http://127.0.0.1:5185 --workspace .local/atlas-demo --request atlas-theme
pnpm canvas create resources/examples/showcase-collection.canvas --server http://127.0.0.1:5185 --workspace .local/atlas-demo --request atlas-create
pnpm canvas read agent-diagram-atlas --server http://127.0.0.1:5185 --workspace .local/atlas-demo --out .local/atlas-demo/readout.canvas
```

Open `http://127.0.0.1:5185/?collection=agent-diagram-atlas`. Use **Diagram outline** to fit an individual diagram. Fit collection is an overview, not a readable presentation of all 24 at once. If 5185 is already occupied, select another port consistently.

To edit, read the current revision with `pnpm canvas list`, change readable source, then use `canvas replace FILE --revision N` with a fresh request ID and the same server/workspace options. Review the receipt; a missing receipt is not evidence of a commit. Restart with the same workspace path to retain content/resources.

## Authoring ingredients

- DSL expresses meaning, grouping, ordering, size classes and optional wire-side intent. No JSON coordinates.
- [atlas.theme](../../atlas.theme) selects pinned repository fonts and two numeric root tokens: `ratio.caption=1`, `lineHeight.body=1.25`. Design System owns token validation and derivation.
- Local images are six original reusable SVG icons in `assets/`, admitted through the normal asset path. None is a reference-image background.
- [Eight editable recipes](../../recipes/) provide starting intent; state/grid recipes require explicit admission (see recipe evidence). These examples do not depend on image-specific layout code.
- Final readout, captured scene, receipts and headed-browser evidence live in `quality/agent-diagrams/pr6/`. See its acceptance record for measured results and remaining gates.
