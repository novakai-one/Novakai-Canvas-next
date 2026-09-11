# Verified pre-fix regression

```text

 RUN  v5.0.0 /Users/christopherdasca/Programming/Novakai-Canvas-next

 ❯ capability/language/tests/boundaries.test.ts (3 tests | 1 failed) 1324ms
   ❯ Language correction and safety boundaries (3)
     × 16 — reports typed diagnostics with precise spans for unknown syntax and wrong values 4ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  capability/language/tests/boundaries.test.ts > Language correction and safety boundaries > 16 — reports typed diagnostics with precise spans for unknown syntax and wrong values
AssertionError: Expected a typed rejection
 ❯ rejected capability/language/tests/fixtures.ts:44:3
     42| /** Rejection assertions require absence of candidate and the intended…
     43| export function rejected(result: Result<unknown>, code: DiagnosticCode…
     44|   assert(!result.ok, 'Expected a typed rejection');
       |   ^
     45|   expect(result).not.toHaveProperty('value');
     46|   expect(result.diagnostics).toEqual(expect.arrayContaining([expect.ob…
 ❯ capability/language/tests/boundaries.test.ts:17:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 4 passed (5)
      Tests  1 failed | 17 passed (18)
   Start at  08:12:51
   Duration  1.62s (tests 57%, transform 30%, import 12%)


```
