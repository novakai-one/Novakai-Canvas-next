# Stage 1 — Entities and invariants

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

Collection "1" ──< "1..n" Section
Collection "1" ──< "1..n" DiagramObject
Collection "1" ──< "0..n" Relationship
Relationship "1" ── "2" Endpoint
Section "1" ──< "0..n" Appearance / WireAppearance

Existing records/signatures remain unchanged. ObjectId, RelationshipId and SectionId retain checked identities. Endpoint { object: ObjectId, member?: DescendantId }; Relationship { id, kind, label, source, target, ... }; WireAppearance { relationship, route, sourceSide, targetSide, ... }.

| Invariant | Acceptance |
| --- | --- |
| Meaning | Water path source→settle→filter→disinfect→supply; residual branches distinct from samples/monitoring. No claim that a single barrier makes all source water safe. |
| Flow | Research ethics/methods reviews run in parallel, join, decide; rejection returns to revision/triage. Branches labelled. |
| Engineering | Publishing consumer imports PublicationPort; adapter implements it; function and external CMS contract visible with typed endpoints. |
| Visibility | Every relationship needed by a viewer has a declared wire and section connect; notes are not forced into causal edges. |
| Scope | Three standalone collections, each ≤300 readable source lines; no geometry authored. Existing mode/layout compatibility preserved. |

File scope and per-file LOC estimates: [Doc6](Doc6-File-Scope-and-Estimates.md). Existing authoritative types are reused; projected values do not become competing domain owners.
