# Modules and contracts
|Owner|Input→output|Failure/recovery|
|---|---|---|
|Model|unknown intent→checked LayoutIntent|Reject noninteger/out-of-range/non-grid columns; caller corrects intent|
|Language|columns=N → intent → printable DSL|Unknown/invalid DSL has source diagnostics; print retains explicit columns|
|Language patch|set/unset collection/section columns; replace section for group columns|Set changes only requested field; unset removes columns; unrelated patches preserve it|
|Layout|checked intent + measured nodes→grid placement|Independent contract rejects invalid values; existing derive failure remains typed|
|Authoring|compiled requested change→validated candidate→commit|Existing gate remains sole diagram mutation route|

No metric-bearing style changes in PR1. Existing media/role blocks, groups/represents, relative constraints and sequence alt/loop/opt provide composition vocabulary. PR2 owns heading metrics; PR3 admission. PR4 owns compactness; PR5 routes. Collection grid controls section arrangement, section grid controls top-level nodes/groups, group grid controls children.
