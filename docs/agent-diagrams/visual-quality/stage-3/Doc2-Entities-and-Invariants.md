# Stage 3 — Entities and invariants

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

Relationship "1" ── "0..1" StepNumber
VisualWire "1" ── "1" MeasuredAnnotation
SceneWire "1" ── "1" Route
Route "1" ──< "2..n" ResolvedPoint

StepNumber = positive integer (display order, not object identity)
DSL: wire @process @a -> @b "Transfers evidence" kind=flow step=2
MeasuredAnnotation { content: MeasuredContent, bounds: Box }; its step badge and label form one measured footprint. Existing source-side/target-side and route controls remain the default sufficient authoring surface. No new waypoint coordinates in agent source.

| Invariant | Acceptance |
| --- | --- |
| Meaning | Step number supplements a required non-empty wire label; label and badge survive read/edit/export. |
| Endpoints | Wire attaches to exact declared member/port or visible collapsed representation; no unexplained jump to another row. |
| Clearance | Badge, label, markers, headers and nodes participate in collision checks using measured bounds. |
| Routes | Branch/join/return corridors remain attributable and bounded; impossible constraints return typed rejection, not overlapping fabricated success. |
| Stability | Route-only work does not move nodes. Human locks preserved. Deterministic ties do not oscillate across identical inputs. |
| Quality | No universal zero-crossing requirement; repair avoidable obscuring crossings and detours, label unavoidable topology clearly. |

File scope and per-file LOC estimates: [Doc6](Doc6-File-Scope-and-Estimates.md). Existing authoritative types are reused; projected values do not become competing domain owners.
