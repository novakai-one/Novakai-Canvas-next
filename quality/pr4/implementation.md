# PR4 implementation — balanced arrangement

Branch `feat/diagram-arrangement`; isolated worktree `Novakai-Canvas-next-arrangement`. No agents, audits, shared/private service, browser automation, UI work, push or PR creation occurred. The original course-enrollment, sensor-gateway, equipment-return, field-research and library-reservation DSL was inspected beside the four supplied before captures before implementation.

## Delivered contract and decision

Layout now treats frozen public `PlacementProblem.spacing` as the cross-axis sibling boundary minimum and required `layerSpacing` as the flow-axis layer boundary minimum. Each section/group contracts only its local edges and derives reservations using its own direction. Flow reservation includes marker advances, route clearance and the measured label extent. Cross reservation independently uses `max(semantic gap, 3 × clearance + maximum local marker advance)` for wire-bearing scopes; wire-free scopes retain semantic gap. Labels do not inflate sibling spacing.

Grid placement maps flow/cross gaps onto physical x/y axes for right, left, down and up while retaining explicit physical column membership. Model admits `grid` for ER/modules without changing wire, cardinality, key or member semantics.

Decision: tree placement keeps the validated Model parent topology but normalizes its seed with ELK layered. ELK Mr. Tree's recorded `knownOptions` has no independent layer-spacing option, so none was invented. Reference/annotation edges are excluded from tree ranking but included in local corridor reservations and the routed scene. The original valid-tree fixture now requires and achieves native success; broader native acceptance remains an open PR5 integration gate. ELK receives `spacing.nodeNode` for siblings and `layered.spacing.nodeNodeBetweenLayers` for layers.

Sequence parent-frame union now includes measured alternative branch boxes. The wide-heading probe retains all messages, nested operators and activations. Locks remain solver requirements. Placement/policy version bumps invalidate exact derivation keys; previous geometry remains a preference. Fresh creation and the existing explicit-columns reset path provide compactness proof without deleting history.

## Counts and scope

- Five frozen PR4 docs: baseline **509 words / 57 lines**; final **602 / 63**. Growth is **18.3% / 10.5%**, below 610 words / 68 lines.
- Production: the same 10 PR4 files. Tests: the same 2 files; **2** retained new test definitions against the ≤3 budget, including the ER cross-clearance regression. Existing direction, grid membership/history, locks and sequence assertions remain.
- Evidence/spec: the five supplied docs, supplied pressure/disposition/native-option/capture artifacts, frozen test budget, this report and `standards.md`.
- No Presentation, Language, Assets, Authoring, CLI, UI, render-job or routing-algorithm file changed.

## Validation

- `pnpm check` passed: TypeScript, ESLint/Sonar ≤2, Prettier, 821-module/1,943-dependency architecture gate, **51 files and 172/172 tests**.
- Focused Layout/Model suites passed: **8 files / 35 tests**. Real bundled ELK proves measured flow/cross clearances; labelled unequal grids assert physical boundary gaps in all four directions. Tree seeds assert exact parent ID/source/target at a deliberate solver-boundary stop before routing. Separate native tree acceptance requires successful arrangement, complete wires and valid inspection. The prior statement treating asserted routing failure as acceptable evidence was wrong and is withdrawn.
- Existing arrangement case 5 distinguishes exact reuse from version-triggered re-derivation while retaining equal preferred geometry. Existing explicit-column cases continue to prove reset/history behavior and locks. Existing sequence case 6 proves wide branch/parent containment and retained nested content.
- No service or browser probe was authorized in this correction round. Root must freshly re-probe the corpus after integration: prior evidence remains 20/24 commits, with habitat survey, emergency dispatch, equipment return and pre-existing payroll blocked. Automated seed/fixture success does not close that acceptance gate.

The author file-score matrix is in [standards.md](standards.md). Native test-fixture grading remains pending the user; no assertion was weakened and no test-file score was invented.

One combined verified A1/A2 correction, no additional audit/review round. Details and remaining gates: [correction evidence](../agent-diagrams/pr4/correction-evidence.md).
