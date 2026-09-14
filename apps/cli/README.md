# CLI host

`pnpm canvas` — agent-facing command line for the local service. Commands: `describe`, `list`, `read`, `create`, `replace`, `patch`, `preview`, `apply`, `receipt`, `retry`, `inspect`, `theme admit`.

Translates DSL files and flags into service requests; all domain behavior comes from capability contracts via the service. Composition follows the same contract/core/adapters shape and import gates as the capabilities.
