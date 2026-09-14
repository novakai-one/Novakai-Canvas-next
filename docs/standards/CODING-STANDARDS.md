---
date created: Sat 29 Aug, 8:59 AM
date modified: Sat 29 Aug, 9:11 AM
custom-width: 75
---
# Code Review SOP — 16 Principles

Score each principle 0–10 with evidence from the code. Never score on vibes, file size, or author confidence. A violation is a violation — record it, do not rationalize it.

**Unit of review: the target file only.** Read collaborators as evidence, but score the target's own code. A collaborator's internal flaw docks the target only when the target *propagates* it (lets untyped throws escape its return type) or *chose* the coupling (depends on a fat port). Casts/smells inside collaborators do not dock the target.

**Calibration:** 10 = zero blemishes found, dock 1 per minor blemish. Integer scores. Torn between two anchors → take the lower.

**No dedup:** one root cause may be docked on several principles — each principle is a different lens. Do not merge or excuse a dock because another row already caught it.

## 1. Where the principles come from

| Group | Principles | Origin |
|---|---|---|
| SOLID | SRP, OCP, LSP, ISP, DIP | Robert C. Martin, OO design |
| Pragmatic maxims | DRY, KISS, YAGNI | Hunt & Thomas / XP folklore |
| Contract hygiene | Typed error outcomes, idempotency & failure semantics | API design / distributed systems practice |
| Module design | Deep modules & information hiding, Law of Demeter | Ousterhout ("A Philosophy of Software Design"), Lieberherr |
| Code mechanics | Immutability, type safety, cognitive complexity | Functional practice, language tooling, SonarSource |

Automation notes per principle are in section 2; treat tool output as evidence, never as the score itself.

## 2. Scoring anchors (the 16)

**SOLID**

1. **SRP** — 10: one reason to change, obvious in one sentence. Assembling the function's own return value is part of its job, not a second responsibility. 5: two genuinely separate responsibilities shared. 0: god module.
2. **OCP** — Ask: which axes of change does this file own? For an orchestrator those axes are its *steps* and its *collaborators*. 10: both closed — new behavior arrives via injected seams. 6: collaborators swappable but adding a step requires editing the file (no step seam). 0: switch/if-else chain edited on every feature. (Cap at 6 when an owned axis lacks a seam; YAGNI does not raise the score, it only defers the fix.)
3. **LSP** — 10: every implementation of an interface passes the same contract suite. 7 (fixed): no subtyping present in the target — score exactly 7 and note "not demonstrated". 0: subtype silently narrows, throws, or ignores.
4. **ISP** — For each port the target declares, count the methods invoked anywhere in the target's flow, including by collaborators the port is passed through to — the target chose the port, so pass-through counts as its consumption. 10: flow uses ≥80% of the port's methods. 5: 30–79%. 0: <30%. Multiple ports: score each port, then combine — any port under 30% caps the row at 5; a fat port (>15 methods) under 30% caps it at 0.
5. **DIP** — 10: core depends on injected abstractions it owns; zero framework/DB imports. 9: as 10 but a dependency is a raw primitive where the domain has a branded type (e.g. `now: () => string` vs `Timestamp`). 5: abstractions exist but owned by the detail side. 0: business logic `new`s concrete infrastructure.

**Pragmatic maxims**

