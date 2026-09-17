# Templates scene extraction

TypeScript compiler API: 16 production nodes; 9 directory sections; 29 value wires.

Node IDs follow sorted relative source paths. Direct nodes are alphabetical by file name. Root section order: contract, core, adapters; child directories alphabetical. Wire IDs follow provider ID, then consumer ID. Requests are provider → consumer (OUT → IN). No coordinates are authored.

Imports and re-exports must carry a value symbol according to the TypeScript checker. Explicit type statements/specifiers are excluded. Multiple value bindings or declarations for a pair produce one wire. Dropped counts count declarations, not individual named bindings, with external taking precedence over type-only. Side-effect-only imports carry no value binding. Tests and fixtures are excluded by walking only the three production roots.

Delta from grep estimate 29: 0. The AST/checker filters type-only dependencies and external modules and deduplicates file pairs; the table below is authoritative.

## Nodes

| Node | File |
| --- | --- |
| node-1 | adapters/identity.ts |
| node-2 | contract/api.ts |
| node-3 | contract/brands.ts |
| node-4 | contract/compose.ts |
| node-5 | contract/errors.ts |
| node-6 | contract/index.ts |
| node-7 | contract/ports/codecs.ts |
| node-8 | contract/ports/identity.ts |
| node-9 | contract/records/failure-source.ts |
| node-10 | contract/records/preset.ts |
| node-11 | contract/types.ts |
| node-12 | core/admission/plan.ts |
| node-13 | core/discovery/select.ts |
| node-14 | core/expansion/instantiate.ts |
| node-15 | core/validation/catalog.ts |
| node-16 | core/validation/outcomes.ts |

## Sections

| Section | Directory | Direct nodes |
| --- | --- | --- |
| section-1 | contract | 6 |
| section-2 | contract/ports | 2 |
| section-3 | contract/records | 2 |
| section-4 | core | 0 |
| section-5 | core/admission | 1 |
| section-6 | core/discovery | 1 |
| section-7 | core/expansion | 1 |
| section-8 | core/validation | 2 |
| section-9 | adapters | 1 |

Labels retain exact imported value names in source order, deduplicated per provider/consumer pair. One or two names are comma-joined; three or more render first + N more, where N is the remaining count. Type-only names are excluded. The wires array adds id/label presentation metadata beside unchanged sections and requests; the host attaches it after layout. Nested synthetic scenes retain wire IDs.

## Value wires

