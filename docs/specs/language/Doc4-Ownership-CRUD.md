# Capability: language — Ownership / CRUD

| Object | Create | Read | Update | Delete |
|---|---|---|---|---|
| DSL source | human/agent | parser | caller editor | caller |
| Token/span | lexer | parser/diagnostics | never | ephemeral |
| Syntax tree | parser | resource discovery/lower | never; parse new source | ephemeral |
| Resource request | parser | caller admission adapter | new source | ephemeral |
| Exact resource pins | injected admission data | lower/print | explicit new Authoring intent | owner retention policy |
| Structural draft | ModelStage | patch compiler only | new immutable prefix result | ephemeral |
| Validated intent | final Model plan | Authoring planner bridge | new request | ephemeral |
| Canonical collection | not Language | ModelReader/print/lower | proposed changes only | proposed explicit delete only |
| Readout | printer | human/agent | regenerate | ephemeral |
| Grammar definition | source registry | parse/lower/print/describe | versioned source change | compatibility decision |

Parsing never grants commit permission. CLI file reading, staging, outbox, authentication and revision envelopes are host adapters; Language exposes their required semantic contract without performing those effects.
