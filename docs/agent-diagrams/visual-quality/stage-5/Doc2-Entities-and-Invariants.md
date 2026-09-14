# Stage 5 — Entities and invariants

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

Showcase "1" ── "8" Family
Family "1" ── "3" OriginalExample
OriginalExample "1" ── "1" DSLSource (≤300 physical lines)
OriginalExample "1" ──< "1..n" Capture / Export / Receipt
Manifest "1" ──< "24" ExampleReference

ExampleReference { family, collectionId, sourcePath, purpose, distinguishingStructure }
Evidence { sourceDigest, codeRevision, collectionRevision, receiptId, screenshotPath, exportPath, checks, knownGaps }

| Invariant | Acceptance |
| --- | --- |
| Breadth | Three distinct subjects/structures per family, not recolorings or the same layout with renamed labels. |
| Splitting | Coherent connected story stays in its collection; source ≤300 lines; no concealed cross-collection wires or compression tricks. |
| Mixed use | One small collection has two diagram families; others can be standalone. No requirement to fit all examples in one canvas. |
| Honesty | Evidence names the exact inspected source/code/revision. No generated count or fixture grants visual approval. |
| Nested ordering | Group/node before or rank intent preserves measured cross-branch label space; nested ownership uses the same scope graph during seeding and constraint solving. |
| Durability | Read/edit/replace, live update, refresh/restart and export preserve semantics and accepted layout through Authoring. |

File scope and per-file LOC estimates: [Doc6](Doc6-File-Scope-and-Estimates.md). Existing authoritative types are reused; projected values do not become competing domain owners.