6. **DRY** — 10: each fact/knowledge in one place. 5: repeated idiom in 3+ places, extractable helper missing. 0: copy-pasted logic blocks. (The file's own repetition AND repetition it shares with its direct collaborators both count here — DRY is about the knowledge, not the unit.)
7. **KISS** — 10: a new reader traces the flow in one pass. 5: localized cleverness (e.g., tricky return assembly). 0: indirection without payoff.
8. **YAGNI** — 10: nothing built beyond current requirements. 5: unused options "for later". 0: speculative frameworks/abstraction layers.

**Contract hygiene**

9. **Typed error outcomes** — Judge the target's public outcome. 10: failures are typed unions/Results a consumer can switch on. 8: domain failures typed, infrastructure throws escape untyped BUT the boundary handler is named in the contract/doc (an unverifiable claim caps at 8). 5: failure kinds programmatically distinguishable (error codes/classes) but absent from the type signature. 0: kinds distinguishable only by parsing message strings. (Undocumented untyped plain-`Error` throws = 0.)
10. **Idempotency & failure semantics** — "Named" means the entry point's doc comment or return type identifies the recovery path. 10: retries safe by construction AND crash recovery owner named. 8: retries safe, recovery exists elsewhere but unnamed. 5: crash gaps undocumented. 0: retry = duplicate effect.

**Module design**

11. **Deep module / information hiding** — 10: small contract, rich hidden behavior; deleting it pushes complexity into callers. 5: real hiding but thin behavior. 0: pass-through wrapper.
12. **Law of Demeter** — Reading fields off data records returned by your direct collaborators is NOT a violation. 10: only direct collaborators, no chained calls. 5: occasional call chains through returned objects (`a.getB().getC()`). 0: chains that mutate or navigate another module's internals.

**Code mechanics**

13. **Immutability** — 10: readonly/const everywhere, updates via copy. 5: rare local mutation. 0: shared mutable state across calls.
14. **Type safety** — Only the target's own `as` casts and `any` count. Unbranded dependency types are scored under DIP (5), not here. 10: no `any`, no unchecked `as`. 5: casts confined to edges. 0: `any` in the contract.
15. **Cognitive complexity** — A "named idiom" is a construct the SOP's snippets call out (e.g. spread-ternary). 10: none present. 9: one instance. 7: two or more instances in one function, or one instance in the return statement. 5: nested ternaries. 0: reader must simulate the machine. (Gate: sonarjs cognitive-complexity ≤ 15.)
16. **Testability** — 10: all deps injected, no ambient clock/env/fs, fakes suffice. 5: injectable but with ambient reads. 0: needs real infrastructure to test.

## 3. Bad / good reference snippets

**1. SRP**
```ts
// ❌ class UserService { createUser(); hashPassword(); sendWelcomeEmail(); }
// ✅ class UserService { createUser(); }           // hashing → Passwords
```

**2. OCP**
```ts
// ❌ if (tier === "gold") d = .1; else if (tier === "silver") d = .05;
// ✅ interface Discount { rate(): number }  // new tier = new class
```

**3. LSP**
```ts
// ❌ class Square extends Rect { setWidth(w) { this.w = this.h = w } }
// ✅ interface Shape { area(): number }  // no inheritance lie
```

**4. ISP**
```ts
// ❌ deps: { store: TranscriptStore }        // uses 4 of 20 methods
// ✅ deps: { sends: SendPersistence }        // narrow role interface
```

**5. DIP**
```ts
// ❌ private db = new PostgresDb();
// ✅ constructor(private readonly repo: OrderRepository) {}
```

**6. DRY**
```ts
// ❌ ...(x === undefined ? {} : { x })  // repeated in 6 places
// ✅ const defined = <K, V>(k: K, v?: V) => (v === undefined ? {} : { [k]: v });
```

**7. KISS**
```ts
// ❌ return { ...base, ...(a === undefined ? {} : { a }), ...(b === undefined ? {} : { b }) };
// ✅ return { ...base, ...defined("a", a), ...defined("b", b) };
```

**8. YAGNI**
```ts
// ❌ class PluginRegistryWithEventBus { /* one caller, one plugin */ }
// ✅ const steps = [accept, dispatch];  // add machinery when needed
```

**9. Typed error outcomes**
```ts
// ❌ throw new Error("Unknown target Agent " + id);
// ✅ return { ok: false, code: "unknown-agent", agentId: id } as const;
```

**10. Idempotency**
```ts
// ❌ await provider.send(msg); await store.record(msg);   // retry doubles
// ✅ const j = await store.acceptSend(input); if (j.state === "accepted") dispatch(j);
```

**11. Deep module**
```ts
// ❌ export const validate = ...; export const journal = ...; export const dispatch = ...
// ✅ export async function send(deps, input)  // one entry, steps hidden
```

**12. Law of Demeter**
```ts
// ❌ deps.store.getSession(id).getResumeId()   // chaining through collaborators
// ✅ const session = await store.getSession(id); session?.resumeId
```

**13. Immutability**
```ts
// ❌ journal.state = "dispatching"; journal.attempts.push(a);
// ✅ const next = { ...journal, state: "dispatching", attempts: [...journal.attempts, a] };
```

**14. Type safety**
```ts
// ❌ const id = `send_${hash}` as SendId; const t = now() as Timestamp;
// ✅ function brand<T>(s: string): T  // one checked boundary, or make now(): Timestamp
```

**15. Cognitive complexity**
```ts
// ❌ return cond ? deep ? x : y : z;                    // nested ternary
// ✅ if (!cond) return z; return deep ? x : y;          // early returns
```

**16. Testability**
```ts
// ❌ const ts = Date.now(); const cfg = process.env.X;   // ambient reads
// ✅ constructor(deps: { now: () => Timestamp; cfg: Config }) {}
```

## Review ritual

1. Read the target file, then its direct collaborators and contract — collaborators are evidence, the target is the unit.
2. Score all 16 against section 2 anchors; cite line evidence per score.
3. Report worst 3 findings with no mitigating spin.
4. Suggest fixes only if the review's owner asks for them.


## Repository amendment — approved structured outcomes (PR #24)

The original sixteen scoring anchors above are preserved. Apply the current [builder examples, section 9](../../CODING-STANDARDS.md#9-typed-error-outcomes) when judging public failure contracts. Each capability declares its own identical `Result<T,E>` union locally: success is `{ ok: true, value: T }`; failure is `{ ok: false, error: E }`. Validation errors contain non-empty typed diagnostic tuples. Consumer errors retain originating structured evidence in typed `error.source`; runtime readers validate and preserve it. No optional second error channel, message-string recovery, shared Result kernel, or raw string masquerading as a domain identity. Private typed throws remain legal behind a Result-returning public boundary. Formatting belongs at the terminal/browser display boundary.

The original snapshot hash in README.md describes the source snapshot, before this explicit repository amendment.
