# Canvas development contract

Model and Library have pure tested implementations; Persistence has a tested SQLite/backup implementation; Assets has tested media/file/lease implementations. Templates has tested immutable preset policy and required codec seams. Remaining capabilities and hosts are scaffolds. This is not yet a working application. Read docs/baseline/ before implementation. The original app’s data/implementation is not copied here. The repository may later live under novakai/package/canvas; use capability/ for its internal architecture.

## Authority and scope

- Model owns diagram validity; Library owns catalog validity; Authoring alone admits/commits workspace and diagram changes; Persistence executes physical transactions.
- React and React Flow are required. Agents author semantic DSL, never JSON coordinates.
- Web shell owns panel visibility/layout. Canvas owns diagram selection/camera/gestures and emits inspect requests.
- Side panels compose header/body/section components with registered feature contents and declarative placement. UI color/theme changes use Design System tokens.
- Do not create fake implementations, empty TSX components, placeholder passing tests, or a fake green CI workflow.
- Do not use subagents unless the user specifically requests them.

## Standards and imports

- Follow docs/standards/CODING-STANDARDS.md and REPO-FOLDER-STRUCTURE.md. Each first-party source file requires evidence of >144/160; Sonar cognitive complexity <=2 per function. No pre-awarded scores or silent exceptions.
- Outside imports enter only a capability’s contract/index.ts. Own core imports own core and declaration-only contract modules; never adapters, hosts, React, another capability, api, compose or index.
- Only contract/compose.ts binds own concrete adapters. No sibling adapter behavior imports under the adopted SOP; inject narrow stable slots. Local CSS assets are build resources.
- React-only declaration types stay out of core. Domain behavior between capabilities is injected through consumer-owned ports.
- Add restricted-import, export and cycle enforcement across TS/TSX/JS when the first source/tooling slice is introduced, before proliferating modules.
- Keep CSS values in the centralized token system; follow scopes/layers/contrast rules from document 6.
- Tests use public contracts; adapter suites share the same behavioral contract. Freeze a justified test budget for each implementation slice. Coverage alone is not correctness.

## Starting work

Use BUILD-ORDER.md. Implement thin complete behaviors through contracts rather than completing an entire capability in isolation. Introduce dependency pins, manifests and enforcement honestly with the first slice. Scaffold verification is not an application build/test result.
