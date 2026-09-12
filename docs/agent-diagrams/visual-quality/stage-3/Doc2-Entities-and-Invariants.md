# Stage 3 — Entities and invariants

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

Relationship "1" ── "0..1" StepNumber
VisualWire "1" ── "1" MeasuredAnnotation
SceneWire "1" ── "1" Route
Route "1" ──< "2..n" ResolvedPoint

StepNumber = positive safe integer; canonical across all appearances, not object identity. Duplicates/gaps are allowed; no automatic renumbering.
DSL: wire @process @a -> @b "Transfers evidence" kind=flow step=2
MeasuredAnnotation { content: MeasuredContent, bounds: Box }; its step badge and label form one measured footprint. Existing source-side/target-side and route controls remain the default sufficient authoring surface. No new waypoint coordinates in agent source.

| Invariant | Acceptance |
| --- | --- |
| Meaning | Step number supplements a required non-empty wire label; label and badge survive read/edit/export. |
| Endpoints | Wire attaches to exact declared member/port or visible collapsed representation; no unexplained jump to another row. |
| Clearance | Complete annotations avoid every foreign completed route, markers, headers and nodes. Obscuring collinear overlaps reject; shared endpoint stubs are allowed only while relationships remain attributable. |
| Routes | Branch/join/return corridors remain attributable and bounded; impossible constraints return typed rejection, not overlapping fabricated success. |
| Stability | Route-only work does not move nodes. Human locks preserved. Deterministic ties do not oscillate across identical inputs. |
| Quality | No universal zero-crossing requirement; repair avoidable obscuring crossings and detours, label unavoidable topology clearly. |

File scope and per-file LOC estimates: [Doc6](Doc6-File-Scope-and-Estimates.md). Existing authoritative types are reused; projected values do not become competing domain owners.

Wire paint (stroke, width and dash pattern) resolves from diagram tokens into the measured projection/scene. Canvas and Export consume that same style; UI preferences cannot recolor admitted wires. Badge fill/text also use resolved diagram roles. Runtime scene readers retain and verify these fields.
