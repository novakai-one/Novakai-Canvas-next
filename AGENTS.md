# Canvas development contract

## Authority and scope

- Model owns diagram validity; Library owns catalog validity; Authoring alone admits/commits workspace and diagram changes; Persistence executes physical transactions.
- React and React Flow are required. Agents author semantic DSL, never JSON coordinates.
- Web shell owns panel visibility/layout. Canvas owns diagram selection/camera/gestures and emits inspect requests.
- Side panels compose header/body/section components with registered feature contents and declarative placement. UI color/theme changes use Design System tokens.
- Do not create fake implementations, empty TSX components, placeholder passing tests, or a fake green CI workflow.
- Do not use subagents unless the user specifically requests them.

## Standards and imports

- Follow docs/standards/CODING-STANDARDS.md and REPO-FOLDER-STRUCTURE.md. Each first-party source file requires evidence of >144/160; Sonar cognitive complexity <=2 per function. No pre-awarded scores or silent exceptions.
- Outside imports enter only a capability's contract/index.ts. Own core imports own core and declaration-only contract modules; never adapters, hosts, React, another capability, api, compose or index.
- Only contract/compose.ts binds own concrete adapters. Inject narrow stable slots; no sibling adapter behavior imports. Local CSS assets are build resources.
- React-only declaration types stay out of core. Domain behavior between capabilities is injected through consumer-owned ports.
- Keep CSS values in the centralized token system.
- Tests use public contracts; adapter suites share the same behavioral contract. Coverage alone is not correctness.

## Working agreement

- Gate every change with `pnpm check`. Do not claim completion from a green suite alone: rendered-output work is done only when inspected against docs/agent-diagrams/visual-quality/References.md and the benchmark gates in docs/maintenance/diagram-quality-improvements.md.
- Agent diagram work follows docs/agent-diagrams/visual-quality/SOP.md. Preserve the approved reference images and semantic authoring constraints.
