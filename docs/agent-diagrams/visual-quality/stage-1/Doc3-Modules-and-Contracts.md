# Stage 1 — Public modules and contracts

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| Public surface (existing) | Accept | Return / condition |
| --- | --- | --- |
| Language.parse(source: string) | DSL canvas source | Result<ParsedSource>; syntax failure retains spans. |
| Language.lower(request: LowerRequest) | source, mode, snapshot, resource bindings | Result<LoweredIntent>; valid immutable candidate, no commit. |
| Language.print(request: PrintRequest) | validated collection / full scope | Result<Readout>; source preserves objects, endpoints, labels and grouping. |
| Authoring.apply(request: unknown) | prepared current-revision intent | Promise<Result<Receipt>>; only committed receipt proves write. |
| Presentation.project(input: unknown) | admitted collection and required resources | Result<Projection>; measured nodes and all declared visible wires. |
| Layout.arrange(input: unknown) | projection, previous scene, engine/job context | Promise<Result<Scene>>; typed rejection retains prior scene. |

No public API or core behavior changes in this slice. Real CLI create/read/replace invokes these boundaries. Type imports enter only contract/index; private helper wiring is not part of acceptance.

## Required return protocol

```ts
type Result<T, E = CapabilityError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

Each capability declares the shape locally; E is its named closed error vocabulary. Validation errors hold non-empty typed diagnostics. Consumer boundary errors preserve originating evidence in typed error.source; serializers validate and retain it. No partial value, optional second failure channel or recovery by parsing prose. Display adapters alone format messages. Private typed throws are allowed when the public boundary converts them to Result. No new callable public API is implied by private helpers in Doc6.