| Wire | Provider | Consumer | Source evidence (consumer:line) |
| --- | --- | --- | --- |
| w01 | adapters/identity.ts | contract/compose.ts | contract/compose.ts:1 — `import { createIdentity } from '../adapters/identity.js';` |
| w02 | contract/api.ts | contract/compose.ts | contract/compose.ts:2 — `import { createTemplates } from './api.js';` |
| w03 | contract/api.ts | contract/index.ts | contract/index.ts:2 — `export { createTemplates } from './api.js';` |
| w04 | contract/brands.ts | adapters/identity.ts | adapters/identity.ts:2 — `import { digest } from '../contract/brands.js';` |
| w05 | contract/brands.ts | contract/index.ts | contract/index.ts:4 — `export { presetId, version, digest } from './brands.js';` |
| w06 | contract/brands.ts | contract/records/preset.ts | contract/records/preset.ts:9 — `import { digest, presetId, version } from '../brands.js';` |
| w07 | contract/brands.ts | core/validation/catalog.ts | core/validation/catalog.ts:9 — `import { digest } from '../../contract/brands.js';` |
| w08 | contract/compose.ts | contract/index.ts | contract/index.ts:3 — `export { composeTemplates } from './compose.js';` |
| w09 | contract/errors.ts | adapters/identity.ts | adapters/identity.ts:4 — `import { fail } from '../contract/errors.js';` |
| w10 | contract/errors.ts | core/admission/plan.ts | core/admission/plan.ts:13 — `import { fail } from '../../contract/errors.js';` |
| w11 | contract/errors.ts | core/discovery/select.ts | core/discovery/select.ts:3 — `import { fail } from '../../contract/errors.js';` |
| w12 | contract/errors.ts | core/expansion/instantiate.ts | core/expansion/instantiate.ts:10 — `import { fail } from '../../contract/errors.js';` |
| w13 | contract/errors.ts | core/validation/catalog.ts | core/validation/catalog.ts:12 — `import { fail } from '../../contract/errors.js';` |
| w14 | contract/errors.ts | core/validation/outcomes.ts | core/validation/outcomes.ts:1 — `import { fail, InputFault } from '../../contract/errors.js';` |
| w15 | contract/records/preset.ts | contract/api.ts | contract/api.ts:1 — `import { selection, query, expansionRequest } from './records/preset.js';` |
| w16 | contract/records/preset.ts | core/admission/plan.ts | core/admission/plan.ts:1 — `import { admission, preset, recipePayload, themePayload } from '../../contract/records/preset.js';` |
| w17 | contract/records/preset.ts | core/validation/catalog.ts | core/validation/catalog.ts:1 — `import { catalog, themePayload, recipePayload } from '../../contract/records/preset.js';` |
| w18 | core/admission/plan.ts | contract/api.ts | contract/api.ts:7 — `import { admit, plan } from '../core/admission/plan.js';` |
| w19 | core/discovery/select.ts | contract/api.ts | contract/api.ts:8 — `import { select, list } from '../core/discovery/select.js';` |
| w20 | core/expansion/instantiate.ts | contract/api.ts | contract/api.ts:9 — `import { instantiate } from '../core/expansion/instantiate.js';` |
| w21 | core/validation/catalog.ts | contract/api.ts | contract/api.ts:6 — `import { validateCatalog } from '../core/validation/catalog.js';` |
| w22 | core/validation/catalog.ts | core/admission/plan.ts | core/admission/plan.ts:15 — `import { hashContent, validateCatalog, checkPayload, key, pinOf } from '../validation/catalog.js';` |
| w23 | core/validation/catalog.ts | core/discovery/select.ts | core/discovery/select.ts:6 — `import { pinOf } from '../validation/catalog.js';` |
| w24 | core/validation/catalog.ts | core/expansion/instantiate.ts | core/expansion/instantiate.ts:12 — `import { exact, pinOf, reachableThemes } from '../validation/catalog.js';` |
| w25 | core/validation/outcomes.ts | contract/api.ts | contract/api.ts:5 — `import { protect, clone, parse, success } from '../core/validation/outcomes.js';` |
| w26 | core/validation/outcomes.ts | core/admission/plan.ts | core/admission/plan.ts:14 — `import { parse, clone, success } from '../validation/outcomes.js';` |
| w27 | core/validation/outcomes.ts | core/discovery/select.ts | core/discovery/select.ts:5 — `import { success } from '../validation/outcomes.js';` |
| w28 | core/validation/outcomes.ts | core/expansion/instantiate.ts | core/expansion/instantiate.ts:11 — `import { success, canonical, clone } from '../validation/outcomes.js';` |
| w29 | core/validation/outcomes.ts | core/validation/catalog.ts | core/validation/catalog.ts:14 — `import { canonical, clone, parse, success, firstFailure } from './outcomes.js';` |

## Dropped declarations

- External: 3
- Type-only / no value binding (internal): 42
- Duplicate value declarations collapsed: 0

