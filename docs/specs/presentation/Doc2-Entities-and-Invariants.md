# Capability: presentation — Entities and invariants

## Records and cardinalities

| Record | Fields / type | Cardinality / rule |
|---|---|---|
| InputCollection | Readonly canonical Model Collection, obtained through DomainReader.read(unknown) | One validated revision; no private Model schema import |
| FontRef | digest:bare SHA256,family:string | Exact offline font; family is label, digest is identity; Model sha256: prefix removed at resource boundary |
| FontSet | readonly {digest,family,mediaType,base64}[] | Same immutable admitted set supplied to metrics and renderer; body/mono digests must resolve |
| ResolvedStyle | digest,bodyFont,monoFont,fontSize,lineHeight,padding,gap,stroke,radius,widths:{small,medium,large},roles:Record<string,Paint>,surface,text,secondary,border | Finite positive metrics; styles from injected resolver; one exact collection-theme resolution |
| Paint | fill,stroke,text colors | Checked hex colors only; no arbitrary CSS/executable string; roles use labels/kind plus color |
| TextMetrics | width,ascent,descent | Nonnegative finite; normalized world units; missing glyph/font→typed failure |
| TextRun | text,x,y baseline,width,font:FontRef,size,fill | One exact measured line; no clipping, arbitrary HTML or renderer-dependent rewrap |
| MediaRun | digest,alt,dataUri,x,y,width,height,fit:contain/cover | Safe resolved local image/icon bytes; data:image/png/svg+xml/jpeg/webp base64 only; no fetching |
| Primitive | text/media/rule (line endpoints,stroke,width) | Local content only, no global node placement |
| MeasuredContent | width,height,primitives,anchors,outline | One stable content block; own baseline/row layout permitted |
| Anchor | member:string,x,y,direction:in/out/inout | One anchor per addressable field/member/signature/table-row/port; whole-object anchors handled by routing; hidden member retains collapsed attachment with explicit label |
| VisualNode | id,objectId or null,groupId or null,sectionId,kind,label,role,size,shape,paint,content,navigation,width,height,headerHeight,radius,strokeWidth,placement or null,parent or null | One per appearance/group; represented object has only its group node; no duplicate semantic content |
| Shape | card/pill/diamond/bar/entity/module/interface/function/state/participant/note/container | Notation choice, independent of diagram global layout |
| Marker | none/arrow/open-arrow/one/zero-one/one-many/zero-many | Local marker shape/extent; Layout chooses rotation/route attachment |
| VisualWire | id,relationshipId,sectionId,source,target,label content,sourceMarker,targetMarker,style,route intent | Exactly two visible endpoints; all labels measured; explicit cardinality per endpoint |
| VisualSequenceItem | canonical sequence item + measured label/marker | Ordered event/fragment meaning retained for Layout; not inferred from positions |
| VisualSection | id,title content,mode,order,layout,placement,nodes,wires,sequence,groups,root | One per source section, source order retained; group parent identities retained |
| Projection | collectionId,revision,title,styleDigest,inputKey,sections,outline,assetDigests,fontDigests | Complete immutable read result; no cache owned here |
| InputKey | deterministic canonical digest input string | Includes all source revision/content, theme/style digest, font/measurement/renderer version; excludes camera |

## Invariants

