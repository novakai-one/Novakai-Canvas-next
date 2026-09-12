# Stage 5 — Public modules and contracts

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| Existing public pathway | Accepted operation | Observable return / condition |
| --- | --- | --- |
| CLI describe/create/read/replace | Valid semantic source and current revision | Exit success only on checked result; committed receipt retained; readout is authorable full DSL. |
| Authoring.apply/receipt/read | Current request ID and snapshot expectations | Existing typed Results; stale/invalid request rejects atomically and originating diagnostics survive. |
| Canvas scene admission | Changed admitted scene from live subscription | New content visible without unsolicited camera move; node/edge identity preserved. |
| Persistence reopen through service | Same workspace after orderly restart | Same admitted collection revision/content/geometry; no manual JSON restore. |
| Export.exportArtifact | Selected collection/section and supported format | Result<Artifact> carrying real encoded output/resources, not a screenshot substituted for diagram content. |

Manifest is repository example/navigation metadata, not a new runtime capability. No speculative catalog or panel features. Existing CLI/server APIs remain authoritative.

## Required return protocol

```ts
type Result<T, E = CapabilityError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

Each capability declares the shape locally; E is its named closed error vocabulary. Validation errors hold non-empty typed diagnostics. Consumer boundary errors preserve originating evidence in typed error.source; serializers validate and retain it. No partial value, optional second failure channel or recovery by parsing prose. Display adapters alone format messages. Private typed throws are allowed when the public boundary converts them to Result. No new callable public API is implied by private helpers in Doc6.
