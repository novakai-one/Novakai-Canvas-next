# Independently reproduced Authoring regressions before the sole fix

Same14 frozen cases, two failures before correction.

```text

 RUN  v5.0.0 /Users/christopherdasca/Programming/Novakai-Canvas-next

(node:31314) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:31315) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:31313) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:31312) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 ❯ capability/authoring/tests/retries.test.ts (3 tests | 1 failed) 80ms
   ❯ Authoring retry identity (3)
     × 7 simultaneous retries have one effect; reused IDs reject; unrelated collection edits both commit 42ms
 ❯ capability/authoring/tests/history.test.ts (2 tests | 1 failed) 93ms
   ❯ Authoring reversible transactions (2)
     × 10 missing history, duplicate inverse, divergent participants and invalid/infeasible inverse reject atomically 40ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  capability/authoring/tests/history.test.ts > Authoring reversible transactions > 10 missing history, duplicate inverse, divergent participants and invalid/infeasible inverse reject atomically
AssertionError: expected { ok: true, value: { …(5) } } to match object { ok: false, …(1) }
(6 matching properties omitted from actual)

- Expected
+ Received

  {
-   "error": {
-     "code": "corrupt-record",
-   },
-   "ok": false,
+   "ok": true,
  }

 ❯ rejects capability/authoring/tests/fixtures.ts:36:18
     34| /** Failure expectations use specified categories, not implementation …
     35| export function rejects(result: Result<unknown>, code: string): void {
     36|   expect(result).toMatchObject({ ok: false, error: { code } });
       |                  ^
     37|   expect(result).not.toHaveProperty('value');
     38| }
 ❯ capability/authoring/tests/history.test.ts:117:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  capability/authoring/tests/retries.test.ts > Authoring retry identity > 7 simultaneous retries have one effect; reused IDs reject; unrelated collection edits both commit
AssertionError: {"ok":false,"error":{"code":"revision-conflict","path":"collection/demo","targets":["collection/demo"],"message":"The observed record version has changed","recovery":"Retain the draft. Reconcile this request receipt before retry; re-read versions before submitting changed intent under a new request ID.","traceId":null}}
 ❯ value capability/authoring/tests/fixtures.ts:31:3
     29| /** Vitest owns assertion failure reporting; never continue with a def…
     30| export function value<T>(result: Result<T>): T {
     31|   assert(result.ok, JSON.stringify(result));
       |   ^
     32|   return result.value;
     33| }
 ❯ capability/authoring/tests/retries.test.ts:85:12

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯


 Test Files  2 failed | 2 passed (4)
      Tests  2 failed | 12 passed (14)
   Start at  07:11:33
   Duration  408ms (transform 52%, tests 26%, import 22%, worker 1%)


```
