---
custom-width: 100
---
# Capability: model — Target repo tree

**Responsibility:** Model defines the structure and meaning of diagram data, enforces its invariants, and computes valid proposed changes to that data.

```text
Novakai-Canvas-next/
  CODING-STANDARDS.md                  # 16 principles; builder good/bad examples
  package.json / pnpm-lock.yaml        # pinned toolchain; executable checks
  tsconfig.json / eslint.config.js     # strict types; cognitive complexity ≤2
  .dependency-cruiser.cjs              # resolved import/export/cycle gates
  capability/model/
    package.json                      # exports only contract/index.ts
    README.md                         # public usage; recovery ownership
    contract/
      index.ts / api.ts / brands.ts / errors.ts / types.ts
      records/
        content.ts / object.ts / relationship.ts / layout.ts
        section.ts / collection.ts / change.ts
      ports/                          # empty: no I/O seam required
    core/
      invariants/                     # shape, identities, references, immutable output
      objects/                        # structured content and ER keys
      relationships/                  # endpoint legality
      sections/                       # views, groups and mode invariants
      collection/                     # atomic pure planning and preservation
    adapters/                         # empty: no I/O performed
    tests/                            # public contract only; no E2E
  quality/acceptance-evidence/         # counts, single plan audit, two build audits
  quality/file-reviews/                # evidence-based 16-principle scores
```

| Caller | Permitted imports |
|---|---|
| Outside Model | `capability/model/contract/index.ts` or `@novakai/canvas-model` only |
| Model core | Own core; own declaration-only contracts; Zod runtime shapes |
| Contract API | Own core and declarations |
| Contract records | Own declarations and Zod; no core policy |
| Model tests | Public index; test fixtures; test runner |
| Tool configuration | Tool dependencies; no application behavior |

No Model React, CSS, filesystem, network, ambient clock, persistence adapter or host dependency. Future UI and CLI invoke the same public API. Model publishes no durable events. Authoring owns admission, revisions, receipts, history and recovery; Layout owns geometric feasibility.
