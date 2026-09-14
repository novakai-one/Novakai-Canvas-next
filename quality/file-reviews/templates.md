# Templates file-local author review

After the sole verified-fix round; not a second independent audit. Original A1 evidence is retained separately. P1–P16 use original anchors. OCP6 for fixed owned steps/vocabulary and LSP7 (not demonstrated) unless explicitly stated; all remaining10 scores reflect inspected single responsibility, narrow consumed roles, imports, readable named flow, present scope, immutable checked data, direct collaborators and pure/injected dependencies. Native hash fakes alone do not earn LSP10. Sonar is measured separately, never substituted for the16-anchor review.

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|/160|Sonar|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|adapters/identity.ts|10|6|7|10|10|10|10|10|10|10|9|10|10|10|10|10|**152**|1|
|contract/api.ts|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|**153**|2|
|contract/brands.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/compose.ts|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|**148**|0|
|contract/errors.ts|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|**148**|0|
|contract/index.ts|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|**153**|0|
|contract/ports/codecs.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/ports/identity.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/records/preset.ts|10|6|7|10|10|10|10|10|10|8|9|10|10|10|10|10|**150**|0|
|contract/types.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|core/admission/plan.ts|10|6|7|10|10|10|10|10|8|8|10|10|10|10|10|10|**149**|2|
|core/discovery/select.ts|10|6|7|10|10|10|10|10|10|8|10|10|10|10|9|10|**150**|2|
|core/expansion/instantiate.ts|10|6|7|10|10|10|10|10|8|8|10|10|10|10|9|10|**148**|2|
|core/validation/catalog.ts|10|6|7|10|10|10|10|10|8|8|10|10|10|10|9|10|**148**|2|
|core/validation/outcomes.ts|10|6|7|10|10|10|10|10|8|10|10|10|5|10|9|10|**145**|2|
|tests/expansion.test.ts|10|6|7|10|10|10|10|10|10|10|9|10|10|10|10|10|**152**|0|
|tests/fixtures.ts|10|10|7|10|10|10|10|10|8|8|5|10|10|10|10|10|**148**|1|
|tests/presets.test.ts|10|6|7|10|10|10|10|10|10|10|9|10|10|10|10|10|**152**|0|

## File evidence and deductions

- `adapters/identity.ts`: Pure injected SHA256 with checked digest and typed native error; one small computation adapter, no ambient IO.
- `contract/api.ts`: A1 retained153: whole file consumes both recipe methods, theme resolution and hashing; expandInput alone does not redefine target-file ISP. Every public call enters protected catalog validation.
- `contract/brands.ts`: Closed bounded ID/version/digest grammar; schema failures handled by boundary. Thin declarations, no substitute behavior demonstrated.
- `contract/compose.ts`: Small binding-only native-hash composition; semantic codecs mandatory, no IO. Thin wiring hides adapter selection rather than domain logic.
- `contract/errors.ts`: Closed error vocabulary and explicit recovery string; InputFault only crosses named protected boundary. Readonly coded exception fields.
- `contract/index.ts`: Fixed public surface, private catalog/hash/expansion workflows hidden. Runtime domain behavior only through facade.
- `contract/ports/codecs.ts`: Narrow pure semantic-owner roles. Typed outcomes; caller recovery is in protected facade, not repeated on each interface method.
- `contract/ports/identity.ts`: Single deterministic hashing role, no ambient salt. Declaration-only hiding and recovery detail resides in public facade.
- `contract/records/preset.ts`: Readonly discriminated schema-driven types centralize all bounds/identities. Token meanings delegated; schema/codecs correspondence validated in core.
- `contract/types.ts`: Readonly plan/summary/expansion DTOs and typed service methods; generic intent owned by semantic provider, JSON safety checked at boundary.
- `core/admission/plan.ts`: A1 original147; verified recipe role narrowed from two methods to inspect only (ISP8→10). Canonical payload and immutable-version conflict centralized; protected facade owns provider exceptions.
- `core/discovery/select.ts`: Numeric tuples, stable copy sorting and exact digest selection; local conditional family projection remains visible. No clocks or persisted search cache.
- `core/expansion/instantiate.ts`: Re-inspection precedes deterministic remapping; detached ordinary intent and complete pinned font/theme closure. Public facade owns codec throws. Local conditional font projection retained.
- `core/validation/catalog.ts`: A1 original149; verified >12second chain issue fixed with indexed edges and bounded copy-based ancestry rounds. No shared/mutated cache. Local font conditional projection conservatively P15=9; helpers rely on named protected facade.
- `core/validation/outcomes.ts`: Owns rich bounded JSON/clone/hash canonicalization and typed protection behind small helpers. Internal InputFault helpers consumed by protect; Object.freeze mutates detached local object status (P13=5). One comparator conditional remains. Public protect names Authoring retry ownership.
- `tests/fixtures.ts`: A1 original147; duplicate provider defaults consolidated (DRY9→10). Pure explicit factory variations; native hash has no infrastructure/environment. Vitest owns assertion exceptions; thin fixtures. Maximum chain hash uses independently ordered fixed shape.
- `tests/presets.test.ts`: Six frozen contract scenarios, independently fixed hash, typed version/conflict/closure cases. 1000-record chain added inside existing catalog case with no flaky timing assertion.
- `tests/expansion.test.ts`: Two frozen scenarios exercise distinct deterministic IDs, reachable font manifest and unchanged old theme pins. A2 found no incorrect assertions. No production parser coverage claim.

18 TS files,82 named documented/explicit-return functions; strict TS, Sonar<=2, formatting and156-module/379-dependency graph pass.58 tests total,8 Templates cases. Fixture codecs prove orchestration only; Language/DesignSystem/visible-host integration remains later work. No E2E or red-first/TDD claim.
