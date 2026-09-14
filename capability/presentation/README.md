# Presentation

Responsibility: semantic diagram content, notation, resolved styling and measurement. Layout consumes its measured projections; Canvas and Export draw through its React and static-markup renderers.

Public entry: `contract/index.ts`; concrete adapters are wired by `contract/compose.ts`. Core stays framework-free and imports own declaration-only contracts. Drawers cover figures (entity/module/interface/function, store/queue/cloud, container), measured text blocks with emphasis spans, and wire labels; both renderers draw from the same measured projection.

Rendered output is versioned (`presentation-N`): any visual change requires a version bump and re-recorded corpus goldens under `quality/agent-diagrams/visual-quality/stage-5/inputs/`.
