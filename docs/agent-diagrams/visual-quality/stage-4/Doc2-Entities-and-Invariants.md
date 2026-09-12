# Stage 4 — Entities and invariants

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

Entity "1" ──< "1..n" Field
Field "0..n" ── "0..1" ReferencedField
Module "1" ──< "0..n" Port
Interface "1" ──< "1..n" Member
Function "1" ── "1" Signature
Relationship "1" ── "2" Endpoint (+ independent ER cardinalities)
Sequence "1" ──< "1..n" Event / Fragment

Existing records/identities remain; no replacement engineering DSL. Field { id, label, type, key?, nullable, references? }; Signature { id, label, parameters, returns }; Port { id, direction, label, type }; cardinality = "0..1" | "1" | "0..many" | "1..many".

| Invariant | Acceptance |
| --- | --- |
| ER | PK/FK/unique/nullability and composite key membership are visible; simultaneous PK/FK badges fit their measured column; both endpoint minimum/maximum multiplicities remain independent and correct. |
| Modules | Canonical function/interface/module kinds are distinguishable even with frame=none/card/panel; headers reserve measured clearance and retain anchors; ports/types and function parameters/returns remain readable; imports/calls/implements have labels and correct endpoints. |
| Sequence | Participant order, event order, alt/opt/loop scope and activation/return meaning survive visual refinements. |
| State/tree | Guards/effects and parent-vs-reference meaning remain visible. A cross-reference does not become a second tree parent. |
| Density | Long type names expand/wrap measured rows with correct anchors, not clipped text or fixed CSS guesses. |

File scope and per-file LOC estimates: [Doc6](Doc6-File-Scope-and-Estimates.md). Existing authoritative types are reused; projected values do not become competing domain owners.
