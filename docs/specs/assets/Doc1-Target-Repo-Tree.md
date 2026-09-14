# Capability: assets — Responsibility and target tree

**Responsibility:** admit safe immutable media, resolve exact content identities offline, and protect referenced/staged bytes from premature collection.

| Consumer | Job |
|---|---|
| Authoring / Language host | Stage local file bytes, receive exact identity and metadata, reserve bytes through commit |
| Presentation / Export | Resolve pinned media, dimensions/font metrics and accessible attribution |
| Persistence maintenance | Verify backup bytes, acquire read leases, reserve restore staging, release leases |

```text
capability/assets/
  contract/{index,api,compose,brands,errors,types}.ts
  contract/records/{media,lease}.ts
  contract/ports/{storage,media,identity,reachability,native}.ts
  core/admission/{stage,validate}.ts
  core/resolution/resolve.ts
  core/reachability/{leases,collect}.ts
  core/validation/outcomes.ts
  adapters/{sqlite-files,files,raster,svg,font,detect,identity}.ts
  tests/{fixtures,harness,admission.test,storage.test,leases.test}.ts
  package.json
```

Public entry contract/index.ts. Core imports own declaration contracts and own core only; no Model/Persistence dependencies. Each media adapter depends on own declarations and third-party library only; compose binds media handler registry and storage/identity adapters. Concrete files/SQLite are host details; imported asset bindings become diagram state only through Authoring.

Owned: supported media safety policy, normalized byte identity, blob descriptors, transient/retained resource leases, unreferenced blob collection. Excluded: diagram asset aliases/alt edits, network downloading, license adjudication, history retention policy, CSS themes/font selection, app activation. No events emitted. Host binds loopback upload, filesystem reading and provenance UI; Assets never fetches a user URL.
