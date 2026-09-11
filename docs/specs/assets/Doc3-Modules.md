# Capability: assets — Modules

### contract/api.ts
**Exposes:** createAssets(dependencies):Assets; stage(input:unknown):Promise<Result<Admission>>; resolve(digest:unknown):Result<ResolvedMedia>; acquire(digests:unknown):Result<ReadLease>; reserve(digests:unknown):Result<WriteLease>; verify(digest:unknown,base64:unknown):Promise<Result<void>>; collectUnreferenced(readReachability):Result<CollectionReport>; close():Result<void>.
**Contract:** protected, detached/frozen boundaries; domain errors typed. ReadLease {id,read(digest),release()}; WriteLease {id,stage(digest,base64):Promise<Result<void>>,release()}. Lease methods hide storage/owner IDs; release may be retried. Authoring owns binding/receipt recovery. No diagram mutations.

### contract/compose.ts
**Exposes:** openAssets(root:string):Result<Assets> for Node service/CLI composition; injectable native factories for adapter tests.
**Imports:** own adapters only; Node platform libraries bound to narrow ports. Public createAssets allows a deliberately different embedded host with supplied ports.
**Contract:** creates owned blob directory and metadata SQLite; no silent memory fallback. Sharp0.35.4, saxes6.0.0, fontkit2.0.4 pinned; native parser libraries behind media ports. Schema1 metadata; unsupported/corrupt envelopes rejected. Host owns location/authentication; no arbitrary URL fetch.

### contract/ports/{storage,identity}.ts
**Exposes:** AssetStorage.transact<T>((view:AssetTransaction)=>Result<T>):Result<T>; close(). AssetTransaction role methods readBlob/writeBlob/listBlobs/deleteBlob, readLease/writeLease/listLeases/deleteLease. Core functions accept only used Pick roles.
**Contract:** metadata/lease transaction serialized; immutable file write precedes metadata commit. File deletion can outlive DB rollback; on failure no complete report, caller retries after re-read. No canonical references point at deletion candidates. IdentityPort digest(base64):Result<Digest>, newLease():LeaseId, ownerPid:number, ownerAlive(pid):boolean; native implementation treats uncertain liveness as alive.

### contract/ports/{media,reachability}.ts
**Exposes:** MediaHandler {mediaTypes,normalize(base64,declared):Promise<Result<NormalizedMedia>>}; handler registry injects required formats plus byte-signature detect(base64):Result<SupportedMedia> for restore staging without a supplied MIME. ReachabilityReader():Result<readonly Digest[]>.
**Contract:** normalized bytes/descriptor facts only, no IO/alt policy in media handlers. Core registry rejects unsupported MIME. Reachability reader must include current documents, retained history and pinned presets; inability to read rejects collection before deletion.

### core/admission/{validate,stage}.ts
**Exposes (private):** checked metadata/base64, normalized media pipeline, immutable admission.
**Contract:** A01–A06; hash both original and normalized bytes; validate handler output; stage one blob under maintenance transaction. Semantic bindings are returned facts for Authoring, never committed here. Failure may leave safe orphan bytes only after durable write stage.

### core/resolution/resolve.ts
**Exposes (private):** exact digest lookup/hash verification and descriptor resolution.
**Contract:** A07; no placeholder/offline URL fallback. Retry on missing requires original bytes; never substitute a similarly named resource.

### core/reachability/{leases,collect}.ts
**Exposes (private):** atomic acquire/reserve/release, scoped read/stage, consistent reachability collection.
**Contract:** A08–A12. Async media validation occurs before final lease membership check+blob write in one transaction; concurrent release rejects final stage. No async callback holds SQLite transaction. Collector checks owner liveness, preserves uncertain owners, then loads authoritative references and deletes only unreferenced candidates under same lock.

### adapters/{raster,svg,font,detect}.ts
**Exposes (composition only):** registered normalization handlers.
**Contract:** strict format/size/dimension/glyph checks; original SVG parsed before canonical serialization; only local references retained; no external resource resolution. Raster output metadata from decoded normalized buffer. Fonts use parser metrics, not caller labels. Typed boundary catches parser/native failures and names retry/correction.

### adapters/sqlite-files.ts; adapters/identity.ts
**Contract:** declared narrow filesystem/database/hash/process factories injectable. Prepared statements bound once, atomic content-addressed files fsynced, corrupt metadata never reset. Lease owner PID retained; proven-dead cleanup is conservative. No sibling adapter imports. JSON metadata is Assets' storage detail; diagram/catalog JSON stays behind Authoring/Persistence.
