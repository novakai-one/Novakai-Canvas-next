# Assets

Admit safe immutable media, resolve exact offline bytes, and protect reachability through leases. Authoring owns diagram bindings; Assets never writes collection documents.

Enter through `contract/index.ts`. `createAssets` binds injected dependencies; `openAssets` explicitly opens the native SQLite/file store. PNG/JPEG/WebP normalize to PNG; strict SVG stays vector; supported fonts retain exact bytes. Missing/corrupt resources produce typed diagnostics.

Contract tests cover real codecs/files and lease races.
