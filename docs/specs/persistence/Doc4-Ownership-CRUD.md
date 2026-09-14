# Capability: persistence — Ownership / CRUD

| Data | Create | Read | Update | Delete | Meaning owner |
|---|---|---|---|---|---|
| Workspace envelope | open empty store | readSnapshot | atomic commit/restore | explicit host location maintenance | Persistence |
| Record slot | conditional put | consistent snapshot | put increments version | delete retains tombstone | Semantic owner via Authoring |
| Receipt | atomic successful/no-op commit | receipt/readSnapshot | never | never during workspace lifetime | Authoring outcome; Persistence identity/durability |
| History payload | Authoring supplied write | opaque snapshot | Authoring transaction | explicit history maintenance write | Authoring |
| Asset bytes | stage via Assets port on restore | backup under lease | immutable | Assets reachability collection | Assets |
| Backup bundle | backup | inspect/restore parse | immutable | caller artifact lifecycle | Persistence envelope |
| Current database location | host startup | host preferences | switch after restore succeeds | retain prior for recovery | Application host |

| Operation | Preconditions | Atomic result / failure |
|---|---|---|
| readSnapshot | structurally valid state | detached state or typed corruption |
| commit | matching workspace; unique request; complete matching read set | slots+receipt together, or none |
| receipt | valid request ID | receipt or null, no writes |
| backup | valid snapshot; complete resource lease; hash verification | complete bundle or typed error |
| restore | valid bundle/domain/blobs; pristine same-workspace destination | verified state installs under blob reservation; known precommit failure leaves state untouched; uncertain commit requires reopen/inspect |
| close | open driver | close success or typed failure; subsequent operation storage-unavailable |

A caller cannot repair damaged records by committing over them. New-schema records require explicit migration outside this version. Transport authorization and service ownership prevent direct untrusted storage calls. All user/agent changes continue through Authoring.
