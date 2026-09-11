# Layout dependency selection

|Choice|Evidence / purpose|
|---|---|
|ELK0.12.0|[Official project](https://github.com/kieler/elkjs), [layered documentation](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html). Seed directed/tree placement; hard-constraint feasibility remains independently checked.|
|@lume/kiwi0.4.4|[Maintained successor](https://github.com/lume/kiwi) to archived kiwi.js. Solves owned linear equations; no claim of released Wasm build.|
|libavoid-js0.5.0-beta.5|[Official package](https://github.com/Aksem/libavoid-js). Actual shipped Wasm probed for obstacle routing; separate artifact and licenses retained.|

Native probes: ELK placed100×60 nodes at(12,12)/(132,12); solver x=10,y>=x+30 yielded10/40; Wasm routed(0,0)→(120,0) around obstacle[40,-20,40,40] via y=-20. Final adapter adds requested clearance and independently checks results.

Shipped libavoid declarations are stale: root numeric OrthogonalRouting/destroy do not match runtime embind RouterFlag.OrthogonalRouting.value and per-handle.delete. Package types export also points to a missing file. Adapter must declare/check the narrow native ABI at its boundary; never leak native any into capability contracts. ELK bundled default uses an internal non-worker implementation whose terminateWorker throws; host-owned real workers own termination, while default per-call inline instance has no background worker to terminate. No production adapter may blindly rely on either stale declaration.

A pnpm patch adds `code: UNSATISFIABLE_CONSTRAINT` to the two genuine contradiction throws in @lume/kiwi's source and compiled solver. No algorithm changes. The adapter classifies that code only; other insertion errors remain engine-failed. This avoids message parsing and false infeasibility diagnoses. Patch/lockfile pin accompanies BSD notice.

The libavoid-js0.5.0-beta.5 package exports pointed at a nonexistent declaration file and exposed stale native types. A recorded pnpm patch supplies only the verified AvoidLib.load/getInstance loader declarations (unknown native result), with the types export selected before runtime node/default paths. Native geometry/ABI remains runtime-checked in the adapter; Wasm/JS algorithms are unchanged. The earlier Kiwi patch only gives existing unsatisfiable-constraint throws a stable code.
