# Stage 2 — Entities and invariants

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

Object "1" ── "1" CompositionIntent
Appearance "0..n" ── "1" Object (inherits or overrides presentation intent)
Object "1" ──< "0..n" ContentBlock
MediaBlock "1" ── "1" AdmittedAsset
MeasuredContent "1" ──< "0..n" Primitive / Anchor

CompositionIntent { frame: "auto" | "none" | "card" | "panel", composition: "stack" | "media-top" | "media-left" }
ContainerIntent { frame: "auto" | "none" | "panel", role: semantic token role }
TextRole = "body" | "caption" | "annotation"

DSL: node/show frame=none composition=media-top; text @caption "Short explanation" role=caption. Canonical defaults: frame=auto, composition=stack, text role=body. View override wins over object default. Group DSL: `group @g "Title" frame=panel role=supporting layout=grid`; defaults auto/neutral. Ordinary groups have no media composition. Represented groups inherit object composition/full content; group frame/role override the object. Sections keep existing appearance. Semantic kind remains unchanged; frame=none does not turn an entity into an untyped picture.

| Invariant | Acceptance |
| --- | --- |
| Composition | stack preserves existing order; media-top positions the first image/icon before heading; media-left places it beside heading/body. Remaining blocks retain order and IDs. |
| Missing media | media-top/media-left without a visible image/icon rejects as Model validation-failed with a non-empty diagnostic at the owning object/view; never silently falls back. Full uses all blocks; summary uses the first block; label uses none. A filtered view must explicitly override composition=stack when it hides required media. |
| Frames | auto keeps kind-appropriate default; none removes chrome, not content/selection/anchors; card uses a rounded frame without engineering separators; panel uses token-owned region treatment. Ordinary group auto resolves to panel. |
| Text roles | body uses body metrics; caption uses caption metrics; annotation uses existing annotation metrics. Roles change measured typography, not external placement. |
| Size | small/medium/large select token metrics. contain preserves aspect ratio; cover crops inside measured slot. No hidden truncation. |
| Growth | Longer caption/body changes measured extent and triggers automatic layout. Locked bounds that cannot fit reject explicitly, preserving prior scene. |
| Agreement | Same admitted source/fonts/theme produce identical content primitives and geometry for canvas/static export. No DOM re-wrap or second measurement authority. |

File scope and per-file LOC estimates: [Doc6](Doc6-File-Scope-and-Estimates.md). Existing authoritative types are reused; projected values do not become competing domain owners.
