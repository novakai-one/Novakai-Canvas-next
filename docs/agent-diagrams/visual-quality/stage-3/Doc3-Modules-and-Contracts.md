# Stage 3 — Public modules and contracts

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| Public surface | Accept | Return / condition |
| --- | --- | --- |
| Model.validate/plan | relationship step + existing sides/routes | Existing Result<Collection/ChangePlan>; illegal values reject without partial candidate. |
| Language lower/print/patch | wire step and route intent | Existing Results; full source retains the annotation. |
| Presentation.project/supplement | same collection/resources | Result<Projection/SupplementalMeasurements>; complete annotation/marker footprint before layout. |
| Layout.key(input: unknown) | projection, tokens, previous geometry and engine context | Result<LayoutInputKey>; checked branded identity includes new measured inputs. |
| Layout.arrange(input: unknown) | all measured geometry and constraints | Promise<Result<Scene>>; independently checked scene or structured failure. |
| Layout.route(input: unknown) | fixed nodes and changed relationships | Promise<Result<Scene>>; positions and section origins unchanged. |
| Layout.inspect(input: unknown) | scene + authoritative measured projection | Result<Inspection>; reports actual geometry defects, not a success inferred from router return. |

Existing ELK/Kiwi/libavoid adapters remain unless a demonstrated defect requires repair. Algorithm/candidate internals are not frozen. Owning public contracts and native boundary isolation are frozen.

## Required return protocol

```ts
type Result<T, E = CapabilityError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

Each capability declares the shape locally; E is its named closed error vocabulary. Validation errors hold non-empty typed diagnostics. Consumer boundary errors preserve originating evidence in typed error.source; serializers validate and retain it. No partial value, optional second failure channel or recovery by parsing prose. Display adapters alone format messages. Private typed throws are allowed when the public boundary converts them to Result. No new callable public API is implied by private helpers in Doc6.
