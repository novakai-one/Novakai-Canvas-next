# Capability: presentation — Modules

### contract/api.ts; compose.ts; index.ts
**Exposes:** createPresentation(deps):Presentation; composePresentation(owners,fontSet,renderSlot?):Result<{presentation,react}>. measureText(TextRequest):Result<MeasuredContent>. project(input:unknown):Result<Projection>; renderContent(node:unknown):Result<string>; marker(kind:unknown,paint:unknown):Result<string>. React NodeContent component exported through composed public binding for Canvas.
**Imports:** own core/records; compose binds own adapters only.
**Contract:** synchronous pure projection; typed failure; caller corrects input or provider. Authoring decides whether failed preview blocks apply. No fallback shape/metrics on failure. Static markup adapter gets React renderer slot through compose, never sibling import.

### contract/records/input.ts; ports/domain.ts
**Exposes:** declaration-only aliases of required Model public records; DomainReader.read(unknown):Result<InputCollection>.
**Imports:** Model public index type-only, own declarations.
**Contract:** one canonical vocabulary; semantic validation owned by injected Model reader. Core sees own input declarations, no foreign runtime behavior.

### contract/records/style.ts; ports/resources.ts
**Exposes:** ResolvedStyle,FontRef,Paint,VisualAsset; ThemeResolver.resolve(themePin):Result<ResolvedStyle>; AssetReader.read(digest):Result<VisualAsset>.
**Imports:** own schemas/types only.
**Contract:** tokens/contrast owned by DesignSystem; admitted bytes/safety by Assets. Presentation validates consumed shape, uses exact font/media digests and never fetches URLs.

### core/content/{text,blocks,table,media}.ts
**Exposes (private):** measured text wrapping, content-kind registration, table row layout, image sizing and accessible text.
**Imports:** own declaration records, narrow metric/asset ports, own helpers.
**Contract:** V03–V07. Extending content uses registered processors; do not add renderer switches to Authoring. Wrapped runs carry actual width and baseline. Table cell-height maximum defines one row height and its anchor. Long content remains available in outline.

### core/notation/{nodes,wires,markers}.ts
**Exposes (private):** kind→shape, relationship→markers/style, markerDrawing(kind); contract/records/marker.ts declares renderer slot.
**Imports:** own input/style/visual declarations.
**Contract:** V08–V10. Shape registry data; wire label always present. Marker geometry uses local units plus supplied stroke/paint; route transforms are Layout/Canvas/Export responsibility.

### core/projection/{node,section,collection}.ts
**Exposes (private):** object/group projection; measured wires/sequence labels; collection outline and complete input identity.
**Imports:** own content/notation helpers and consumer-owned roles.
**Contract:** V01–V02/V06/V11–V14. No global coordinates or cached mutable state. Parent/group/layout intent retained as data for Layout. Collection arrangement belongs to downstream layout. Exact imported theme/assets used throughout one projection.

### adapters/fontkit.ts
**Exposes:** createFontMetrics(fonts:readonly pinnedBytes[],nativeParser?):Result<MeasurementPort>.
**Imports:** fontkit,own declarations.
**Contract:** parse approved offline fonts once per supplied set; full glyph layout advances/ascent/descent at requested size. No OS lookup, no file IO; native parser errors typed. Supplied digest rechecked; no silent font fallback. Native cache behavior is confined to library, no global first-party cache.

### adapters/react/{NodeContent,ContentBlocks}.tsx; static-markup.ts
**Exposes:** createContentRenderer(fontSet,ContentBlocksSlot):React node slot; createMarkupRenderer(slot,nativeRender?):RenderPort.
**Imports:** React/ReactDOM only in adapters, own visual records/react-types; local CSS modules.
**Contract:** V12–V13. React primitives are declarative and escaped; no dangerouslySetInnerHTML. FontSet is immutable and shared with metrics. CSS family is digest-derived; font bytes and body/mono identities must match. Host awaits exact font readiness, shows typed failure otherwise. Static adapter serializes same component for offline export. NodeContent owns frame/font scope; injected ContentBlocks owns all measured primitives, including ER/interface/sequence content. Baseline03 inventory is reconciled. Node background and primitive coordinates are separate; Canvas may pass validated outer bounds for group frame without rewrapping text.
