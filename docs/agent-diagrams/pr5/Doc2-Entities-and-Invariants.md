# Entities and invariants
|Entity|Invariant|
|---|---|
|RoutePlan|Exact measured row/port endpoint, authored side if present, source/target marker approach|
|Automatic corridor|Deterministic bounded candidate set; prefer local clear routes before whole-scene detours|
|Label|Adjacent to its actual segment; no overlap with content, markers, accepted labels or wire paths|
|Cycle/parallel edge|Separate readable lanes without unnecessary travel across unrelated nodes|
|Manual route|Valid manual points retained exactly; locked invalid route rejects|
|Candidate ordering|Length, bend count, stable candidate index; rank only candidates passing independent checks|

|Files|Estimated final LOC|
|---|---:|
|layout/core/routing/{wires,native,labels,endpoints}.ts|100–330|
|New layout/core/routing/{corridors,lanes}.ts|120;110|
|layout/contract/records/engines.ts; contract/errors.ts; adapters/libavoid.ts|20;50;240|
|Existing layout/tests/{routing,contracts}.test.ts|100–720|

Initial route → at most eight local alternatives → one inspected outside fallback → typed failure naming target; never detach a label, skip a wire or relax a lock. Single source of label candidate generation remains shared by renderer input and independent inspection.

Automatic parallel/cyclic initial lanes use endpoint-local bounds, including already-valid labelled routes; unrelated distant nodes cannot define their lane.

Full measured marker rectangles clear content in planning/inspection. Reciprocal/parallel routes share only endpoint stubs. Optional approaches remain distinct when required advances permit.