| ID | Invariant / failure |
|---|---|
| V01 | Public project input is unknown and validated through DomainReader; no state writes. Dependency exceptions become typed provider-failed. Invalid theme/assets/fonts/kinds fail visibly, never fabricated dimensions or blank nodes. |
| V02 | Every appearance resolves canonical content once with local role/size/detail overrides. Shared edits affect all appearances; no copy becomes independent semantic authority. Unplaced objects remain in accessible collection outline. |
| V03 | All structured Model content kinds supported: text,code,list,link,image/icon,field,keygroup,member,signature,table; stable descendant anchors for valid endpoint kinds. Field notation includes type/PK/FK/UQ/nullable; signature includes parameters/result; ports show direction/type. |
| V04 | Text measured using exact font bytes before wrapping. Explicit newlines retained; long unbroken words split by Unicode grapheme boundaries, not UTF16 code units. Lineheight at least measured ascent+descent. Font missing glyph→diagnostic rather than platform substitution. |
| V05 | Small/medium/large are preferred widths from tokens (baseline180/240/320 at16px), never fixed heights. Content grows height. Tables grow minimum width by column count; cell wrapping determines row height; row endpoint is row midpoint. No ellipsis or silent content clipping in full detail. |
| V06 | Label detail hides body; summary shows first content block; full shows all. Accessible outline retains full canonical content. Endpoint hidden by detail maps to explicit collapsed attachment at header/body boundary so semantic wires remain traceable. |
| V07 | Images/icons retain aspect ratio for contain; cover uses explicit clip in renderer. Alt text included in outline/title. No script/HTML/external image fetch; safe bytes from Assets. Links remain text plus node navigation metadata; renderer never executes arbitrary URI. |
| V08 | Shape families distinguish step/start/end/decision/fork/join/entity/module/interface/function/state/participant/concept/system/note. Diamonds allocate an inscribed content area; typed engineering rows remain aligned. Color never sole notation. |
| V09 | ER endpoint markers are exact circle/bar/crow-foot combinations for0..1,1,0..many,1..many, separately chosen from source/target metadata. Association lacks directional arrow by default. Imports/calls/implements/contains/parent/reference/flow/transition retain distinct kinds, labels and line/arrow conventions. |
| V10 | Wire label includes guard/effect text where present. Sequence messages/fragments have measured labels and kind-specific markers; Layout owns lifelines/activation positions/frame placement. |
| V11 | Local primitive positions are typography/content coordinates only. Node bounds/anchors contain all visible content; Layout owns global x/y, groups/section bounds and route paths. UI width override is a requested content measure width, minimum size remains explicit for feasibility checks. |
| V12 | Same projection primitives feed React and static SVG. Text uses digest-derived CSS family, embedded exact FontSet bytes and measured textLength; host awaits matching document.fonts.load before exposing canvas; no browser second wrapping algorithm. Fontkit measurement and renderer versions enter inputKey. Target browser/server metric parity<=0.5world unit at integration. |
| V13 | Primitive/style schemas reject nonfinite geometry, unsafe paint/URI, unsupported versions before public rendering. Detached readonly output; no global mutable scene/font cache. Hosts may cache by full inputKey and discard stale jobs. |
| V14 | Limits: canonical input16MiB,1000objects/1500relationships supported acceptance fixture, text block100kchars/10000lines, scene100kprimitives; larger/unsupported input gets typed limit. Work split by object/section at host async boundary; no performance completion claim from this slice. |

## Files in scope — estimated lines

Estimates indicate scale only; not targets or restrictions.

| File | Lines |
|---|---:|
| contract/api.ts | 100 |
| contract/compose.ts | 40 |
| contract/index.ts | 35 |
| contract/brands.ts | 20 |
| contract/errors.ts | 35 |
| contract/types.ts | 75 |
| contract/records/input.ts | 30 |
| contract/records/style.ts | 85 |
| contract/records/visual.ts | 190 |
| contract/records/marker.ts | 15 |
| contract/ports/domain.ts | 30 |
| contract/ports/resources.ts | 45 |
| contract/ports/measurement.ts | 30 |
| contract/ports/rendering.ts | 20 |
| core/validation/outcomes.ts | 65 |
| core/content/text.ts | 130 |
| core/content/blocks.ts | 150 |
| core/content/table.ts | 100 |
| core/content/media.ts | 65 |
| core/notation/nodes.ts | 80 |
| core/notation/wires.ts | 100 |
| core/notation/markers.ts | 45 |
| core/projection/node.ts | 130 |
| core/projection/section.ts | 140 |
| core/projection/collection.ts | 90 |
| adapters/fontkit.ts | 110 |
| adapters/styles.d.ts | 5 |
| adapters/react/NodeContent.tsx | 120 |
| adapters/react/ContentBlocks.tsx | 120 |
| adapters/react/{NodeContent,ContentBlocks}.module.css (2 files) | 15 each |
| contract/react-types.ts | 40 |
| adapters/static-markup.ts | 40 |
| tests/fixtures.ts | 130 |
| tests/projection.test.ts | 170 |
| tests/notation.test.ts | 100 |
| tests/rendering.test.ts | 110 |
| capability/presentation/package.json |20 |
| tsconfig.json / ESLint / dependency config |existing TSX enforcement extension |
