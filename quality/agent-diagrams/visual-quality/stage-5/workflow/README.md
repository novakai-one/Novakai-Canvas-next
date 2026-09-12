# Live authoring and durability

Actual local workspace `.local/visual-quality-proof`; existing visible in-app tab 13; no headless/external browser. Input is [longer-explanation.canvas](longer-explanation.canvas), a semantic ordered DSL patch. No coordinates or direct collection JSON writes.

| Step | Observed result | Evidence |
| --- | --- | --- |
| Open story-evidence-lesson revision 2, reading at 73% | Short caption visible; EXPLAIN + BOUND top-left ~159,282. | [Before](../browser/live-edit-before.png) |
| Agent patch at expected revision 2, request vq5-live-longer-explanation | Committed revision 3 / workspace sequence 67. | [Receipt](../receipts/live-longer-explanation.txt) |
| Observe same browser without navigation/fit | New 170-character caption wraps; region grows, limit note moves down; zoom stays 73%, same region origin. | [Live after](../browser/live-edit-after.png) |
| Refresh same URL | Accepted longer text and diagram retained; fit explicitly reapplied for overview. | [Refresh](../browser/longer-caption-refresh.png) |
| Stop owned service, restart same port/workspace | Canonical collection, projection, measurements and scene unchanged, revision 3 retained. | [Before hashes](before-restart.json), [after hashes](after-restart.json) |
| Reload browser after restart | Same accepted diagram rendered. Camera persistence across reload is not claimed. | [Restart](../browser/longer-caption-restart.png) |
| Re-encode real SVG and PNG before/after restart | Byte-identical SVG SHA256 6a64f8b8c66f79b15de576ad7b6e1cec418c8a748552bc5c02f5dffa89e889da; PNG c5e7909a3ace9acfd1969b7f3ad994bbc9f899b4225f02f0bfdb625109c43395. | [Final exports](../final/story-evidence-lesson.png) |

Before/after JSON hashes use SHA256 over sorted-key JSON for each whole value; no semantic or geometry fields excluded. The export check compares actual bytes. Longer content's final source, fixture and readout are revision-aligned in provenance.json. Canvas still has deferred toolbar/minimap occlusion at this 618px viewport; complete export and reading crops complement the overview.
