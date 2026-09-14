# Capability: assets — Entities and invariants

| Entity | Fields / cardinality |
|---|---|
| StageInput | base64:string, mediaType:SupportedMedia, alt:string, provenance:{source:string,license?:string,attribution?:string}; one local submission |
| BlobDescriptor | digest:Digest, mediaType, kind:image/icon/font, byteLength:positive integer, width/height:positive numbers or null, fontFamily:string or null; one/exact normalized bytes |
| StoredBlob | descriptor, base64; immutable bytes plus mechanically derived metadata; no caller-specific alt/provenance |
| Admission | descriptor, originalDigest:Digest, alt, provenance; detached return for Authoring; multiple submissions may share descriptor but have different alt/provenance |
| LeaseRecord | id:LeaseId, ownerPid:positive integer, digests:unique Digest[]; one ID protects0..N blobs |
| ResolvedMedia | descriptor, base64; explicit missing/corrupt failure, never a placeholder image |
| CollectionReport | removed:Digest[], retained:Digest[]; physically removed bytes only listed after success |
| Result<T> | {ok:true,value:T} or {ok:false,error:{code,path,message,recovery}} |

Digest: lowercase SHA256 hex of decoded normalized bytes. LeaseId: checked UUID; owner PID supplied by trusted local composition. Original digest hashes submitted bytes before normalization. Base64 is canonical (round-trip identical). Metadata source<=2048chars; alt1..4096 for image/icon, font alt may be empty; license/attribution<=4096. No raw paths in persisted descriptor.

| ID | Invariant / exact behavior |
|---|---|
| A01 | Supported inputs: image/png, image/jpeg, image/webp, image/svg+xml, font/ttf, font/otf, font/woff, font/woff2. Unknown MIME rejects. Max decoded input/output16MiB, raster32million pixels, dimension16384, font glyphs65535; SVG1MiB,4096elements/depth64. Limits checked before expensive processing where possible |
| A02 | Raster handler decodes all accepted pixels with bounded sharp input, rejects animation/multipage, applies orientation and re-encodes stripped PNG. Declared MIME must match detected format. Normalized output is image/png with measured dimensions |
| A03 | SVG strict XML parser rejects DTD/entities beyond built-ins, processing instructions, non-SVG namespace, duplicate IDs, scripts, foreignObject, image/use/href, events, style/CSS, animation and external URLs. Permit svg/g/defs/path/rect/circle/ellipse/line/polyline/polygon/text/tspan/title/desc/marker/clipPath/linearGradient/radialGradient/stop; approved attributes: id/xmlns/viewBox/width/height/x/y/x1/y1/x2/y2/cx/cy/r/rx/ry/d/points/transform/fill/fill-rule/stroke/stroke-width/stroke-linecap/stroke-linejoin/stroke-dasharray/stroke-dashoffset/stroke-miterlimit/opacity/fill-opacity/stroke-opacity/clip-path/clip-rule/marker-start/marker-mid/marker-end/markerWidth/markerHeight/markerUnits/refX/refY/orient/font-family/font-size/font-weight/text-anchor/dominant-baseline/letter-spacing/gradientUnits/gradientTransform/offset/stop-color/stop-opacity; each value bounded65536chars and no external URL. Retain safe canonical SVG with explicit positive viewport. Local url(#id) references must resolve and cannot occur inside definitions (preventing recursive clip/marker expansion); no silent stripping of rejected active content |
| A04 | Font handler parses actual TTF/OTF/WOFF/WOFF2, checks MIME signature, single font, WOFF declared expanded size<=16MiB before decompression, finite positive unitsPerEm and bounded glyph count/family; original bytes remain immutable. Font parsing/rendering is never proof of license permission |
| A05 | Stage validates metadata and media before writing; identity hashes normalized output. Identical bytes reuse one durable blob; caller alt/provenance never replace global descriptor or another binding. Unsafe/malformed data causes no admitted blob |
| A06 | Durable stage fsyncs content-addressed file before metadata admission. Existing digest file must contain identical bytes; corruption rejects, never silently overwrites. Crash before metadata commit may leave an unreferenced blob file, eligible for collection |
| A07 | Resolve parses digest, reads exact file, verifies hash and stored descriptor length; absent/corrupt bytes produce typed failure. No filesystem path, data URL or remote alias accepted as digest |
| A08 | acquire(digests) checks all existing blobs before one lease is recorded; failure leaves no lease. reserve(digests) permits absent digests for restore/admission. Both serialize with collection; duplicate input digests normalize to unique sorted set |
| A09 | Lease.stage only accepts reserved digest with matching base64 hash and fully validated safe normalized media. A restored descriptor is re-derived, never trusted from a bundle. Lease.read checks membership and re-verifies bytes. Release is idempotent; read/stage after release fails lease-expired |
| A10 | Collection holds the same storage maintenance transaction used by lease acquisition while invoking injected authoritative reachability reader. Keep union of current/history/preset references and live lease digests. Existing-byte binds require successful acquire before commit, held until afterwards. A reserve permits binding only after successful lease.stage or protected byte verification; reserving an absent digest alone never admits a binding |
| A11 | Collection removes only unreferenced owned digest files/metadata; never folders or arbitrary filenames. Active owner leases retained indefinitely. Leases of provably dead processes can be cleared under maintenance lock; unknown/permission-denied/PID-reused liveness conservatively retains. No time-based deletion of live leases |
| A12 | Native SQLite BEGIN IMMEDIATE serializes metadata/leases/GC; content files immutable. Never hold a main workspace DB transaction while acquiring Assets maintenance lock. Reachability reader may read committed main workspace state under Assets lock; Authoring main commit does not call Assets inside its DB transaction |
| A13 | Typed errors: invalid-input, unsupported-media, unsafe-media, missing-asset, corrupt-asset, lease-expired, storage-unavailable. No success on partial IO; uncertain collection/stage returns storage-unavailable, caller re-resolves/re-lists before retry. Cleanup owner Assets; semantic retry owner Authoring; backup/restore lease recovery owner maintenance host |

Immutability applies to readonly descriptors and base64 strings; no shared mutable byte arrays cross contracts. Media metadata remains mechanically tied to digest; collection-local alt/provenance belongs to Model bindings. SVG icons use image/svg+xml; no separate encoded icon format.

## File scope — estimated LOC, not targets

| File | Estimated lines |
|---|---:|
| contract/index.ts | 25 |
| contract/api.ts | 80 |
| contract/compose.ts | 60 |
| contract/brands.ts | 15 |
| contract/errors.ts | 30 |
| contract/types.ts | 50 |
| contract/records/media.ts | 65 |
| contract/records/lease.ts | 25 |
| contract/ports/storage.ts | 60 |
| contract/ports/media.ts | 25 |
| contract/ports/identity.ts | 20 |
| contract/ports/reachability.ts | 15 |
| contract/ports/native.ts | 30 |
| core/admission/stage.ts | 70 |
| core/admission/validate.ts | 70 |
| core/resolution/resolve.ts | 55 |
| core/reachability/leases.ts | 100 |
| core/reachability/collect.ts | 65 |
| core/validation/outcomes.ts | 50 |
| adapters/sqlite-files.ts | 140 |
| adapters/files.ts | 120 |
| adapters/raster.ts | 65 |
| adapters/svg.ts | 150 |
| adapters/font.ts | 65 |
| adapters/identity.ts | 40 |
| adapters/detect.ts | 40 |
| tests/fixtures.ts | 90 |
| tests/harness.ts | 85 |
| tests/admission.test.ts | 130 |
| tests/storage.test.ts | 120 |
| tests/leases.test.ts | 120 |
