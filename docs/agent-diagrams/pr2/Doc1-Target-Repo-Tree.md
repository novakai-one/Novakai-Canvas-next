# PR2 — readable typography and content
Responsibility: Presentation measures reusable readable content; Design System owns every typography/content metric.

|Path|Responsibility|
|---|---|
|capability/design-system/{contract/records/theme.ts,core/themes/diagram.ts,tokens/,contract/generated/,adapters/styles/}|Project existing type hierarchy plus new derived width/icon metrics|
|capability/presentation/contract/{records/style.ts,records/content-context.ts,index.ts}|Validate/export the frozen metric contract|
|capability/presentation/core/content/{sizing,signature,blocks,fields,table,media,text}.ts|Content-aware width, structured rows/signatures, bounded media slots|
|capability/presentation/core/{projection,notation}/|Apply title roles and sequence notation|
|capability/presentation/adapters/react/ContentBlocks.tsx|Clip cover media to measured slots|
|capability/{presentation,design-system}/tests/; capability/{layout,export}/tests/fixtures.ts; apps/service/adapters/render-jobs.ts|Migrate constructors and prove behavior|

No Model/Language semantics, Layout geometry, Assets admission, palettes, side panels or E2E suites. PR3 supplies admitted assets through this contract.
