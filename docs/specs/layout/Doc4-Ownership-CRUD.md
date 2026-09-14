# Capability: layout — Ownership / CRUD

|Record|Create|Read|Update|Delete|
|---|---|---|---|---|
|Canonical intent/locks|Model/Authoring|Measured projection|Never Layout|Never Layout|
|Measured content/notation + supplemental metrics|Presentation|Layout exact read|Never remeasure|Discard reference|
|Scene geometry/routes|Layout derives|Canvas/Export/Authoring preview|New immutable derivation|Discard cache|
|Native engine state|Adapter per job|Adapter only|Confined native mutations|finally/dispose|
|Previous scene cache|Host|Layout validates hint|Host replaces by inputKey|Host eviction|
|Camera/selection/draft|Canvas/host|Not required here|Never Layout|Never Layout|
|Job lifetime|Host scheduling|Layout checkpoints|Host cancels/terminates|Host releases worker|

## Integration / recovery

|Path|Outcome / owner|
|---|---|
|Candidate→Presentation→arrange|All required constraints inspected; Authoring alone commits|
|Human drag/resize/route edit|Authoring receives explicit geometry intent; Layout returns valid geometry or recoverable rejection|
|Agent semantic patch|Surviving soft positions favored; unaffected local sections reused; no camera mutation|
|Native crash / cancelled job|Typed error; host releases worker, preserves visible scene; retry uses same inputs|
|Hard conflict|Named offending targets; user removes contradictory constraints/locks, never silent downgrade|
|Export|Exact revision's scene/content packaged by Export, no rerouting in exporter|

No semantic mutation events. Scene inputKey records full projection, options, engine versions and relevant prior hints; local section keys exclude unrelated revisions/camera. Stale jobs cannot overwrite newer scenes. Imported payload strings are data, not instructions or execution authority.
