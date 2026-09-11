---
date created: Tue 25 Aug, 9:06 AM
date modified: Wed 26 Aug, 5:13 AM
custom-width: 88
---
# SOP — Repo Folder Structure

Target layout for new packages. Minimum shape, not exhaustive. **If a call isn't in the call-permissions matrix, it's forbidden.**

## Target shape

```
package/
├── contract/                     # the ONLY legal import surface for consumers — shapes, no domain policy
│   ├── index.ts                  # controlled exports — nothing public unless listed here
│   ├── types.ts                  # shared domain types
│   ├── schemas.ts                # runtime-validated shapes (zod etc.)
│   ├── brands.ts                 # typed, non-interchangeable IDs
│   ├── errors.ts                 # typed error outcomes
│   ├── events.ts                 # durable event definitions (data, not behavior)
│   ├── records/                  # durable entity shapes (data, not behavior)
│   ├── api.ts                    # the callable surface — or api/ folder when it grows
│   ├── compose.ts                # composition root — binds concrete deps once
│   └── ports/                    # seam interfaces that BOTH core and adapters import
│       ├── store.ts              #   e.g. persistence port
│       └── clock.ts              #   e.g. clock port
├── core/                         # private implementation — consumer import = violation
│   ├── engine/                   # one folder per domain concern
│   │   ├── engine.ts
│   │   └── lock.ts
│   ├── session/
│   │   └── store.ts
│   └── event-bus.ts              # core modules call each other directly — no ceremony
├── adapters/                     # exists for every I/O seam — an in-memory/test implementation counts as the 2nd implementation
│   ├── stores/
│   │   ├── jsonl.ts              # production adapter satisfying ports/store.ts
│   │   └── memory.ts             # test adapter satisfying the same port
│   └── system-clock.ts           # satisfies ports/clock.ts
├── cli/                          # OPTIONAL — thin: parse args, call contract/; no domain logic
│   └── nvk-package.ts            # (example name)
└── tests/                        # cross contract/ only, never core/ internals
    └── store-contract.test.ts    # one suite runs unchanged against every store adapter
```

## Seams (ports)

A seam is a place where behaviour can vary (storage, clock, an external system). The **interface** lives in `contract/ports/`; each **implementation** lives in `adapters/`; `compose.ts` picks which implementation core gets.

Exception: consumer-owned role interfaces. A narrow port shaped by one consumer (e.g. `core/send/send-store.ts`) lives in `core/` beside that consumer. `contract/ports/` holds seams adapters implement; `core/` holds slivers only core consumes.

## What core may import

- **Declaration-only** (data, no behavior): `types.ts`, `schemas.ts`, `brands.ts`, `errors.ts`, `events.ts`, `records/`, `ports/` → core **MAY** import.
- **Behavior and wiring**: `api.ts`, `compose.ts`, `index.ts` → core **NEVER** imports.

Red gate: **nothing outside the package ever imports `core/`.**

## Call permissions ("may call"; unlisted = forbidden)

| Caller | Callee | Allowed? |
|---|---|---|
| Outside consumer (package, host app) | `contract/index.ts` | ✅ |
| Outside consumer | `core/` | ❌ — the red-gate violation |
| Outside consumer | `adapters/`, `cli/` internals | ❌ |
| `cli/` | `contract/` | ✅ |
| `cli/` | `core/` | ❌ |
| `adapters/` | `contract/` (incl. `ports/`) | ✅ |
| `adapters/` | `core/` | ❌ |
| `contract/` | own `core/` | ✅ — internal, same package |
| `contract/compose.ts` | `adapters/` | ✅ — wiring only: construct adapters, inject into core; no behavior |
| `core/` | own `core/` (module → module) | ✅ — internal, no ceremony |
| `core/` | declaration-only contract modules | ✅ — shapes, never behavior |
| `core/` | `contract/api.ts`, `compose.ts`, `index.ts`, `cli/`, hosts, other packages | ❌ |
| `tests/` | `contract/` | ✅ |
| `tests/` | `core/` internals | ❌ |
| `tests/` | `adapters/` | ✅ — run one contract suite against every adapter; never test adapter internals |

**Boundary rule:** the hard boundary is the package edge — enforced on *outside* consumers. Inside `core/`, modules talk freely.

## ESLint enforcement (mandatory)

TypeScript has no folder-level privacy — the call-permissions matrix is law, so it is enforced in CI with `no-restricted-imports` (no new dependency), never left to reviewers remembering. A package is not done until both overrides below are active for it:

```js
// eslint.config.js — applies to every consumer of the packages
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['*/core/*', '**/core/**'],
        message: 'core/ is private. Import the package contract/index.ts instead.',
      }],
    }],
  },
}
```

```js
// second override — "what core may import"
{
  files: ['packages/*/core/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/contract/api*', '**/contract/compose*', '**/contract/index*'],
        message: 'core may import declaration-only contract modules (types, schemas, brands, errors, events, records, ports) — never api, compose or index.',
      }],
    }],
  },
}
```

Stronger alternative if ever needed: `package.json` `"exports"` listing only `./contract/index.js` — deep imports hard-fail at runtime.
