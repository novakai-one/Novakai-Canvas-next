# Parent verification of A2

Before correction: `A2_SCENARIO=panel-reopen pnpm exec vitest run capability/design-system/tests/panels.test.tsx --config /tmp/design-system-a2-probes/vitest.config.mjs --reporter=verbose` passed2 cases while instrumentation showed oldConnected=false, oldValue=Unsaved, liveValue=content.

After correction: same mutant failedcase12 at `expect(reopenedDraft).toBe(draft)`; case13 passed. This is the expected negative result. The unchanged real PanelSectionBody remains mounted and passes the strengthened assertion.

Temporary transform operates only in memory, outside repository code. No audit repeated. Source change limited to the existing assertion; Button CSS formatting separately addresses A1's minor readability observation.
