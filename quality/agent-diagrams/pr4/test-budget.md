# PR4 frozen test budget

|#|Test name|Tier|Type|Loop/nightly|Maintenance|Reason for / against|Covered by|Retires when|
|---:|---|---|---|---:|---|---|---|---|
|1|Directional measured spacing remains independent across four directions and nested scopes|fast|contract|0.2s/0.2s|medium|Catches axis transposition, global-label inflation and native unequal-box overlap (95%); geometry assertions may need upkeep after an intentional engine change (30%)|Arrangement cases 1–5 cover deterministic placement, grids, constraints and history, but not independent flow/cross reservations|Placement seed contract is replaced|
|2|ER marker cross-clearance across native/grid, four directions and two label extents|fast|contract|<1s/<1s|medium|Directly catches the accepted 23-unit marker impossibility and label-dependent cross inflation|Existing reservation case supplies arrow/reference and nested-scope checks|Native checkpoint policy is replaced|
|**Total**|**2 retained new definitions**|||**<1s/<1s**||||

Existing Model case `validate layout intent` gains ER/modules grid compatibility assertions. Existing Layout case 5 gains version-invalidation/history proof; case 6 gains wide-alt containment; native case 11 records the ELK layered tree normalization options. No new E2E or routing-quality case.

Combined correction uses the authorized ≤3 budget: one additional retained ER test, all A2 assertions extend existing tests. A temporary native-tree diagnostic (third definition during verification) required success, passed, and was folded into the existing tree case as a permanent positive acceptance helper. No E2E, skipped/todo case or failure-inversion assertion.

Single additional sequence alignment extends existing case 6 only: compact/normal/roomy geometry, measured-box/order assertions, native public inspection and a tall/wide branch heading. **0 new definitions; 2 retained PR4 definitions unchanged.** Read-only corpus probes use a temporary standalone harness, not new Vitest definitions.
