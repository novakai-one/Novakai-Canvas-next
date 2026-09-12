# Entities and invariants
|Entity|Fields/invariant|
|---|---|
|PlacementProblem|spacing=cross-axis seed minimum; layerSpacing=flow-axis seed minimum; finite positive boundary clearances|
|Routing reservation|Measured label extent along local flow axis plus endpoint marker approach/clearance; cross-axis gap does not inherit unrelated longest label|
|Layout scope|Each nested group uses its own direction/gap; child-local wires do not inflate parent scope|
|Engineering grid|ER/modules accept grid as alternative to layered; relationships/cardinality/type validation unchanged|
|Sequence|Participant order and baseline, message labels, fragment/activation containment remain correct after metric changes|
|History|Policy version invalidates cache, not history preferences. Compactness proof uses fresh creation/explicit reset; human locks remain required|

|Files in scope|Estimated final LOC|
|---|---:|
|layout/contract/records/{problem,engines}.ts|100;20|
|layout/core/placement/{spacing,policy,groups,grid}.ts|80;100;170|
|layout/adapters/elk.ts|110|
|model/core/sections/modes.ts|150|
|layout/core/sequence/{participants,sequence,events,frames}.ts|80–180|
|Existing layout/model tests and fixture constructors|100–750|

Sequence changes only where integrated measurements expose a failing named acceptance case. No speculative algorithm. Fixed coordinates remain app-derived. Explicit locks can prevent compactness; report conflicts without weakening constraints.

Grid maps flow/cross minima to x/y for right/left and y/x for down/up, retaining physical columns. Tree must translate verified native options or normalize measured seeds; layered-only settings do not count. Each group computes local reservations.

Cross-axis floor: local wires reserve 3×clearance+maximum marker advance, independently of labels and tree ranking; wire-free scopes retain semantic gap.
