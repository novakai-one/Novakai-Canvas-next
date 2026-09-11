# Presentation file-local author review

Post-fix author verification, not a second independent audit. Original A1 scores/findings retained separately. P1–P16 use the exact user rubric. Fixed owned vocabulary/steps cap OCP6; LSP7 means not demonstrated. Remaining10s reflect target inspections: singular responsibility, consumed narrow roles, permitted imports, named direct flow, required scope, safe types and isolated effects. Scores are not inferred from coverage or Sonar. Private value-returning projection helpers are conservatively P9=5, matching A1; the outcomes module itself owns the typed catch boundary.

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|/160|Sonar|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|adapters/fontkit.ts|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|1|
|adapters/react/ContentBlocks.tsx|10|6|7|10|10|10|10|10|8|8|10|10|10|10|10|10|**149**|1|
|adapters/react/NodeContent.tsx|10|6|7|10|10|9|10|10|8|8|10|10|10|10|10|10|**148**|1|
|adapters/static-markup.ts|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|**148**|1|
|adapters/styles.d.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/api.ts|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|**153**|0|
|contract/brands.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/compose.ts|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|**148**|0|
|contract/errors.ts|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|**148**|0|
|contract/index.ts|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|**153**|0|
|contract/ports/domain.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/ports/measurement.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/ports/rendering.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/ports/resources.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/react-types.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/records/input.ts|10|10|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**150**|0|
|contract/records/marker.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/records/style.ts|10|6|7|10|10|10|10|10|10|8|9|10|5|10|10|10|**145**|0|
|contract/records/visual.ts|10|6|7|10|10|10|10|10|10|8|9|10|5|10|10|10|**145**|0|
|contract/types.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|core/content/blocks.ts|10|6|7|10|10|9|10|10|5|8|10|10|10|10|10|10|**145**|2|
|core/content/media.ts|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/content/table.ts|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/content/text.ts|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|**148**|2|
|core/notation/markers.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|core/notation/nodes.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|core/notation/wires.ts|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|1|
|core/projection/collection.ts|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|**148**|1|
|core/projection/node.ts|10|6|7|10|10|9|10|10|5|8|10|10|10|10|10|10|**145**|1|
|core/projection/section.ts|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/validation/outcomes.ts|10|6|7|10|10|10|10|10|10|10|10|10|5|10|10|10|**148**|2|
|tests/fixtures.ts|10|10|7|10|10|10|10|10|8|8|10|10|10|10|10|5|**148**|1|
|tests/notation.test.ts|10|6|7|10|10|10|10|10|10|10|9|10|10|10|10|10|**152**|0|
|tests/projection.test.ts|10|6|7|10|10|10|10|10|10|10|9|10|10|10|10|10|**152**|0|
|tests/rendering.test.ts|10|6|7|10|10|10|10|10|10|10|9|10|10|10|10|10|**152**|1|

## Evidence and deductions

