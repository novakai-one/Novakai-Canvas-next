# Capability: export — Target repo tree

**Responsibility:** produce revision-consistent, portable reading/editing artifacts and prepare validated imports for Authoring.
**Owns:** artifact envelope, format selection, print pagination, offline reading document, transfer manifest, resource integrity and import namespace preparation.
**Excludes:** domain/notation validation, layout/routing algorithms, asset/preset admission, authoritative writes, request receipts, transport downloads and workspace switching.

```text
capability/export/
  contract/{index,api,compose,types,brands,errors,native-modules.d}.ts
  contract/records/{input,artifact,bundle,manual,pages,limits}.ts
  contract/ports/{snapshot,documents,resources,encoding,formats}.ts
  contract/render-types.ts
  core/artifacts/{produce,pages,scope,identity}.ts
  core/bundles/{manifest,inspect,prepare,manual,order,resources,completeness}.ts
  core/validation/{outcomes,canonical}.ts
  adapters/svg/{scene,nodes,wires,sequence,markers}.tsx
  adapters/native/{png,pdf,fonts,woff2,media,encoding}.ts
  adapters/html/{document.tsx,reader.css}
  tests/fixtures.ts; tests/{artifact,bundle,import,native}.test.ts
  package.json
```

**Imports:** consumers→contract/index; core→own declarations/core only; declaration input aliases may reference public Model/Layout/Presentation records. Compose alone binds concrete adapters. Adapter collaborators injected; no sibling behavior imports. No CLI/HTTP/filesystem download implementation inside Export.
**Consumers:** service/CLI export and embedded offline-delivery host share the callable contract. React static composition uses Presentation slots already used by Canvas; no alternate notation policy or layout engine.
