# Capability: authoring — Target repo tree

**Responsibility:** admit human/agent intents; prepare validated changes; conditionally commit one atomic transaction; reconcile retries; maintain reversible participant history. No alternate write entry.
**Owns:** request identity, complete preconditions, admission sequencing, history/receipts, revision outcomes.
**Excludes:** DSL parsing, diagram rules, catalog rules, geometry algorithms, blob decoding, transport authentication, physical storage, UI drafts/camera.

```text
capability/authoring/
  contract/
    index.ts  api.ts  compose.ts  types.ts  brands.ts  errors.ts
    records/{storage,request,proposal,history}.ts
    ports/{store,planning,resources,runtime}.ts
  core/
    validation/{input,outcomes,snapshot}.ts
    identity/{canonical,receipts}.ts
    records/{keys,versions,changes}.ts
    admission/{registry,pipeline,candidate,dependencies,prepare}.ts
    transactions/{apply,commit,notifications}.ts
    history/{read,inverse,journal}.ts
  adapters/node-identity.ts
  tests/{fixtures,requests,history-fixtures}.ts
  tests/{admission,retries,history,failures}.test.ts
  package.json
```

**Exports/imports:** consumers use `@novakai/canvas-authoring` → contract/index only. Core → own core/declarations. Declaration-only Model/Library types permitted; runtime owner behavior injected. Only compose binds node identity; browser construction supplies identity explicitly. No construction I/O. Hosts bridge Persistence, Model, Library, Assets, Templates, Presentation/Layout through their public contracts. Required roles have no permissive defaults.
**Extension:** register a named/versioned planner at composition. New diagram families reuse semantic intents. Mandatory final guards cannot be removed by registration. Additional private files permitted for readable single responsibilities.
