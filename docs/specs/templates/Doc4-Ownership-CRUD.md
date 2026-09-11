# Capability: templates — Ownership / CRUD

| Record | Create | Read | Update | Delete |
|---|---|---|---|---|
| Recipe/theme version | Templates validates/plans; Authoring admits | Templates exact pin/read/list | Never overwrite; add new version | No baseline delete; retain pinned versions/history |
| Catalog snapshot | Authoring supplies stored admitted presets | Templates validates structural/hash/closure | Templates returns candidate; Authoring CAS commits | Authoring workspace maintenance only |
| Expansion | Templates+injected syntax codec computes | UI/CLI previews same intent | Ordinary Model edits after Authoring commit | Discard uncommitted plan freely |
| Theme token meaning | Injected DesignSystem resolver | Templates stores resolved typed artifact | New immutable preset | Existing pin never implicitly removed |
| Media bytes/bindings | Assets stages; Authoring binds | Exact dependency manifest | New digest/new binding | Assets only with authoritative reachability |
| Shipped recipe DSL | Repository resources | Host passes to required Language bridge | New shipped version | No migration of existing instances |

## Integrations and failures

| Operation | Input authority | Output / recovery owner |
|---|---|---|
| Save reusable recipe/theme | User content + authoritative catalog | Admission plan; Authoring validates read dependencies, acquires assets and commits |
| Choose latest | Current immutable catalog | Exact Pin recorded in preparation; receipt replay uses original pins |
| Instantiate/preview | Exact pin + unique instance namespace | Ordinary intent + dependency manifests; Authoring/Presentation/Layout validate/preview |
| Import/restore | Untrusted portable records | Re-admit through codecs and exact hashes before storage; no validation bypass |
| Hash/codec failure | Injected collaborator | Typed failure, no writes; caller corrects input or rebinds provider |

No notifications, database lifecycle, UI components, filesystem discovery, CSS generation, layout engine or parser inside this capability. Host bridges consume public contracts only. CLI and browser service use identical admission/expansion behavior; they differ in acquisition/transport, not policy.
