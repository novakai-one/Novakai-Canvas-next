# Final integrated verification

Commit under test:8cc1890 plus documentation/DSL-only changes. `pnpm check` passed: TypeScript, ESLint (Sonar<=2), Prettier, dependency-cruiser,177tests/52files. Test execution15.23s. Web build passed. No E2E suite added. Full transient stdout retained locally at `/tmp/canvas-agent-diagrams/pr6-integrated-final-check.log`; command exit0 independently observed. Routing alignment had its own177/52 pass14.63s; no further external audit.

The two rejected root DSL attempts (unsupported state/grid composition and unqualified group targets) left the collection at revision3. Correct explicit `rank group:@authoring group:@publication` under the existing state/layered mode committed revision4. No invariant was weakened and no JSON coordinates were authored.
