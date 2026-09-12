# PR2 post-audit correction disposition

This is the one permitted correction round. The copied [A1](pr2-a1.md) and [A2](pr2-a2.md) reports were not rerun. Before production changes, extended existing cases reproduced three failures: hidden fields widened summary nodes, a nonfinite signature probe returned success, and an overflowing derived line height returned success. Source inspection independently confirmed the weak media/operator/line-height assertions and repeated local policies.

|Finding|Disposition|
|---|---|
|A1 hidden-field sizing|Fixed. One visible-body selection now drives planning and visible measurement; canonical measurement remains separate for complete outlines and collapsed anchors. Existing Presentation case 7 compares summary/full widths and the hidden anchor.|
|A1 signature `NaN` width|Fixed. Signature atomic measurements reject every nonfinite or negative provider dimension through the existing `provider-failed` result. Existing case 4 covers the formerly accepted candidate width.|
|A1 derived metric overflow|Fixed. Design System checks projected font sizes and derived line heights against Presentation’s finite-positive ≤10000 boundary. Existing theme case 7 covers finite input whose multiplication overflows.|
|A1 declaration TSDoc|Fixed for the named Presentation/Design System entry points and all four new Presentation type aliases; responsibility and recovery ownership are explicit.|
|A1 local duplication|Fixed locally: visible-detail selection, node/group width planning, signature punctuation assembly and token-number extraction each have one policy.|
|A1 section-title preference|Accepted as required polish. Section headings measure against the existing large-band ceiling, while the returned width remains the actual glyph measurement rather than a forced 500-unit box.|
|A2 media assertions|Fixed in existing case 6. Distinct alt labels identify each viewport; each asserts exact slot bounds, its own fit, cover clipping and title.|
|A2 visible operators|Fixed in existing case 7 with literal visible text assertions for `loop`, `opt` and `alt`, alongside outlines.|
|A2 line heights|Fixed in existing theme case 7 with literal mono and annotation expectations.|

No test definition was added. Layout internals/routing, Model, Language, panels, PR3 resources, services, browser acceptance and native fixture redesign were untouched.

Residual: interpretation of the pre-existing native Layout/Export test-file scores remains pending user clarification. Passing tests do not waive that recorded gate, and no score was raised or test weakened to conceal it.
