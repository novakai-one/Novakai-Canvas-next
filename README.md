# Novakai Canvas

A local diagram application for engineering, education and communication, designed for human and agent authoring.

**Status: nine capabilities implemented; application integration remains in progress.** Model, Library, Persistence, Assets, Templates, Presentation, Layout, Authoring and Language have public contracts, implementations and bounded audit evidence. `pnpm check` passes 112 tests plus type, lint, format and import-boundary checks. Design System, Canvas, Export and the web/service/CLI hosts remain. This is not yet a usable application; browser and restart acceptance are still pending. Follow [the delivery ledger](WORK-PLAN.md).

## Start here

1. [Build order — first five folders](BUILD-ORDER.md)
2. [Functionality](docs/baseline/01-Functionality.md)
3. [Capability responsibilities](docs/baseline/02-Capabilities.md)
4. [Repository and planned source tree](docs/baseline/03-Repository.md)
5. [DSL](docs/baseline/04-DSL.md)
6. [UI/UX and composable panels](docs/baseline/05-UI-UX.md)
7. [Design tokens](docs/baseline/06-Design-Tokens.md)
8. [Development rules](AGENTS.md)

## Shape

```text
canvas/
├── capability/  # 11 domain capabilities + supporting design-system
├── apps/        # web, service, CLI integration hosts
├── resources/   # themes, templates, media, panel layout defaults
├── examples/
├── tests/
├── tools/
├── quality/
└── docs/
```

The contents are intended to move under `novakai/package/canvas/` later. The existing Novakai app is not changed by this scaffold. Native `package.json`/pnpm keys are tooling metadata; internal architectural folders use `capability/`.

[Panel defaults](resources/ui/panels.default.json) specify the starting left/right sections. Feature renderers will be registered by web composition; rearranging layout data does not require modifying the shared panel body.

The first implementation slice must add dependency pins and real import/export/cycle checks. No future per-file score, performance result or UI behavior is certified by this scaffold.
