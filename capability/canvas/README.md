# canvas

Responsibility: React Flow view integration and diagram interaction.

Status: directory scaffold only. No callable contract or implementation exists yet.

Outside consumers will import only this capability’s public `contract/index.ts`. Core stays framework-free and imports own declaration-only contracts. Concrete adapters are wired by `contract/compose.ts`; see [repository rules](../../docs/baseline/03-Repository.md) and [root AGENTS](../../AGENTS.md).

Create actual contract/source files with the first complete behavior slice; do not fill this folder with fake success implementations or empty TSX components.
