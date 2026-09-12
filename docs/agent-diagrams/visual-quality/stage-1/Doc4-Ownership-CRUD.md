# Stage 1 — Ownership / CRUD

Shared requirements: [SOP](../SOP.md), [current/target images](../References.md), [overall done](../README.md), [coding/error standards](../../../../CODING-STANDARDS.md).

| Record / artifact | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| DSL source | Agent in repository | Agent / Language | Agent semantic edits | Agent; no coordinate source |
| Canonical collection and diagram intent | Authoring applies Model-valid candidate | Owner public contracts | Authoring with revision/request identity | Authoring only |
| Model-valid candidate | Model validate/plan | Authoring / declared consumer ports | New immutable candidate | Discard on rejection |
| Measured content / projection | Presentation | Layout / composed renderers | Recompute from source/theme/assets | Discard derived result |
| Scene / route | Layout | Canvas / Export / Authoring feasibility | Recompute or route-only under locks | Replace derived scene |
| Theme metrics | Design System | Presentation / Canvas / Export | Resolve changed roots and pin version | Owner-managed resource lifecycle |
| Admitted image/font | Assets through normal admission | Named resource ports | New digest, not mutation | Existing resource policy |
| Stored JSON/SQLite | Persistence under Authoring transaction | Existing storage ports | Physical atomic write only | Existing lifecycle policy |
| Captures / receipts / evidence | Orchestrator after real operation | Auditors / user | Append corrected evidence with source revision | Preserve provenance; no false pass |

No new runtime store or event channel. Failed validation/layout/render admission leaves the prior committed document and usable scene intact. Existing notification path publishes committed changes; agents never bypass Authoring.
