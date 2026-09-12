# Stage 1 — existing-DSL baseline proof

Status: built; one A1 and one A2 completed; verified minor findings fixed. This stage does **not** claim benchmark quality. No production TypeScript, TSX or CSS changed; no tests added.

| Proof | Committed evidence | Visible evidence | Remaining gap |
| --- | --- | --- | --- |
| Water treatment | `water-read-before.canvas`, `water-read-after.canvas`, `read-edit-proof.json`; 8 labelled wires | `water-reading.png` | Small symbols, uniform cards, long exterior monitoring routes; fine text needs zoom. |
| Research review | `research-read.canvas`; 10 labelled wires | `research-reading.png` | Parallel branches stack vertically, close routes, toolbar overlaps heading at default fit. |
| Publishing architecture | `modules-read.canvas`; 4 labelled wires | `modules-reading.png` | Large signature tables and uneven whitespace; final capture fits without chrome occlusion. |

`receipts.json` preserves actual CLI receipt outputs. Successful requests: water create sequence 11, research create 12, water replace 13, corrected module create 14. The initial module request failed because a member port used a bottom side. Correcting the source to a right-side attachment succeeded. The server was restarted on current code during this check; its previous process predated PR24 and could not decode the fresh worker's structured rejection. No production fix was needed.

Read/edit comparison accepts exactly the requested label change and revision 0→1. It compares the complete canonical readout, preserving all other source bytes (including IDs, kinds, endpoints, other labels and group membership). The connected browser separately displayed the new label and eight wires.

Screenshots are from the visible in-app browser on localhost:5185, not headless render substitutes. Application chrome and current composition defects are retained honestly. The targets in the build docs remain the final acceptance bar. Stage 2 addresses reusable composition; Stage 3 routing/annotations and first benchmark proof; Stage 4 engineering polish; Stage 5 broad transfer.

`provenance.json` identifies the production code revision and exact source/capture hashes. `implementation-audits.md` records the one bounded review round and verified fixes.
