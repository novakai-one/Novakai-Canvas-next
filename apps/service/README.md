# service host

Authenticated local HTTP service: `pnpm dev --port N --workspace PATH`.

Composes all capabilities: owns sessions, rendering and inspection jobs, resource admission and physical persistence. The web workspace and CLI both talk to it; no domain rule is decided here. Composition follows the same contract/core/adapters shape and import gates as the capabilities.
