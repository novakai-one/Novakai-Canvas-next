# Entities and invariants

|Entity|Fields/cardinality|Invariant|
|---|---|---|
|LocalResource|DSL span, alias, relative path or `sha256:` digest, kind, alt/provenance|Resolve beneath source directory; reject absolute/symlink escape, missing, MIME mismatch; pinned digests cause no file read|
|StagedAdmission|existing Assets `Admission`|Normalization/digest/metadata remain Assets-owned; staging alone creates no canonical binding|
|ThemeConfig|header, exact/base alias, body/mono local font, typed existing-token overrides|Small coordinate-free config; preparation resolves base/font pins; no new metric fields or roles schema|
|PresetPreparation|normalized admission, exact `Pin`, target record key, byte manifest|Snapshot-bound `{admission,pin,key,resources,reads}`; Templates owns identity/closure|
|Authoring request|existing request ID, expected/scope, asset alias/digests, planner payload|Before retention freeze theme aliases to exact pins, including patches; preserve normalized bytes locally for exact restaging after collection|

|Concrete file(s)|Responsibility / LOC|
|---|---|
|apps/cli/contract/{compose.ts,ports/runtime.ts,records/{command,resources}.ts}|Runtime/resource contracts|
|apps/cli/adapters/{arguments,files,resource-inputs,semantic-inputs,preset-inputs,theme-config}.ts|Syntax, confinement, retention|
|apps/cli/core/commands/{author,presets,resources,execute,help}.ts|Stage/freeze/admit/replay/expand|
|apps/service/contract/{api,compose,types}.ts; records/{commands,resource-commands,server,metadata,http}.ts|Session/wiring/checked envelopes|
|apps/service/adapters/{resource-commands,preset-planner,theme-preparation,resource-selection,http-router,http-io}.ts|Snapshot codecs/CAS/bytes/transport|
|apps/service/core/transport/{admission,command}.ts|Planner authorization/body ceiling|
|apps/cli/tests/commands.test.ts; apps/service/tests/transport.test.ts|CLI retention/HTTP chunks|
|apps/web/tests/{authoring,rendering}.test.ts; host-workspace-fixture.ts|CAS/reopen/fonts/media|
|capability/presentation/{contract,adapters/react}/; apps/web/{contract,adapters/react}/|Stable current-document font definitions; host slot only|
|resources/examples/agent-diagrams/pr3/*|DSL/themes/PNG/SVG/fonts; existing recipe consumed|

Prefer these files; any helper requires an updated responsibility/import inventory. Upload one asset; encoded HTTP ceiling24MiB. Stage returns Promise<Result<Admission>>. Preset planner is explicitly authorized; bootstrap remains private.

Inventory above replaces estimates; implementation.md records actual counts. HTTP buffering stays in http-io.ts. Workspace metadata.presetRevision defaults0 and increments atomically on new admissions; shared CAS prevents conflicting identity insertions. No-op admissions do not increment.
