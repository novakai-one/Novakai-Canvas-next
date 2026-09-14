# Stage 1 — one implementation audit round

Read-only independent agents visual_stage1_a1 and visual_stage1_a2; eight-minute deadline each, three showcase source targets each. Both completed within deadline. No subsequent audit permitted or performed.

| Auditor | Category | Finding | Verification / one fix |
| --- | --- | --- | --- |
| A1 | minor | Capture/source evidence lacks build revision and source hashes. | Confirmed absent; added provenance.json with production commit and SHA256/line counts. |
| A2 | minor | Module capture caption claims occlusion absent in the final capture. | Viewed final screenshot; narrowed caption to dense signatures and uneven whitespace. |

A1: no blocking semantic or Stage1 acceptance violations. A2: complete canonical comparison and recorded hashes verified; 8/10/4 wire counts, IDs, kinds and endpoints preserved. No production code changed, so a new TS coding score is inapplicable.

| A2 attempted false pass | Result |
| --- | --- |
| Change @treated endpoint from @supply to @residuals while retaining the requested label | Full-source comparison rejects additional difference. |
| Delete @wash while retaining the requested label | Full-source comparison rejects deletion. |
| Interpret exit code 0 of the initial module receipt as committed | Output explicitly says no committed receipt; evidence records failure and a separate corrected request. |

Tests added: 0. Existing CLI admission, actual receipts, readouts and visible browser captures supply Stage1 evidence. This is not a certification of final benchmark quality.
