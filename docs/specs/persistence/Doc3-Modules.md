# Capability: persistence — Modules

### contract/api.ts
**Exposes:** createPersistence(store:StorePort,workspace:WorkspaceId):Persistence; methods readSnapshot(), commit(input:unknown), receipt(request:unknown), backup(resources), restore(input:unknown,resources,validateDomain), close(). All return typed Results; backup/restore are async, remaining methods synchronous.
**Imports:** own core + declarations. Public facade hides raw transaction callback; no host imports.
**Contract:** unknown boundaries parse/detach/freeze. Store exceptions map storage-unavailable. Authoring owns failed-request correction, stale-plan reprepare and receipt reconciliation. Maintenance host owns backup/restore retry and activation.

### contract/compose.ts
**Exposes:** openSqlite(location:string, workspace:unknown, openDatabase?:NativeDatabaseFactory):Result<Persistence>.
**Imports:** api, own SQLite adapter, node:sqlite DatabaseSync; declaration schemas.
**Contract:** host supplies trusted location; database/schema open failures typed. Node24.13+; SQLite API experimental status recorded. Optional opener is a narrow native-driver composition/test seam. No silent fallback to memory. ':memory:' is explicit ephemeral mode, suitable second consumer/harness. File mode is durable.

### contract/ports/store.ts
**Exposes:** StorePort.transact<T>((stored:unknown)=>Result<{state:WorkspaceState,value:T}>):Result<T>; close():Result<void>.
**Contract:** serialized callback, one atomic snapshot; only install returned state on success. Raw loaded state may be corrupt; core must validate it. Rejected callback rolls back. No callback escapes or deferred write. Caller cannot access StorePort through Persistence facade.

### contract/ports/database.ts; adapters/sqlite.ts
**Exposes (composition only):** DatabasePort.exec(sql), read():unknown, write(serialized), close(); createSqliteStore(database,workspace).
**Contract:** adapter owns SQL transaction/rollback sequence and JSON envelope durability; injected driver keeps tests independent of filesystem failure timing. Driver read/write are prepared statements bound to singleton row. Unknown errors are typed at adapter boundary. A rollback failure still returns storage-unavailable and requires reopen/reconciliation; never claim rollback succeeded.

### core/validation/{outcomes,state,request}.ts
**Exposes (private):** bounded JSON parse, frozen Result, state structural checks, request checks.
**Contract:** P01/P03/P07/P08. Unknown schema version returns unsupported-version; malformed stored payload corrupt-record; malformed request invalid-input. State validation does not invoke Model/Library on every read; Authoring admits semantic documents.

### core/transaction/{keys,versions,receipts,commit}.ts
**Exposes (private):** key comparison, read token, conditional write planning, receipt reconciliation.
**Contract:** P02–P07; synchronous pure plan. Exhausted sequence/version rejects before mutation. Receipt versions list changed keys only, preserving write order. No-op versions=[]; original expected versions are Authoring history facts if required. No time/random dependency.

### contract/ports/resources.ts; core/recovery/backup.ts
**Exposes:** BackupResources.acquire(digests):Promise<Result<ResourceLease>>; lease.read(digest):Promise<Result<string>>; lease.release():Promise<Result<void>>; VerifyBlob(digest,base64):Promise<Result<void>>.
**Contract:** Assets composition owns GC exclusion and byte safety; read base64 must encode bytes verified against SHA256. Lease protects all requested digests or fails atomically. Backup accepts {acquire,verify}; synchronous record snapshot copied before acquisition. If GC wins acquisition race, reject/retry; never claim resource snapshot without lease. Release failure prevents successful backup result; Assets owns abandoned-lease recovery.

### core/recovery/restore.ts
**Exposes:** RestoreResources.verify(digest,base64); reserve(digests):Promise<Result<RestoreLease>>; lease.stage(digest,base64):Promise<Result<void>>; lease.release():Promise<Result<void>>; ValidateDomain(state):Promise<Result<void>>.
**Contract:** P10/P11. Verify all bytes + injected Model/Library/reference checks before staging. Reservation excludes destination GC until released after installation/failure; staging is durable/idempotent. Host supplies new destination's Assets adapter. Restore consumes only StorePort.transact; its private entry also catches provider rejections. Conditional pristine-destination install occurs last; concurrent destination commit rejects restore. Domain validator receives whole parsed state, never adapter tables; it must validate catalog/collections and their cross-references. No default approving validator. Uncertain installation or release failure requires reopen/inspect destination before activation/retry; failure does not imply absent installation.
