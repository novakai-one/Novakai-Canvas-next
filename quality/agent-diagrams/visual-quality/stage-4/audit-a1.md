# Stage 4 — A1 implementation/coding/visual audit

One fresh bounded read-only audit; five source targets. No browser launches, full suite or edits. No blocking implementation defect found. Independent target scores before the one findings fix: fields150, headings148, collection153, SequenceLayer151, SVG sequence150.

| Category | Finding | Independent verification and one-round disposition |
| --- | --- | --- |
| major build risk | Cropped browser evidence cannot establish full graph parity. | Verified narrow 618px panel; added fit overviews and readable crops including vendor boundary and all sequence participants. Full PNGs establish complete artifact, crops establish readable canvas. UI toolbar/minimap occlusion remains deferred UI work, never hidden as a passing readability assertion. |
| minor | Sequence lifelines cross label glyphs. | Verified actual PNG. Both existing sequence renderers now back measured label boxes with the diagram surface, with no inherited text stroke. Existing Export case checks backing; actual PNG/browser re-inspected. |
| minor | Tree root junction is crowded. | Verified original root three-way branch overlay. Authored semantic source sides separate the primary branch from downward branches; no coordinate changes or graph-specific code. Final tree PNG and browser re-inspected. |

Independent P1–P16 vectors:

| Target | Vector | /160 | Deductions |
| --- | --- | ---: | --- |
| fields.ts | 10,6,7,10,10,9,10,10,10,8,10,10,10,10,10,10 | 150 | OCP fixed column steps; LSP absent; ordered key vocabulary duplicated; target-local recovery unnamed. |
| headings.ts | 10,6,7,10,10,10,10,10,10,10,5,10,10,10,10,10 | 148 | OCP fixed kind vocabulary; LSP absent; thin helper. |
| collection.ts | 10,6,7,10,10,10,10,10,10,10,10,10,10,10,10,10 | 153 | Fixed projection steps; LSP absent. |
| SequenceLayer.tsx | 10,6,7,10,10,10,10,10,10,8,10,10,10,10,10,10 | 151 | Fixed annotation layers; LSP absent; recovery unnamed locally. |
| SVG sequence.tsx | 10,6,7,10,10,9,10,10,10,8,10,10,10,10,10,10 | 150 | Fixed layers; LSP absent; repeated dash fact; local recovery unnamed. |

All five exports demonstrate ER combined membership/nullability/cardinalities, canonical headings and long typed contracts, nested sequence fragments, guarded state recovery, and tree parent/reference semantics. Audit is a sample, not repository certification. Source manifest and final builder review distinguish post-audit label-backing edits. No re-audit.
