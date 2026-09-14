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