- `adapters/fontkit.ts`: A1 retained151: byte digest check, exact glyph/native advances, typed loading/shaping failure; recovery exists at caller but entry does not name it.
- `adapters/react/NodeContent.tsx`: A1 original146→author148 after two named component docs. Frame paint duplication retained. Stable injected Blocks/marker slots, validated font CSS only; React exceptions handled in named static boundary.
- `adapters/react/ContentBlocks.tsx`: Closed local primitive rendering with explicit narrowing; no arbitrary HTML. Escaping/media fits shared by Canvas/export; outer render boundary handles React errors.
- `adapters/static-markup.ts`: Thin useful serialization boundary converts React throws to typed Result; native renderer injected and no second layout.
- `adapters/styles.d.ts`: Declaration-only CSS-module record, no runtime effects; thin adapter asset typing.
- `contract/api.ts`: All public project/text/render/marker operations protected; renderer verifies exact pinned text glyphs. Narrow providers consumed across complete flow.
- `contract/compose.ts`: Binding-only native/React/provider assembly with one shared checked font set, typed protected construction. No filesystem/default tokens.
- `contract/brands.ts`: Bounded scene identity/digest/geometry schemas; checked public boundaries own parsing recovery. No alternate subtype.
- `contract/errors.ts`: Closed diagnostic and Result vocabulary; named recovery message and readonly structured private exception.
- `contract/index.ts`: Explicit public facade hides measurement/projection/native implementation; type vocabulary is intentionally exported, not private helpers.
- `contract/types.ts`: Readonly dependency/text/service interfaces; actual typed behavior supplied at protected facade, thin declarations.
- `contract/react-types.ts`: React-only declarations isolate stable component slots and exact fonts; core has no React type dependency.
- `contract/ports/domain.ts`: One canonical read method, unknown input and typed result; no duplicated Model validation.
- `contract/ports/resources.ts`: Only consumed theme-resolution and asset-read roles; no admission/storage methods.
- `contract/ports/measurement.ts`: Single exact-font metric role and declared version, consumed fully; recovery declared in facade.
- `contract/ports/rendering.ts`: Two consumed shared-render methods, no alternate geometry or UI behavior.
- `contract/records/input.ts`: Declaration-only named canonical aliases; vocabulary extensions derive from Model owner without new runtime steps. Own-contract seam keeps core foreign imports out.
- `contract/records/marker.ts`: Readonly local path/circle drawing contract and one consumer-owned factory; geometry is data, no SVG executable markup.
- `contract/records/style.ts`: Checked colors, font bytes, role metrics and resources. Outer readonly schemas plus public deep freeze; nested roles remain mutable in inferred declaration (local type deduction5).
- `contract/records/visual.ts`: Checked bounded primitives/node shape and explicit projection records; canonical sequence/group intent reused. Navigation target schema inner fields are not readonly-inferred; public results deep-frozen (deduction5).
- `core/content/blocks.ts`: Complete registered content processors, readable typed/key labels and explicit row anchors. Typography request knowledge shared with node helper is repeated once; private failures use structured throws handled at public project.
- `core/content/media.ts`: Exact canonical binding→bare digest bridge and safe-reader shape check; aspect ratio and alt retained. Structured private failures, public project owns recovery.
- `core/content/table.ts`: Measured cells define row heights, stable midpoint anchors and rules; canonical content shape is trusted from domain reader. Private measurement failures caught at facade.
- `core/content/text.ts`: A1 retained148: grapheme wrapping/newlines, exact metrics/baselines, geometry composition. Public project/text boundary catches structured private exceptions; measureText doc names Authoring retry.
- `core/notation/nodes.ts`: Exhaustive kind→shape data policy; no native dependencies. Thin meaningful notation hiding, no untyped error path for canonical kinds.
- `core/notation/markers.ts`: Single local geometry owner for all required cardinalities/arrows; injected into React. Fixed supported vocabulary, deterministic readonly data.
- `core/notation/wires.ts`: Distinct semantic marker/line selection, independent endpoint multiplicities and guard/effect labels; sequence policy uses typed registry. Canonical data only.
- `core/projection/node.ts`: A1 retained145. Verified fixes apply role foreground, authored measuring width and complete first-block summary; visible anchors retained. Fixed local flow with explicit named helpers; duplicated text request remains recorded.
- `core/projection/section.ts`: Visible endpoint resolution through represented groups, measured wire/sequence labels and unchanged downstream intent. Private structured failure reaches facade.
- `core/projection/collection.ts`: Complete source/style/engine identity, resource prefix conversion, outline and aggregate primitive budget. Entry names Authoring commit boundary; no first-party cache or camera.
- `core/validation/outcomes.ts`: Target owns typed protection boundary itself: structured helper faults and native exceptions are translated by protect/caught. Clone limits/parsing/detached freeze hidden centrally; Object.freeze is local mutation5.
- `tests/fixtures.ts`: Explicit fixture variations and injected resource reader; real fonts default filesystem read (testability5). Rich setup hides licensed bytes/hash/Model bridge/React construction. Vitest assertions own setup failure; no type assertions after geometry-fixture extension.
- `tests/projection.test.ts`: Seven fixed public scenarios, role/width/complete-table regressions within existing cases. A2 camera substring removed instead of claiming a host behavior from schema absence.
- `tests/notation.test.ts`: One case with independently stated bar/circle/crow-foot geometry and visible label; A2 independent marker checks agreed.
- `tests/rendering.test.ts`: Two fixed cases, real monospace numeric oracle and real React comparison. A2 geometry limitation fixed with canonical kind projections and independent text rectangle/diamond-corner assertions.

CSS assets: NodeContent.module.css and ContentBlocks.module.css contain only local structural/typography behavior, no palette values or duplicated theme variables. Paint/radius/stroke are resolved data. CSS static scope review is separate from human browser readability, which remains Part2.35TS/TSX files,110named functions with own docs/explicit returns; measured Sonar<=2.
