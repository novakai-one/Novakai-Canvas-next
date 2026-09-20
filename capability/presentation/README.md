# Presentation

Responsibility: semantic diagram content, notation, resolved styling and measurement. Layout consumes its measured projections; Canvas and Export draw through its React and static-markup renderers.

Public entry: `contract/index.ts`; concrete adapters are wired by `contract/compose.ts`. Core stays framework-free and imports own declaration-only contracts. Drawers cover figures (entity/module/interface/function, store/queue/cloud, container), measured text blocks with emphasis spans, and wire labels; both renderers draw from the same measured projection.

Rendered output is versioned (`presentation-N`): any visual change requires a version bump and re-recorded corpus goldens under `quality/agent-diagrams/visual-quality/stage-5/inputs/`.

## Navigate

- `adapters/react/NodeContent.tsx`: renders measured content and filters semantic LOD roles.
- `adapters/react/{CardChrome,AccentStripeChrome,FolderTabChrome}.tsx`: reusable node frames.
- `core/content/`: headings, signatures, fields, body composition and sizing.
- `core/projection/`: projects semantic objects and measured module envelopes.
- `../design-system/tokens/`: style sources; `../canvas/adapters/react-flow/`: interactive wrappers.

Modules, entities, functions and interfaces share heading/detail LOD roles. Canvas chooses the zoom tier; Presentation retains the measured geometry while filtering content.
