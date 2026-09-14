# Capability: templates — Modules

### contract/api.ts; compose.ts; index.ts
**Exposes:** createTemplates<T>(dependencies):Templates<T>; composeTemplates<T>(codecs):Templates<T> binds native deterministic hash only. validatePreset(catalog:unknown,input:unknown):Result<Preset>; planAdmission(...):Result<PresetPlan>; list(catalog:unknown,query:unknown):Result<Summary[]>; read(catalog:unknown,selection:unknown):Result<Preset>; instantiate(catalog:unknown,request:unknown):Result<Expansion<T>>.
**Imports:** own core/declarations; compose alone imports own identity adapter.
**Contract:** synchronous pure planning/read/expansion; no filesystem or database. All outcomes protected, detached, frozen; input caller retains ownership. No untrusted generic T assertion: codec owns typed intent construction; boundary verifies JSON safety/detaches before return.

### contract/records/preset.ts; brands.ts; types.ts; errors.ts
**Exposes:** strict schemas, readonly discriminated records, identities, typed diagnostics with path/message/recovery.
**Imports:** own declarations,Zod.
**Contract:** T01/T12 structural vocabulary. Error codes invalid-input/unsupported-version/missing-preset/digest-mismatch/version-exists/duplicate-preset/dependency-cycle/provider-failed. No Model/Language token semantics duplicated.

### contract/ports/codecs.ts; identity.ts
**Exposes:** RecipePort<T>.inspect(source,family)→Result<RecipePayload>; expand(source,namespace)→Result<T>. ThemePort.resolve(raw,availableThemes)→Result<ThemePayload>. IdentityPort.hash(canonical:string)→Result<Digest>.
**Imports:** declarations only.
**Contract:** Host bridges Language/DesignSystem public APIs; required roles have no no-op defaults. Recipe inspection computes exact manifest and canonical pinned source. Theme resolves full immutable values. Port output is still shape/bounds checked; domain facts remain the owning codec's responsibility. Contracts forbid I/O/global state in codecs.

### core/validation/outcomes.ts; catalog.ts
**Exposes (private):** bounded clone/freeze, parse/protect, record hashing, catalog integrity and exact pin dependency resolution.
**Imports:** own record schemas/error/types/hash port.
**Contract:** T01–T03/T11–T12. Hash checks precede use; dependency closure and cycle walk bounded by catalog length. Catalog validity is structural/pin integrity; imported records must pass validatePreset semantic re-admission before Authoring saves them.

### core/admission/plan.ts
**Exposes (private):** resolve/check submitted preset; add-or-noop plan.
**Imports:** codecs; validation; record schemas.
**Contract:** T04–T06; selected codec resolves source/theme. Strictly validate and hash output; adding candidate must satisfy catalog dependency closure. Existing version comparison uses complete content hash, not title or source alone. No save/delete side effect.

### core/discovery/select.ts
**Exposes (private):** select exact/latest; deterministic filtered summaries.
**Imports:** checked catalog records; selection/query declarations.
**Contract:** T07. Full version grammar prevents coercion tricks; read is immutable. Sorting tuples does not mutate input array.

### core/expansion/instantiate.ts
**Exposes (private):** expand selected canonical source into owned typed intent plus immutable dependency manifest.
**Imports:** selection; required RecipePort.expand; own declarations.
**Contract:** T08–T10. Fresh namespace supplied explicitly; Templates validates its grammar. Codec performs semantic ID remapping because only Language owns parsed syntax; no regex substitution of arbitrary source text. Ordinary output has no hidden inheritance callback.

### adapters/identity.ts
**Exposes:** createIdentity(nativeHash?)→IdentityPort.
**Imports:** node:crypto; own hash/error/brand contract.
**Contract:** UTF8 SHA256; catches native failures. Pure deterministic hashing, no environment/files/network.
