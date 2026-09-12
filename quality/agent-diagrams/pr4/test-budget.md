# PR4 frozen test budget

|#|Test name|Tier|Type|Loop/nightly|Maintenance|Reason for / against|Covered by|Retires when|
|---:|---|---|---|---:|---|---|---|---|
|1|Directional measured spacing remains independent across four directions and nested scopes|fast|contract|0.2s/0.2s|medium|Catches axis transposition, global-label inflation and native unequal-box overlap (95%); geometry assertions may need upkeep after an intentional engine change (30%)|Arrangement cases 1–5 cover deterministic placement, grids, constraints and history, but not independent flow/cross reservations|Placement seed contract is replaced|
|**Total**|**1 new definition**|||**0.2s/0.2s**||||

Existing Model case `validate layout intent` gains ER/modules grid compatibility assertions. Existing Layout case 5 gains version-invalidation/history proof; case 6 gains wide-alt containment; native case 11 records the ELK layered tree normalization options. No new E2E or routing-quality case.
