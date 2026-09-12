# PR4 — balanced automatic arrangement
Responsibility: turn measured diagram composition into compact, deterministic geometry; preserve semantic topology and explicit placement constraints.

|Path|Responsibility|
|---|---|
|layout/core/placement/|Axis-aware spacing and measured scope seeds|
|layout/adapters/elk.ts|Translate owned spacing into native options|
|layout/contract/records/problem.ts|Independent sibling/layer spacing contract|
|model/core/sections/modes.ts|Engineering grid compatibility|
|layout/core/sequence/|Participant/message/fragment geometry|

Depends integrated PR2+3 metrics/fonts. No rendering typography, DSL parsing, resource admission or UI panels. Reuse native solvers and inspection; no reference-specific policy.
