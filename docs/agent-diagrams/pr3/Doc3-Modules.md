# Modules and contracts

|Owner/module|Public interface|Failure/recovery|
|---|---|---|
|CLI files|`readResources(sourceFile, ResourceRequest[]) → Result<local/pinned inputs>`; `readTheme(file)`|UTF-8/path/MIME errors cite file, DSL span and alias before mutation, e.g. `wetland.canvas:4:18 asset @marsh: source-unavailable`|
|CLI commands|`create/replace/patch FILE` auto-stage local declarations; `theme admit FILE`; `recipe admit FILE --id --version --family --title`|Stage all, prepare exact preset if applicable, then retain one immutable Authoring envelope; retry never rereads source/assets|
|Service resource commands|`stage(input:unknown) → Promise<Assets.Result<Admission>>`; `preparePreset(input:unknown) → Result<PresetPreparation>`|Stage is content-idempotent and orphan-safe; preparation is read-only/replayable; preserve owner code/path|
|Templates bridge|Existing `planAdmission(catalog,input)` with Language/DesignSystem codecs|Canonical recipe source and exact theme/base/font closure; conflict/no-op unchanged|
|Preset planner|Exact prepared command + snapshot → Authoring `Proposal`|Recompute and compare pin/key/manifest; drift rejects; write `preset:<digest>` with exact resources|
|Authoring|Existing `prepare/apply/receipt`|Sole commit/replay gate; CAS failure has no partial record; uncertain apply reconciles retained request|
|Render jobs|Existing preset read → Assets-resolved `FontSet`/media → Presentation|The identical font digest/base64 set feeds fontkit measurement and React/static rendering; never OS fallback|

Recipe admission reuses editable `.canvas` sources and Language printing. After the PR2/PR3 metric-interface freeze, theme config maps only into existing Design System typed overrides; it defines no typography metric schema. No new Assets/Templates store or broad facade.

Snapshot-bound codecs receive normalized bindings; preset asset acquisition is explicit. Lease closure includes transitive dependencies; stored manifests remain theme fonts or recipe direct assets.
