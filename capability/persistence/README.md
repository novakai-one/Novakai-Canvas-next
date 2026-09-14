# Persistence

Owns atomic versioned storage, receipts, recovery and consistent backup/restore. Semantic document admission belongs to Authoring.

Use `contract/index.ts`. `openSqlite(location, workspaceId)` creates the Node service; all operations return typed results. Node24.13+ is required; native SQLite currently emits an experimental API warning. File mode uses WAL/FULL durability; `:memory:` deliberately does not survive close.

Records are JSON envelopes inside SQLite. Every mutation has explicit expected versions; successful retries return the original receipt. Restore targets a new empty location, requires injected domain validation and protected resource staging, and never switches the host automatically. On an uncertain commit, reopen/reconcile before retrying or activating a restored location.

Specifications: `docs/specs/persistence/`. Actual host composition, Assets leases and Model/Library restore validation are connected during the remaining capability/UI delivery; in-process injected providers are the present integration evidence.
