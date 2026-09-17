# Novakai Canvas

A local diagram application for engineering, education and communication, built for human and agent authoring. Agents author a semantic DSL (never JSON coordinates); humans use the React Flow canvas. All writes pass through one admission gate with receipts and undo.

## Layout

- `capability/` — 12 domain capabilities: model, library, persistence, assets, templates, presentation, layout, authoring, language, design-system, canvas, export. Each exposes a public `contract/index.ts`; core stays private.
- `apps/` — hosts: `web` (React Flow workspace), `service` (authenticated local HTTP service), `cli` (`pnpm canvas`).
- `resources/` — themes, recipes, fonts, example DSL, panel defaults, vendored layout engines.
- `quality/agent-diagrams/references/` — visual target images. `quality/agent-diagrams/visual-quality/stage-5/inputs/` — export corpus fixtures consumed by `capability/export` tests.
- `docs/` — standards, agent SOP and visual references, maintenance notes.

## Run

```sh
pnpm install --frozen-lockfile
pnpm --filter @novakai/canvas-web build
pnpm dev --port 5185 --workspace .local/demo
pnpm canvas list --server http://127.0.0.1:5185 --workspace .local/demo
```

Open `http://127.0.0.1:5185/?collection=<id>` in the browser. Example DSL sources and a full walkthrough: `resources/examples/showcase/README.md`.

## Rules

- Development contract: [AGENTS.md](AGENTS.md)
- Coding standards: [CODING-STANDARDS.md](CODING-STANDARDS.md) and [docs/standards](docs/standards/)
- Agent diagram authoring: [SOP](docs/agent-diagrams/visual-quality/SOP.md) and [visual references](docs/agent-diagrams/visual-quality/References.md)
- Deferred work and findings: [docs/maintenance/diagram-quality-improvements.md](docs/maintenance/diagram-quality-improvements.md)

Gate for every change: `pnpm check` (typecheck, ESLint with Sonar ≤2, Prettier, import boundaries, tests).

### M7.6 — lazy road audit and toolbar presentation

Road coverage now runs only while Show roads is enabled; the off view makes no
accounting claim. Twelve section tabs wrap, and wire choices show existing file
names with ID fallback. Five-load roads-off medians: scale **235.7ms** (before
1,556.7ms), templates **190.8ms** (before 374.5ms); selection **183.4ms**, zero click
recalculations. Scene bytes, invariant counts and exact layout ops are unchanged;
`pnpm check` passes 208 tests.

**STOP: DoD-6 open-dropdown screenshot remains unavailable in headless capture.**
The implementation is retained locally, with no push or PR. Existing dense-scene
visual limits remain. [Full M7.6 evidence, scheduling, stage timings and limits](output/playwright/nested-wires/presentation/m76/amended-report.md).
