# Stage 4 — Public modules and contracts

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| Surface | Accept | Return / condition |
| --- | --- | --- |
| Model / Language existing contracts | Current engineering DSL and checked domain | Signatures unchanged; invalid members/cardinalities reject at their owning boundary. |
| Presentation.project/renderContent | Existing typed rows, signatures, ports and sequence annotations | Existing typed Results; exact semantic rows and anchors with refined visual hierarchy. |
| Layout.arrange/route/inspect | Measured engineering scene | Existing typed Results; correct row attachment, sequence spacing and hierarchy geometry. |
| Canvas / Export shared slots | Same admitted scene | Meaning and geometry agree between browser and encoded artifact. |

No new module renderer or hand-crafted database chart. Add special notation only when it represents a general semantic concept, with checked vocabulary and more than one relevant example. Private helper wiring remains unrestricted within standards.

## Required return protocol

```ts
type Result<T, E = CapabilityError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

Each capability declares the shape locally; E is its named closed error vocabulary. Validation errors hold non-empty typed diagnostics. Consumer boundary errors preserve originating evidence in typed error.source; serializers validate and retain it. No partial value, optional second failure channel or recovery by parsing prose. Display adapters alone format messages. Private typed throws are allowed when the public boundary converts them to Result. No new callable public API is implied by private helpers in Doc6.
