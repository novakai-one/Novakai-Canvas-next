# Capability: assets — Ownership / CRUD

| Data | Create | Read | Update | Delete | Authority |
|---|---|---|---|---|---|
| Normalized immutable bytes | validated stage / reserved restore stage | resolve / read lease | never overwrite | consistent unreferenced collection | Assets |
| Mechanical descriptor | normalized media processing | resolve/stage outcome | immutable per digest | with unreferenced blob | Assets |
| Alt/provenance submission | caller supplies checked metadata | returned Admission | caller creates new submission | no global metadata copy | Model binding after Authoring |
| Lease | acquire/reserve atomically | scoped read/stage/collector | digest set immutable | release/proven-dead recovery | Assets |
| Reachability snapshot | injected authoritative reader | collector under maintenance transaction | not cached as truth | discard after call | Authoring/history/preset owners |
| Asset binding/admission record | Authoring commits | semantic owners | Authoring | Authoring | Outside this capability |

| Operation | Required protection | Failure effect |
|---|---|---|
| stage | validation before immutable write | no binding; possible safe orphan file on crash |
| acquire | every requested blob verified + atomic lease insertion | no lease if any missing |
| reserve | atomic lease insertion even for absent blobs | no phantom durable binding |
| lease.stage | reserved identity/hash/safety + final active-lease check | no unreserved bytes admitted |
| collect | maintenance lock + authoritative references + live leases | never claim complete report after IO uncertainty |
| release | exact lease identity; idempotent delete | caller retries; conservative retained pins |

GC is a maintenance action, not a side effect of rendering, closing a collection or failed authoring. Staged files may be collected only when unreferenced and unleased. Persistent binding admission must acquire existing bytes before main commit; reserve alone is insufficient until protected stage/verification succeeds. Offline operation uses local bytes; provenance URLs are labels, not instructions to fetch.
