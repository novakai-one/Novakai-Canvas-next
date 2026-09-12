# Modules and contracts
|Module|Input→output|Failure|
|---|---|---|
|Endpoint resolver|Measured nodes+wire intent→attachments|Missing/incompatible member remains rejection|
|Corridor planner|Attachments+measured label+obstacles→bounded candidate checkpoints|No whole-reference topology knowledge|
|Native adapter|Owned route problem→points|Candidate infeasibility is distinct from operational failure/cancellation|
|Label allocator|Inspected routes+occupied rectangles→label box|No available adjacent corridor rejects|
|Scene inspector|Candidate vs authoritative measurements/constraints|Dishonest labels, anchors, marker clearance rejected|

Skip infeasible candidates within budget; propagate operational failure/cancellation immediately. Never parse error messages.

Existing source-side/target-side and orthogonal/curve controls remain agent-facing. Internal candidate exploration may change automatic routes only. Crossing warnings remain honest; nonplanar graphs do not imply invalid geometry. No blanket zero-crossing promise.
