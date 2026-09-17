# Mechanism, established before the fix

Base HEAD is 94c605feb7445ed3756ee2efaa42fe84be8607e9 on feat/m9a-spotlight-fix; clean initial tree. Ten unmodified `python3 output/playwright/nested-wires/presentation/m9a/verify-spotlight.py` runs returned [1,1,0,1,0,1,1,0,1,1]: 7/10 failures, all `net membership node-1` or `node-3`. Individual base logs retain stdout/stderr.

The mechanism is premature probe sampling between separate wire and React Flow node commits, not a demonstrated cancellation defect. `RoadPrototype.tsx` computes node classes into the controlled `nodes` prop (619–623), while rendering wire classes directly. Installed @xyflow/react 12.11.6 `StoreUpdater` transfers changed nodes into its store in a passive `useEffect` (dist/esm/index.mjs:293–303). The visible node update therefore follows the wire update.

`trace-02.json` reproduces the exact failed assertion with browser-native pointer/timer/class tracing and no extra protocol round trip before reading state:

- 1950.8 ms: hub leave schedules timer 19.
- 1950.9 ms: wire enter cancels timer 19 and schedules timer 20.
- 2052.5 ms: timer 20 fires; timer 19 never fires.
- 2134.4 ms: only w01 remains highlighted among wires, but all thirteen hub-neighbour nodes are still highlighted.
- 2135.5 ms: original fixed-delay probe samples; node-3 is `spotlit`, expected `spotlightDim`.
- 2179.3 ms: node commit reduces highlighted objects to node-1, node-2, w01, with no new pointer input or timer.

This last transition both proves convergence without an app change and rules out a persistent wrong target/net leaking from a previous probe. The old state is a transient render propagation state. The initial hover check also waits for *any* spotlight class, which only proves the wire commit, not full node propagation.

Ranked predictions were: premature read (right state follows without input); stale cancellation (cancelled timer fires); pointer/state leakage (wrong target or persistent wrong net). The first prediction is observed. The specific cancelled timer does not fire, and the final net matches the requested wire. No claim is made that finite traces prove the absence of every possible scheduling defect.

The first ten diagnostic replays (`diagnosis-*.json`) inserted an extra `page.evaluate` before each net sample and passed 10/10; this perturbation gave React another opportunity to commit. The retained `diagnose.py` removes that extra round trip and records sample times inside the existing read. This measurement effect is explicitly retained, not counted as a fix or as the post-fix reliability batch.

Fix decision: change acceptance synchronization only. Poll for exact complete membership across two animation-frame samples, with bounded timeout; keep the original computed-style, membership, geometry, labels and recalc assertions. Negative hysteresis observations still need a measured observation interval; the 25 ms pointer stimulus remains deliberate. No renderer, scheduler, scene, token, export, or selection change is justified by this evidence.
