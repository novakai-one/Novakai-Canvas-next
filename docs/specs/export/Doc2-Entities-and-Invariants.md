# Capability: export — Entities & invariants

ExportJob "1" ── "1" SnapshotLease; Lease "1" ── "1" revision; Job "1" ── "1" Artifact; Artifact "1" ──< "0..512" Page; Bundle "1" ── "1" full DSL; Bundle "1" ── "1" ManualSnapshot; Bundle "1" ──< "0..n" immutable Resource.

| Record | Fields / types |
|---|---|
| Identity | collectionId:nonempty string≤120; revision:nonnegative integer; inputKey:string; title:string |
| ExportRequest | identity:{collectionId,revision}; format:svg/png/pdf/html/bundle; scope:all/section(id); scale:1..4 default1; paper:A4/Letter; orientation:portrait/landscape; fixed print profile:margin24pt/overlap12pt |
| Snapshot | identity; collection:validated Model Collection; scene:validated Layout Scene; resources:Resource[]; paint:{fill,stroke,text}; immutable data from one lease |
| SnapshotLease | snapshot; release():Promise<Result<void>>; retains record revision and referenced blobs/pins throughout job |
| Resource | kind:asset/preset/font; digest:sha256 hex; mediaType; bytes:Uint8Array; metadata:owner-validated readonly data; ≤20MiB/resource |
| Artifact | schemaVersion:1; mediaType; extension; bytes:Uint8Array; digest; identity; scope; pages:Page[]; warnings:Diagnostic[] |
| Page | ordinal:1..512; section:string; crop:Box in collection units; paperWidth/Height:points; scale:0.75pt/world-unit; margin/overlap:points; footer:revision/page metadata |
| Bundle | format:novakai.canvas.bundle; schemaVersion:1; identity; source:string; sourceDigest; manual:ManualSnapshot; manualDigest; resources:{kind,digest,mediaType,base64,metadata}[] |
| ManualSnapshot | schemaVersion:1; sections:{id,appearanceOrder:ID[],groupOrder:ID[],sequenceOrder:{id,order}[],placement?,appearances:{object,placement}[],groups:{id,placement}[],wires:{relationship,manual,locked,sourceSide,targetSide}[]}[] |
| BundleInspection | identity; source; manual; verified resources; counts; no authoritative admission token |
| ImportRequest | bytes:Uint8Array; targetCollectionId:string; creates a new collection namespace only; no merge/overwrite |
| PreparedImport | original identity; target identity at revision0; collection:validated candidate; resources:verified transfer bytes; expected:absent; source digest; warnings; not a committed receipt |
| Result<T> | {ok:true,value:T} / {ok:false,error:{code,path,message,recovery}}; boundary catches unexpected provider failure; host owns retry/recovery |

| ID | Invariant |
|---|---|
| E01 | Exact requested collection/revision required. Scene and collection match snapshot identity/inputKey. One acquired lease covers rendering, encoding and resource reads; release attempted exactly once on every acquired path. |
| E02 | No canonical write, resource admission or import commit. Import prepares a new namespace; Authoring revalidates candidate/resources and absent preconditions atomically. |
| E03 | All displayed nodes, labelled wires, ER markers, sequence events/fragments/activations, assets and fonts come from the admitted scene and shared Presentation slots. Export does not route, remeasure or invent notation. |
| E04 | SVG/PNG/HTML support whole collection or exact existing section. Bundle always transfers the whole collection; section bundle rejected. PDF keeps ordered sections and tiles oversized sections at fixed readable scale. |
| E05 | Every artifact identifies collection/revision and content digest. SVG metadata/HTML heading/PDF footer embed source revision. PNG envelope identifies revision; downloaded filename includes it. Digests prove integrity, not publisher authenticity. |
| E06 | SVG text/attributes and HTML labels are serialized safely; no raw diagram HTML/script, network assets, foreign URLs, runtime CDN or external font fetch. Offline HTML has native navigation/details and accessible content outline. |
| E07 | Bundle is bounded canonical UTF-8 JSON (.nvcanvas), not ZIP. No extraction paths, compression bombs or executable content. Reject unknown/newer versions, duplicate kind+digest, incorrect source/manual/blob hashes, invalid base64 and unsupported media. |
| E08 | Import reconstructs semantics using Language through Documents, overlays only explicit manual placements/routes, validates through Model, and changes collection namespace/revision. Local object/member/section IDs remain stable because their scope is the new collection; local links remain valid. No textual search/replace of DSL. |
| E09 | Resource ownership validation is required before a bundle is accepted for import: Assets inspects media, Templates/DesignSystem validate presets, Presentation validates fonts. Hashes alone never establish admission. Host stages resources and submits prepared import through Authoring. |
| E10 | Manual entries must reference real section/appearance/group/wire targets exactly once. Order metadata restores complete storage permutations and sequence ordinals; no semantic reordering. Omitted overrides remain automatic. New namespace retains geometry/locks; no silently dropped unknown override. |
| E11 | Limits: input/output128MiB; DSL16MiB; resource20MiB; ≤2000resources; ≤1000nodes/1500wires/10sections from owning scene; raster≤8192each side and≤64million pixels; PDF≤512pages. Validate projected allocation before native raster/page work. |
| E12 | Cancellation before acquire or between asynchronous stages produces typed cancellation; acquired lease still released. Native synchronous work is bounded, not falsely described as preemptible. No partial artifact returned on encoder/cleanup failure. |

| In-scope files (each named file) | Estimated lines each |
|---|---:|
| contract/index,api,compose,types,brands,errors,native-modules.d.ts | 30–100 |
| contract/records/input,artifact,bundle,manual,pages,limits.ts | 40–130 |
| contract/ports/snapshot,documents,resources,encoding,formats.ts; render-types.ts | 30–70 |
| core/artifacts/produce,pages,scope,identity.ts | 70–130 |
| core/bundles/manifest,inspect,prepare,manual,order,resources,completeness.ts | 90–180 |
| core/validation/outcomes,canonical.ts | 40–90 |
| adapters/svg/scene,nodes,wires,sequence,markers.tsx | 60–140 |
| adapters/native/png,pdf,fonts,woff2,media,encoding.ts | 50–140 |
| adapters/html/document.tsx,reader.css | 90 / 50 |
| tests/fixtures.ts; artifact,bundle,import,native.test.ts | 180; 140–240 |
| package.json; README.md | 35; 35 |

Estimates indicate scope only. Focused splits are recorded at completion; no LOC target or automatic standards score.
