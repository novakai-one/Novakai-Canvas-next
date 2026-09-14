# Capability: library — Ownership / CRUD

| Object | Create | Read | Update | Delete |
|---|---|---|---|---|
| Catalog | Host supplies initial empty checked catalog | validate, plan, query through public index | plan returns candidate; Authoring admits/commits | Workspace lifecycle outside Library |
| Folder | create-folder plan | validation, discovery | replace-folder plan | remove-folder reject/rehome plan |
| CatalogEntry | register plan | validation, discovery | replace-entry plan (move/order/archive/restore) | unregister plan, coordinated with collection deletion |
| CollectionProjection | Host maps authoritative committed/proposed collection | validation, plan, query | Rebuild from changed source revision | Omitted when source collection deleted |
| RecentVisit | Host supplies recorded preference | query/validation | Host supplies new immutable preference snapshot | Host preference policy; stale visits filtered on deletion integration |
| SearchHit / QueryPage | query | Browser/CLI through public index | Recompute | Discard |
| CatalogPlan | plan | Authoring | Never mutate; recompute | Discard |
| Cursor | query for next page | query only | Recreate per page | Discard on changed query/snapshot |

Library emits no durable events. Catalog is the only authoritative record it plans. Projection titles, descriptions and visits never become catalog fields. A combined collection/catalog creation or deletion commits through one Authoring transaction; standalone registration against missing inventory fails.