| Source | Reason | Declaration |
| --- | --- | --- |
| adapters/identity.ts:1 | external | `import { createHash } from 'node:crypto';` |
| adapters/identity.ts:3 | type-only / no value binding | `import type { Digest } from '../contract/brands.js';` |
| adapters/identity.ts:5 | type-only / no value binding | `import type { Result } from '../contract/errors.js';` |
| adapters/identity.ts:6 | type-only / no value binding | `import type { IdentityPort } from '../contract/ports/identity.js';` |
| contract/api.ts:2 | type-only / no value binding | `import type { Catalog, Preset } from './records/preset.js';` |
| contract/api.ts:3 | type-only / no value binding | `import type { Dependencies, Templates, PresetPlan, Expansion, Summary } from './types.js';` |
| contract/api.ts:4 | type-only / no value binding | `import type { Result } from './errors.js';` |
| contract/brands.ts:1 | external | `import { z } from 'zod';` |
| contract/compose.ts:3 | type-only / no value binding | `import type { RecipePort, ThemePort } from './ports/codecs.js';` |
| contract/compose.ts:4 | type-only / no value binding | `import type { Templates } from './types.js';` |
| contract/errors.ts:1 | type-only / no value binding | `import type { FailureSource } from './records/failure-source.js';` |
| contract/index.ts:5 | type-only / no value binding | `export type { PresetId, Version, Digest } from './brands.js';` |
| contract/index.ts:6 | type-only / no value binding | `export type { Result, Diagnostic, ErrorCode } from './errors.js';` |
| contract/index.ts:7 | type-only / no value binding | `export type { Pin, Preset, ThemePreset, RecipePayload, ThemePayload, Catalog, Admission, Selection, Query, ExpansionRequest, } from './records/preset.js';` |
| contract/index.ts:19 | type-only / no value binding | `export type { Templates, Dependencies, PresetPlan, Expansion, Summary } from './types.js';` |
| contract/index.ts:20 | type-only / no value binding | `export type { RecipePort, ThemePort } from './ports/codecs.js';` |
| contract/index.ts:21 | type-only / no value binding | `export type { IdentityPort } from './ports/identity.js';` |
| contract/ports/codecs.ts:1 | type-only / no value binding | `import type { PresetId } from '../brands.js';` |
| contract/ports/codecs.ts:2 | type-only / no value binding | `import type { Result } from '../errors.js';` |
| contract/ports/codecs.ts:3 | type-only / no value binding | `import type { RecipePayload, ThemePayload, ThemePreset } from '../records/preset.js';` |
| contract/ports/identity.ts:1 | type-only / no value binding | `import type { Digest } from '../brands.js';` |
| contract/ports/identity.ts:2 | type-only / no value binding | `import type { Result } from '../errors.js';` |
| contract/records/preset.ts:1 | external | `import { z } from 'zod';` |
| contract/types.ts:1 | type-only / no value binding | `import type { Result } from './errors.js';` |
| contract/types.ts:2 | type-only / no value binding | `import type { PresetId, Digest } from './brands.js';` |
| contract/types.ts:3 | type-only / no value binding | `import type { Catalog, Pin, Preset } from './records/preset.js';` |
| contract/types.ts:4 | type-only / no value binding | `import type { RecipePort, ThemePort } from './ports/codecs.js';` |
| contract/types.ts:5 | type-only / no value binding | `import type { IdentityPort } from './ports/identity.js';` |
| core/admission/plan.ts:2 | type-only / no value binding | `import type { Admission, Catalog, Preset, ThemePreset } from '../../contract/records/preset.js';` |
| core/admission/plan.ts:3 | type-only / no value binding | `import type { PresetPlan } from '../../contract/types.js';` |
| core/admission/plan.ts:4 | type-only / no value binding | `import type { RecipePort, ThemePort } from '../../contract/ports/codecs.js';` |
| core/admission/plan.ts:5 | type-only / no value binding | `import type { IdentityPort } from '../../contract/ports/identity.js';` |
| core/admission/plan.ts:12 | type-only / no value binding | `import type { Result } from '../../contract/errors.js';` |
| core/discovery/select.ts:1 | type-only / no value binding | `import type { Catalog, Selection, Preset, Query } from '../../contract/records/preset.js';` |
| core/discovery/select.ts:2 | type-only / no value binding | `import type { Summary } from '../../contract/types.js';` |
| core/discovery/select.ts:4 | type-only / no value binding | `import type { Result } from '../../contract/errors.js';` |
| core/expansion/instantiate.ts:1 | type-only / no value binding | `import type { Catalog, ExpansionRequest, Preset, RecipePayload, } from '../../contract/records/preset.js';` |
| core/expansion/instantiate.ts:7 | type-only / no value binding | `import type { RecipePort } from '../../contract/ports/codecs.js';` |
| core/expansion/instantiate.ts:8 | type-only / no value binding | `import type { Expansion } from '../../contract/types.js';` |
| core/expansion/instantiate.ts:9 | type-only / no value binding | `import type { Result } from '../../contract/errors.js';` |
| core/validation/catalog.ts:2 | type-only / no value binding | `import type { Catalog, Pin, Preset, ThemePayload, RecipePayload, } from '../../contract/records/preset.js';` |
| core/validation/catalog.ts:10 | type-only / no value binding | `import type { Digest } from '../../contract/brands.js';` |
| core/validation/catalog.ts:11 | type-only / no value binding | `import type { IdentityPort } from '../../contract/ports/identity.js';` |
| core/validation/catalog.ts:13 | type-only / no value binding | `import type { Result } from '../../contract/errors.js';` |
| core/validation/outcomes.ts:2 | type-only / no value binding | `import type { Result } from '../../contract/errors.js';` |

## Isolated nodes

- contract/ports/codecs.ts
- contract/ports/identity.ts
- contract/records/failure-source.ts
- contract/types.ts
