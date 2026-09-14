# Entities and invariants
|Entity|Frozen fields/invariant|
|---|---|
|TextMetric|font `{family,digest}`, finite positive `size,lineHeight`; absolute lineHeight remains floored by font ascent+descent; mono role uses monoFont, others bodyFont|
|DiagramTypography|`sectionHeading,nodeHeading,body,mono,annotation: TextMetric`; body/mono=`type.base`, headings=`font.large/title`, annotation=`font.caption`; each lineHeight=size×`lineHeight.body`|
|SizeBand|`preferred,maximum` positive interior widths, preferred≤maximum; small=`widthSmall,widthMedium`, medium=`widthMedium,widthLarge`, large=`widthLarge,widthExtraLarge`|
|ContentSizing|`widths: Record<small\|medium\|large,SizeBand>`, `rowMinimum=diagram.rowMin` before padding for field/member/table rows; `iconBox` size map|
|Measured node|Without width override, expands from preferred toward maximum for measured atomic heading/structured runs; tables may exceed maximum to preserve columns. Explicit width requests wrapping; oversized atomic signature/field/table units expand beyond it and band maximum. No clipping/ellipsis.|
|Signature|Lexical groups bind label+`(`, commas to parameters, and closing/result text; wrapping never emits punctuation-only runs. Anchor/outline retain canonical signature.|
|Media slot|Image slot w=min(selected preferred,available), h=min(w,w×assetHeight/assetWidth). Icon slot side=min(iconBox,available). Center slot in node interior; contain centers artwork preserving ratio; cover clips. Retain alt text.|
|Sequence|Section titles use sectionHeading; fragments visibly prefix `alt/opt/loop`; messages, branches and wire labels use annotation metrics.|

Export from both public contracts: `TextMetric`, `DiagramTypography`, `SizeBand`, `ContentSizing`; replace `fontSize,lineHeight,widths` in `StyleProjection`/`ResolvedStyle` with `typography,contentSizing`. New semantic tokens: `diagram.widthExtraLarge=widthLarge+widthSmall`; icon small=`space.6`, medium=`space.8`, large=`space.8+space.4`. No new color/font authority.

|Concrete file inventory|Est. ΔLOC|
|---|---:|
|`design-system/contract/{records/theme,types}.ts`; `core/themes/diagram.ts`|35;45|
|`design-system/tokens/semantics.tokens.json`; `contract/generated/token-names.ts`; `adapters/styles/{semantics,themes,preferences}.generated.css`|125;generated|
|`presentation/contract/records/{style,content-context}.ts`; `contract/index.ts`|55;10;8|
|New `presentation/core/content/{sizing,signature}.ts`|105;110|
|`presentation/core/content/{blocks,fields,table,media,text}.ts`|25;40;35;65;20|
|`presentation/core/projection/{node,section,supplement,collection}.ts`; `core/notation/wires.ts`|70;30;12;2;20|
|`presentation/adapters/react/ContentBlocks.tsx`|25|
|`presentation/tests/fixtures.ts`; `tests/{projection,rendering}.test.ts`|30;110;25|
|`design-system/tests/themes.test.ts`; `apps/service/adapters/render-jobs.ts`|25;20|
|`capability/{layout,export}/tests/fixtures.ts`|15 each|

Estimates describe touched-file scale, not limits; generated artifacts are compiler output.

Represented containers reserve their full measured content height above children, not heading-only height; ordinary card headers retain separators.

Actual source inventory is the table above, excluding unchanged `content-context.ts` and `text.ts`; both new content modules are included. No additional source paths.
