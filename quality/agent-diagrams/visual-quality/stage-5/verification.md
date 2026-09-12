# Stage 5 verification

Final full `pnpm check`: typecheck, ESLint/Sonar≤2, formatting, import architecture and **195 tests /69 files pass**; suite duration 16.20s. Web build and tokens:check pass. No E2E tests. Four new cases remain within the declared 8s allowance; focused final run 1.51s.

## Mutation probes after the single audit fix

### erased-markers

```text
AssertionError: expected  to have a length of 2 but got +0

- Expected
+ Received

- 2
+ 0
```

### erased-frames

```text
AssertionError: expected [] to deep equally contain [ 12, 128.57142, 256, 128.57142, …(2) ]

- Expected
+ Received

- [
-   12,
-   128.57142,
-   256,
-   128.57142,
-   "#526170",
-   1,
- ]
+ []
```

### nonlocal-return

```text
AssertionError: expected 9988 to be less than or equal to 298
```

## Builder-discovered regressions before their fixes

### Nested ordered group label room

```text
AssertionError: expected 26 to be greater than or equal to 112
```

### Reciprocal wrong-axis return

```text
AssertionError: expected -390 to be greater than or equal to -218.000001
```
