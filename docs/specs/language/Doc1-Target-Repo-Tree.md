# Capability: language — Target repo tree

**Responsibility:** translate readable versioned DSL into semantic changes; print complete/explicitly scoped readouts without losing supported meaning; locate syntax/lowering failures precisely.
**Owns:** vocabulary, lexical/grammar rules, syntax trees, default mapping, syntactic patch compilation, source spans, faithful printing, discoverable language description.
**Excludes:** saving, revisions/receipts/history, domain graph validity, media loading, alias resolution, placement/routing, CLI transport/outbox, UI drafts.

```text
capability/language/
  contract/{index,api,types,brands,errors}.ts
  contract/records/{syntax,vocabulary,requests}.ts
  contract/ports/model.ts
  core/lexing/{tokens,strings,locations}.ts
  core/parsing/{cursor,repetition,values,attributes,declarations,content,views,patch,document}.ts
  core/vocabulary/{constructs,properties,defaults,description}.ts
  core/lowering/{document,content,views,sequence,resources,properties,diagnostics}.ts
  core/patching/{compile,targets,properties,blocks,views,structural}.ts
  core/printing/{document,content,views,sequence,properties,strings,scope,geometry}.ts
  core/validation/{input,outcomes}.ts
  tests/{fixtures,domain-fixture,engineering-fixtures,patch-fixtures}.ts
  tests/{documents,engineering,roundtrip,patches,boundaries}.test.ts
  package.json
resources/examples/language/*.canvas; *.patch
```

**Imports:** external users enter `@novakai/canvas-language` → contract/index only. Core → own declarations/core; declaration-only Model types allowed. Model Reader/Planner/Stage roles injected; no framework/filesystem/network. No native adapter is necessary for pure parsing/printing.
**Dependency extension:** public Model `stage(snapshot,changes)` returns an explicitly unchecked immutable structural draft after validating the original snapshot and operation shapes. It reuses Model's operation implementation, including cascade/preservation; no duplicated domain policy in Language. Final lower always invokes Model.plan. This small Model contract extension ships with this compiler integration and receives file-local standards evidence and public regression coverage; it cannot authorize a commit.
**Additional private files:** permitted when a module needs a clearer single responsibility; no placeholder parsers or raw-JSON authoring escape hatch.
