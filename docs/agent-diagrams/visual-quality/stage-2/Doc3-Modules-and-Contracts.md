# Stage 2 — Public modules and contracts

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| Owner/public contract | Accept | Return / condition |
| --- | --- | --- |
| Model.validate(input: unknown) | existing records plus closed composition fields | Result<Collection>; unknown vocabulary, missing media and malformed overrides reject with typed diagnostics. |
| Model.plan(snapshot, changes) | checked current state and ordered edits | Result<ChangePlan>; immutable valid candidate; no write. |
| Language.describe/parse/lower/print | new fields through existing public requests | Existing Result signatures retained; describe exposes grammar; full readout/patch preserves intent. |
| Design System diagram projection | admitted theme and pinned fonts | Existing StyleProjection extended with named figure/caption metrics; invalid metrics reject. |
| Presentation.project(input: unknown) | checked intent + resolved style/assets | Result<Projection>; measured frames, figures, captions and stable member anchors. |
| Presentation.renderContent(input: unknown) | admitted measured node | Result<string>; paints same primitives as injected Canvas content slot. |
| Export.exportArtifact(input: unknown) | admitted scene/snapshot and format | Promise<Result<Artifact>>; uses existing shared renderer and exact pins. |

Builder may choose internal frame/composition helpers. Export/Canvas cannot reproduce measurement policy. Keep the renderer inside native React Flow nodes; no image-specific route or whole-poster overlay.

## Required return protocol

```ts
type Result<T, E = CapabilityError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

Each capability declares the shape locally; E is its named closed error vocabulary. Validation errors hold non-empty typed diagnostics. Consumer boundary errors preserve originating evidence in typed error.source; serializers validate and retain it. No partial value, optional second failure channel or recovery by parsing prose. Display adapters alone format messages. Private typed throws are allowed when the public boundary converts them to Result. No new callable public API is implied by private helpers in Doc6.
