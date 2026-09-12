# Stage 2 — Measured composition and hierarchy

**Responsibility:** Add reusable semantic presentation choices whose measured geometry is shared by canvas and export.

**Owners:** Model owns intent validity; Language owns author/read/edit; Design System owns metrics; Presentation owns measurement and paint; Layout positions measured results.

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

## Scope tree

```text
capability/canvas/adapters/react-flow
capability/canvas/tests
capability/design-system/adapters/styles
capability/design-system/contract/generated
capability/design-system/contract/records
capability/design-system/core/themes
capability/design-system/tests
capability/design-system/tokens
capability/design-system/tokens/themes
capability/export/adapters/svg
capability/export/tests
capability/language/core/lowering
capability/language/core/printing
capability/language/core/vocabulary
capability/language/tests
capability/model/contract
capability/model/contract/records
capability/model/tests
capability/presentation/adapters/react
capability/presentation/contract
capability/presentation/contract/records
capability/presentation/core/content
capability/presentation/core/projection
capability/presentation/tests
resources
resources/examples/showcase
```

[Doc6](Doc6-File-Scope-and-Estimates.md) lists candidate files and estimated sizes; private splits may change without changing accepted behavior. No unrelated panels, persistence rewrite or routing-engine replacement.

**Public imports:** outside consumers enter capability/<owner>/contract/index.ts only. Core uses own core and declaration-only contracts; concrete adapters compose only at contract/compose.ts.

**Stage exit:** all Doc5 conditions, bounded reviews and verified corrections, evidence and PR pushed. Continue to the next stage; intermediate exits do not claim overall benchmark completion.

## Visual context

![Current educational baseline](../assets/current/2026-09-13-water-treatment.png)

![Approved infographic target](../assets/targets/docker-infographic.png)

![Approved engineering target](../assets/targets/aws-global-architecture.png)

See References.md for retained ER/module targets, attribution and exact acceptance dimensions.
