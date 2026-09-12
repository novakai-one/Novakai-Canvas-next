# PR6 reusable recipe proof

Date: 2026-09-12

Base: `425e2c7484aa77b89a66219fe34512e815d8a85d`

Service: `http://127.0.0.1:5183`

Workspace: `.local/recipe-probes`

## Scope and result

The eight files in `resources/recipes/` cover the public Language modes `er`, `modules`,
`flow`, `sequence`, `state`, `tree`, `story` and `grid`. The service admitted the six existing
built-ins during startup. The state and grid additions were then admitted through the public CLI,
each instantiated twice with a fresh collection namespace, created, read at revision 0, edited
with ordinary patch DSL, and read back at revision 1.

No canonical diagram JSON, coordinates, renderer special case, image or theme was authored.
The only requested theme alias was the existing `paper`; every instantiated source and readout
contains its resolved exact pin.

## Exact admitted pins

| Resource | Exact pin | Mode / family note |
|---|---|---|
| Theme | `paper@1.0.0#sha256:26f6c69a71213b2315ac1000f6dff35d82d819af11e11f6d00fc25696e5be094` | Existing shipped theme |
| Recipe | `er@1.0.0#sha256:27295e65ce79678baca47552c66c3edd1918e47362033886fdca880791f50730` | `er` / `er` |
| Recipe | `modules@1.0.0#sha256:a9e5a53d378b6c43b35c27adf2e33e12293d28ccca8fcf36111e1bffabc776ea` | `modules` / `modules` |
| Recipe | `sop@1.0.0#sha256:0e770112821a5cd5f844836e85e5e1400e40b29cba9148a1874af6a820c04a47` | `flow` / `sop` |
| Recipe | `sequence@1.0.0#sha256:82e397b8d6cdc757400836bb2760dc166a7e7d0e745fed1001eeb48112f1a917` | `sequence` / `sequence` |
| Recipe | `mindmap@1.0.0#sha256:e3a3b8d0ef3c494b8715afd7a669e722d0893a9442691cd4a45b1fb2e4060f32` | `tree` / `mindmap` |
| Recipe | `infographic@1.0.0#sha256:ba5121bff68b52063f7bf44ab7eb93c9e42b739e3ef9bc22f98dd156bd88fb2a` | `story` / `infographic` |
| Recipe | `pr6-state-starter@1.0.0#sha256:3f52dc94e9fc4fc4b0d4efe0df257e16021f709bb7eb4cac46cb1ad58bb3541f` | `state` / public family `sop` |
| Recipe | `pr6-grid-starter@1.0.0#sha256:763e1dcb806c12f752d406034f34e4f28b55211cd6114ef141cebdba539be2f8` | `grid` / public family `infographic` |

## Successful request ledger

| Operation | Request ID | Receipt | Source/readout |
|---|---|---|---|
| Admit state preset | `pr6-admit-state` | workspace sequence 2 | `resources/recipes/state.canvas` |
| Admit grid preset | `pr6-admit-grid` | workspace sequence 3 | `resources/recipes/grid.canvas` |
| Create state alpha | `pr6-create-state-alpha` | workspace sequence 4 | `instantiated/state-alpha.canvas`; revision 0 readout |
| Create state beta | `pr6-create-state-beta` | workspace sequence 5 | `instantiated/state-beta.canvas`; revision 0 readout |
| Create grid alpha | `pr6-create-grid-alpha` | workspace sequence 6 | `instantiated/grid-alpha.canvas`; revision 0 readout |
| Create grid beta | `pr6-create-grid-beta` | workspace sequence 7 | `instantiated/grid-beta.canvas`; revision 0 readout |
| Edit state alpha | `pr6-edit-state-alpha` | workspace sequence 8 | `patches/state-alpha.patch`; revision 1 readout |
| Edit state beta | `pr6-edit-state-beta` | workspace sequence 9 | `patches/state-beta.patch`; revision 1 readout |
| Edit grid alpha | `pr6-edit-grid-alpha` | workspace sequence 10 | `patches/grid-alpha.patch`; revision 1 readout |
| Edit grid beta | `pr6-edit-grid-beta` | workspace sequence 11 | `patches/grid-beta.patch`; revision 1 readout |

The generated `receipts/` files are the later `canvas receipt REQUEST_ID` responses, not copies
of the initial stdout. `readouts/collections.txt` independently lists all four collections at
revision 1. `hashes.sha256` covers every recipe source, instantiated source, patch, readout and
receipt.

## Meaningful reuse edits

- State alpha became an experiment-decision lifecycle; state beta became a policy-exception
  lifecycle. Each changes collection/section meaning, a state or its explanatory content, and a
  transition label without changing the reusable topology.
- Grid alpha became a customer-research comparison; grid beta became an incident-learning
  comparison. Each changes all three option identities and explanations while retaining the
  editable repeated-panel composition.

## Honest boundary

The current built-in installation manifest and public Templates family enum contain six entries.
Consequently, `state.canvas` and `grid.canvas` are valid resources and are proven through manual
CLI admission, but they are not automatically admitted on service startup. Making them additional
built-ins requires a production manifest/taxonomy decision outside this recipes-only task.

The source files in the sibling showcase tree were consulted for supported grammar only. These
starters use different subjects and original topology/content, and copy no benchmark image.
