# Capability: persistence — Responsibility and target tree

**Responsibility:** preserve atomic, versioned workspace records and request receipts across failures, and transfer complete verified backups into an empty destination.

| Consumer | Job |
|---|---|
| Authoring service | Read consistent records; conditionally commit records/history/receipt; reconcile retries |
| Workspace maintenance host / CLI | Capture backup; validate and restore into a new location; retain old location |

```text
capability/persistence/
  contract/
    index.ts  api.ts  compose.ts  types.ts  errors.ts  brands.ts
    records/{storage,transaction,backup}.ts
    ports/{store,database,resources}.ts
  core/
    validation/{outcomes,state,request}.ts
    transaction/{keys,versions,receipts,commit}.ts
    recovery/{backup,restore,resources}.ts
  adapters/sqlite.ts
  tests/{fixtures,storage-harness,resource-harness,store.contract.test,backup.test}.ts
  package.json
```

Public entry: contract/index.ts. Core imports own declaration contracts/core only. SQLite adapter imports declaration contracts; no core/sibling adapters. Only compose binds SQLite. Node 24.13+ host supplies database location; no filesystem paths in domain records. JSON payloads are semantic-owner documents, not a second DSL.

| Owns | Excludes |
|---|---|
| Physical atomicity, version tokens, receipt uniqueness, structural recovery, backup envelope | Diagram/catalog invariants; edit admission; history meaning; asset sanitization; host activation |
| Consistent snapshot and explicit typed failures | Notifications; camera/UI; authentication; automatic migration/reset of damaged storage |

No events published here: Authoring publishes committed revision hints after success. One local SQLite authority serves browser/CLI clients. No blind write public API; adapter construction belongs to application composition, never UI feature code.
