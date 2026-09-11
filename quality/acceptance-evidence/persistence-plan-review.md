# Persistence plan review — one round

Fresh-context reviewer persistence_plan_pressure; bounded to8minutes and five Persistence docs plus baseline ownership reference. No other capability audited. Frozen budget9definitions/14executed cases.

| ID | Category | Finding | Independent verification | Disposition |
|---|---|---|---|---|
| P-01 | major build risk | Staged restore bytes could be collected before install | Verified: stage A, await B, GC sees no document references to A; install then points at vanished A | Added destination reservation from staging through install, release afterwards |
| P-02 | major build risk | Failure incorrectly promises no installed state after uncertain COMMIT | Verified: durable COMMIT followed by lost acknowledgement is indistinguishable from failed acknowledgement to caller | Limited untouched guarantee to known precommit failures; reopen/inspect before retry or activation; old location retained |

No second pressure test. Both findings presumed incorrect until the above counterexamples were independently traced. Counts before2319words/186lines; final counts stored alongside this record; <=20% per-document and total limits checked. Initial schemas/internals remain builder choices inside these contracts.
