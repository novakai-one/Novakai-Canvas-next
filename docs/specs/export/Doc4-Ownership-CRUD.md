# Capability: export — Ownership / CRUD

| Record | Create | Read | Update | Delete |
|---|---|---|---|---|
| Export request | caller supplies intent | Export parses | none | caller lifetime |
| Snapshot lease | owning SnapshotReader | Export exact revision | none | owner release; Export ensures attempt |
| Scene/canonical collection | Model/Presentation/Layout | Export admitted snapshot | never Export | never Export |
| Artifact | Export encoding | caller/preview/download | immutable; rerun creates artifact | host/file owner |
| Page plan | Export pure tiling | native encoder | new plan | operation lifetime |
| Bundle | Export full semantic/manual transfer | Export strict inspection | immutable external input | caller |
| Resource bytes/pins | Assets/Templates/Presentation owners | Export retained verified copies | never Export | never Export |
| Prepared import | Export reconstruction/namespace preparation | host Authoring planner | reprepare on correction | caller draft lifecycle |
| Catalog membership, admissions, collection revision | Authoring commit | owner contracts | never Export | never Export |

**Write boundary:** download writes are host effects. Resource staging is host/Assets work; authoritative import admission and collection/catalog commit go through Authoring. Export has no persistence handle, global filesystem location or network client.
