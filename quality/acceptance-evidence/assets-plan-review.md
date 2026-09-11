# Assets plan review — one round

Fresh-context assets_plan_pressure, capability-only,8minute timeout; one finding. Independently verified by tracing stage(D) → GC deletes unreferenced D → reserve(D) succeeds while absent → binding commit. Reservation alone cannot prove bytes exist.

| Category | Finding | Verified disposition |
|---|---|---|
| major build risk | Reserve-before-commit can admit a missing digest | Existing-byte binding requires successful acquire, held through commit. Reservation requires successful protected stage/verification before binding. Counterexample retained within frozen test9; count remains10 |

One fix round only, no second review. Builder also made already-required SVG attribute policy and restore format detection explicit; no new capability responsibility. Before2508words/185lines; after counts recorded alongside, per-doc/total <=20% verified. Exact10-test budget frozen now.
