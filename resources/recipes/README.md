# Shipped recipe sources — version 1.0.0

These eight compact `canvas 1` sources are ordinary, coordinate-free starting points. Recipe
instantiation assigns a caller-supplied collection namespace and returns readable DSL; identities
scoped by that collection remain independent. The result has no live link to the preset and can
be edited with the normal create/replace/patch commands.

| File | Diagram mode | Admitted template family | Reusable structure |
|---|---|---|---|
| `er.canvas` | `er` | `er` | Two typed entities, PK/FK endpoints and explicit cardinality |
| `modules.canvas` | `modules` | `modules` | Module ports, interface member and implementing function |
| `sop.canvas` | `flow` | `sop` | Start, numbered work, decision and labelled rework loop |
| `sequence.canvas` | `sequence` | `sequence` | Three participants and alternative ordered outcomes |
| `state.canvas` | `state` | `sop` | Guarded lifecycle with approval, revision and terminal paths |
| `mindmap.canvas` | `tree` | `mindmap` | Rooted hierarchy plus a non-tree annotation |
| `infographic.canvas` | `story` | `infographic` | Explanatory cards, roles and labelled references |
| `grid.canvas` | `grid` | `infographic` | Three repeated comparison panels with strengths and cautions |

Template families are the public six-family Templates taxonomy; diagram modes are the public
Language taxonomy. State therefore uses the closest process family, while structured grid uses
the explanatory infographic family. The source remains a real state or grid section after
instantiation.

Every source requests the shipped `paper` alias. The service resolves that alias during preset
admission and expansion, so instantiated source records the exact immutable
`paper@1.0.0#sha256:<digest>` pin; source aliases are not claims of an exact admitted pin.
