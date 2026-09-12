**Three assertion gaps verified.** Compared `a14f04a..7466210` with all five PR2 specs and validated plan fixes. The 12 target tests passed normally—and with all three counterexamples applied in memory. Files remain unchanged; test definitions remain 12→12.

These are test-correctness findings, not three additional production bugs.

| Category | Evidence and verified counterexample | Smallest fix |
|---|---|---|
| engineering violation | [projection.test.ts:426](/Users/christopherdasca/Programming/Novakai-Canvas-next-typography/capability/presentation/tests/projection.test.ts:426) checks fragment **outlines**, despite PR2 requiring visible operators. Removing `loop`, `opt`, and `alt` from visible text primitives while retaining canonical outlines left every assertion passing. | Extend case 7 to assert each fragment’s visible text against literal expected labels, alongside the existing outline checks. |
| engineering violation | [projection.test.ts:314](/Users/christopherdasca/Programming/Novakai-Canvas-next-typography/capability/presentation/tests/projection.test.ts:314) checks markup-wide substrings. Swapping contain/cover mappings and making the cover viewport `overflow="visible"` still passed: the other viewport supplied `overflow="hidden"`, and both fit strings remained present. Slot-coordinate assertions did not detect incorrect artwork behavior. | Extend case 6 to inspect each media viewport separately: exact slot bounds, its own image’s `xMidYMid slice`/`meet`, cover clipping, and associated alt text. Use distinct fixture alt labels to identify both assets. |
| minor | [themes.test.ts:82](/Users/christopherdasca/Programming/Novakai-Canvas-next-typography/capability/design-system/tests/themes.test.ts:82) asserts all five sizes but only three line heights. Returning finite mono/annotation line heights equal to their font sizes—16 and 13.714288—passed, violating the frozen ×1.5 derivation. This is distinct from A1’s nonfinite-result finding. | Extend theme case 7 with literal expected mono line height **24** and annotation line height **20.571432**. |

The remaining requested checks have mixed strength:

- **Signatures and structured sizing:** case 4 checks complete visible signature runs, punctuation binding, 24px baseline intervals, canonical anchor text, and expansion beyond explicit width. Dense fields and table columns have concrete content/alignment assertions.
- **Summary versus full:** case 7 verifies visible table rows and hidden prose while retaining the outline, but does not compare summary/full widths. A1’s hidden-field sizing defect remains unguarded; I am not counting it again.
- **Invalid metrics:** case 10 exercises a throwing provider on an ordinary node, not successfully returned nonfinite signature measurements. Theme tests likewise lack a nonfinite derivation rejection scenario. These coverage omissions correspond to A1’s existing findings.
- **Fonts, centering, and groups:** rendering checks body/mono digests; media checks exact centered slot coordinates. The represented-group reserve has both equality-to-height and an independent **118px** expectation; an ordinary module header is separately fixed at **54px**. Those assertions provide useful signal.

No separate major build risk or preference finding established. All proposed fixes fit existing test definitions. Read-only audit complete; no fixes or re-audit performed, and fixture grading remains outside this review.
