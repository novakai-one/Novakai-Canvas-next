# Capability: canvas — Build & test appendix

**Build:** contracts/admission → indexed scenes/camera → selection/gesture/draft transitions → reading/outline → session adapter → actual React Flow bindings/route controls → contract verification.
**Frozen budget:16 behavioral cases / five suites.** No E2E. Each case tests public API or actual React binding contract; no tests of private helper names. Existing Layout tests cover route feasibility; Authoring tests cover commit/conflict/receipts; Design System tests cover primitive focus/tokens. Canvas cases cover their interaction boundary only.

|#|Independent oracle|
|---|---|
|1|Initial fit vs restored camera; clicks, inspect and accepted scene revisions retain exact camera|
|2|Known screen/world transform, pointer-anchored zoom, clamp and dock resize center preservation|
|3|Wheel/trackpad/Space/middle/Hand/Shift/typing precedence and fine/coarse drag thresholds|
|4|Scoped select/toggle/marquee/keyboard navigation; duplicated canonical appearances remain independent|
|5|Many drag updates→one local placement intent; no-op/Escape/pointer cancel→none|
|6|Nested group+section move avoids double deltas; resize honors measured minimum and parent-local coordinates|
|7|Route points/sides and keyboard bend updates→one intent; invalid point counts/identities reject|
|8|New scene during gesture retains recoverable draft/current committed view; A displayed/C requested/B received retains A and rejects B; stale generation/hash/revision cannot replace scene|
|9|Rejected/disconnected/pending/read-only (including mutation-available=true) edits retain drafts and emit no unauthorized mutation; confirmed only removes matching draft|
|10|Connect endpoint selection/label handoff, local deletion scope, duplicate/align/nudge typed intents with current base|
|11|Reading order/collapse/next/exit restores editing camera+selection without changing scene data|
|12|Accessible outline includes ER rows/cardinalities, typed members, labels, alt text and nested sequence alternatives|
|13|Admission failure/bad geometry/references/limits/profile and foreign collection reject; no partial state|
|14|Actual session subscription cached identities, cleanup, queued effect exactly-once drain, listener failure and dispose|
|15|Actual React Flow bindings render custom nodes/edges/sequence/labels/markers from slots, controls/minimap accessible and no fake fallback; stable registry and transient flags|
|16|Actual binding callbacks translate drag/select/cancel/viewport/route events; CSS scopes, cleanup and field-interaction guards; no direct persistence path|

All16 fast contract/component cases; projected added loop cost≤4s. DOM cases15–16 are adapter contracts, not proof of trackpad/drag usability. Before build, quality/canvas-test-budget.md records each case's cost, duplication check, confidence, counterargument and retirement condition; count/list fixed.
**Part2 mandatory:** visible browser each canvas state/controls/outline/route editor; human create/drag/reload/server restart; agent mixed diagrams and concurrent human draft; actual1000nodes/1500wires/10sections performance protocol F50. No unit timing or screenshot substitutes for those outcomes.
**Review:** one fresh-context plan tester≤8min; findings engineering violation/major build risk/preference/minor only. One verified fix; each-doc+aggregate words AND lines≤20% growth. Build A1 fidelity/standards and A2 assertion correctness≤3 concrete challenges;≤8min/≤5targets each; one verified findings-only fix, no re-audit.
**Gates:** >144/160 every first-party code/CSS file; Sonar≤2; named-function TSDoc+explicit returns; type/lint/format/import/cycle/public tests; no fake adapters. Host integration coverage declared honestly.
**Dependency:** pin MIT @xyflow/react; existing React19.3; official [interaction API](https://reactflow.dev/api-reference/react-flow) and [performance guidance](https://reactflow.dev/learn/advanced-use/performance). Commercial Pro is not required. Native routed geometry remains Layout-owned.
