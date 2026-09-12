# Single verified plan correction

|Finding|Verification|Disposition|
|---|---|---|
|Infeasible candidate aborts search|libavoid readRoute throws plain Error; protectedRoute maps all errors to engine-failed. Native routing ownership must distinguish search infeasibility.|Accept explicit owned distinction; skip only infeasible, propagate operational/cancelled.|
|Parallel routes start globally|native.parallelCheckpoints unions every node; wires.labelled immediately accepts a fitting label.|Accept local initial lanes and distant-unrelated-node assertion, not only blocked-label retries.|
|Fallback budget ambiguity|Doc2 omitted final outside attempt although objective requires it.|Accept one separate inspected fallback after ≤8 local alternatives.|

No repeat pressure test. No source changes in this correction.
