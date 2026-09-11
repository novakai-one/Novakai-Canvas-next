# Authoring

Responsibility: the sole admission/prepare/commit gate for human and agent changes. It owns revision checks, submitted-request identity, retry receipts and reversible transaction history. Model/Library rules and physical storage remain injected owners.

Implemented public facade: `createAuthoring(dependencies)` or Node `composeAuthoring(owners)`; `read`, `receipt`, `prepare`, `apply`, `undo`, `redo`. Import only `@novakai/canvas-authoring`.

Every apply recomputes a complete candidate, checks original client expectations plus discovered dependencies, requires resource protection and hard feasibility, then commits content/history/receipt atomically. A committed retry returns its original receipt before resolving aliases or files again. No-op commits a receipt without content/history revision. Undo/redo use current participant versions and the same admission guards.

No production permissive owners exist. Host composition must bridge public Model/Library planning/validation, Assets/Templates admission, Presentation/Layout feasibility and Persistence transactions. The Committer must settle only after the physical attempt is terminal; a detached remote timeout does not satisfy it. Typed request IDs reserve room for generated history keys. Resource lease failures retain recoverable protection and cannot replace a committed receipt.

The 14-case suite uses real SQLite and public Model/Library validation plus explicitly scripted protocol planners/resource/feasibility roles. Those test scripts are not the future UI/DSL production registration. No web service or visible-browser behavior is claimed by this capability slice.

Specs: `docs/specs/authoring`; evidence: `quality/acceptance-evidence/authoring-*`. One bounded A1/A2 audit round and one independently verified fix round are complete. All14 cases pass; file-level evidence remains distinct from future host/browser proof.
