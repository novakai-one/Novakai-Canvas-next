# Presentation A2 — sole bounded test-correctness audit

Reviewer: templates_plan_pressure. Read-only; four targets: tests/fixtures.ts, projection.test.ts, notation.test.ts, rendering.test.ts. Completed within8minutes. Ten cases pass. No incorrect assertion found after three concrete attempts.

|Attempt|Independent result|
|---|---|
|Font table oracle|iiii/WWWW each38.4 at16; vertical extent21.12; unicorn glyph absent|
|Media ratio|200×100 resource at180 width gives90 height|
|ER symbols|Mandatory/optional one/many bar/circle/crow-foot combinations agree|

|Category|Finding|Author verification / disposition|
|---|---|---|
|minor|Camera absence substring assertion does not prove changing host camera independence|Verified: camera is deliberately absent from the capability contract. Remove the misleading assertion/name claim; host camera behavior is a Part2 visible-browser criterion.|
|minor|Shape metadata/width assertion does not prove geometry or content containment|Verified: the test changed only shape on a measured step. Replace with actual canonical kind projections and independent geometric/containment checks inside existing case9.|

Preliminary adapter-import candidate withdrawn after checking baseline03: own tests may import own adapters to run public-role contract tests. Fontkit tests exercise MeasurementPort and public composition also runs it. No source-boundary change warranted. One findings-only fix round; no subsequent audit.
