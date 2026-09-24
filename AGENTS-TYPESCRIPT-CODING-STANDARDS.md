# TypeScript: Junior vs Senior Patterns

Each pattern below shows the same code written two ways. The "junior" version
compiles and works — the "senior" version is the one that survives production.

---

## 1. Co-located types vs the `types.ts` dumping ground
 
**Junior** — everything in one central file:

```ts
// types.ts — 400 lines, everything imports from here
export interface User { id: string; email: string; }
export interface Cart { id: string; items: CartItem[]; }
export interface CartItem { sku: string; qty: number; }
export interface Order { id: string; total: number; }
// ... 30 more unrelated types

// cart.ts
import { Cart, CartItem } from "./types";
```

Why it hurts: every module depends on one junk-drawer file. Types drift away
from the code that owns them; renaming anything means editing a shared file
everyone touches (merge conflicts forever).

**Senior** — types live next to the code that owns them:

```ts
// cart/cart.ts
export interface Cart { id: CartId; items: CartItem[]; }
export interface CartItem { sku: string; qty: number; }

export function addItem(cart: Cart, item: CartItem): Cart { /* ... */ }

// order/order.ts
import type { Cart } from "../cart/cart"; // imports the owner's type
```

---

## 2. Boundary-first vs implementation-first

**Junior** — start writing logic, figure out the contract later:

```ts
export async function checkout(input: any) {
  const cart = await db.get(input.cartId);   // hope cartId exists
  const total = cart.items.reduce((s, i) => s + i.price, 0);
  // ...500 lines later... figure out what this returns
  return { orderId: order.id, success: true };
}
```

**Senior** — signature and shapes first, body last:

```ts
import { z } from "zod";

// Contract before implementation — reviewable and testable immediately
const CheckoutInput = z.object({
  cartId: z.string(),
  couponCode: z.string().optional(),
});
type CheckoutInput = z.infer<typeof CheckoutInput>;

type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: "card_declined" | "cart_empty" | "fraud_flag" };

export async function checkout(rawInput: unknown): Promise<CheckoutResult> {
  const parsed = CheckoutInput.safeParse(rawInput);
  if (!parsed.success) return { ok: false, reason: "cart_empty" };
  // ...implementation comes after the contract is agreed
}
```

Note: `unknown` in, discriminated union out. The UI team can build against
this signature while the implementation is still a stub.

---

## 3. Make illegal states unrepresentable

**Junior** — optional fields and hope:

```ts
interface RequestState {
  status: "idle" | "loading" | "success" | "failure";
  data?: User;      // only set when status is "success" (trust me)
  error?: Error;    // only set when status is "failure" (trust me)
}

// This compiles fine — and is nonsense:
const s: RequestState = { status: "success" }; // no data!
render(s.data.name); // runtime crash, compiler said nothing
```

**Senior** — discriminated union, impossible states don't compile:

```ts
type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "failure"; error: Error };

if (s.status === "success") {
  render(s.data.name); // data provably exists here
}
render(s.data?.name); // compile error — you forgot to check status
```

Plus exhaustiveness checking, so adding a state later flags every switch:

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

switch (s.status) {
  case "idle":    return renderIdle();
  case "loading": return renderSpinner();
  case "success": return renderUser(s.data);
  case "failure": return renderError(s.error);
  default:        return assertNever(s); // compile error if a case is missing
}
```

---

## 4. Inference where it works, annotations where they matter

**Junior** — annotate everything (noise) or nothing (chaos):

```ts
// Over-annotated: the compiler already knows all of this
const items: CartItem[] = cart.items;
const total: number = items.reduce((sum: number, i: CartItem): number => sum + i.price, 0);

// Under-annotated: exported API with accidental inferred type
export const getUser = async (id) => db.users.find(id);
```

**Senior** — annotate boundaries, infer the internals:

```ts
// Exported function: explicit parameter and return types (the public contract)
export async function getUser(id: UserId): Promise<User | null> {
  // Inside: inference does the work
  const row = await db.users.find(id);        // type inferred
  if (!row) return null;
  const email = row.email.toLowerCase();      // inferred
  return { ...row, email };
}
```

Rule of thumb: if it's `export`ed, annotate it. If it's local, let inference work.

---

## 5. Refactor through the compiler vs refactor by search-and-replace

**Junior** — renames a field, then greps for usages and hopes:

```ts
// Renamed user.name -> user.displayName with find & replace.
// Missed a spot in a template string: `Hello ${user.name}` — silent undefined.
// No compile error anywhere because the codebase is full of `any` and casts:
const u = raw as any;
u.name; // compiles regardless of reality
```

**Senior** — changes the type, follows the red squiggles:

```ts
interface User {
  id: UserId;
  displayName: string; // renamed from `name`
}

// Every file that touches `.name` is now a compile error.
// The compiler walks you to every call site. Zero guessing.
```

This only works if the codebase is `strict: true` and free of `any`/casts —
which is why seniors treat `as` casts as code smell:

```ts
// Junior: silences the compiler
const user = data as User;

// Senior: proves the shape
const user = UserSchema.parse(data);
```

---

## 6. Design for the error message

**Junior** — boolean-flag soup; misuse produces incomprehensible errors:

```ts
function createOrder(items: Item[], express: boolean, gift: boolean, dryRun: boolean) {}

createOrder(cart, true, false, true); // what do these mean?
createOrder(cart, true, true, true);  // nonsense combo — compiles fine
```

**Senior** — options object with a union; misuse fails *readably*:

```ts
type OrderOptions = {
  items: Item[];
  fulfillment:
    | { kind: "express"; address: Address }
    | { kind: "standard" };
  giftWrap?: boolean;
};

function createOrder(opts: OrderOptions) {}

createOrder({ items: cart, fulfillment: { kind: "express", address } });
// Hover/autocomplete explains itself; a bad call says exactly which
// property is missing and why.
```

---

## 7. Branded types vs naked strings

**Junior** — every ID is a string, swaps are invisible:

```ts
function transfer(fromId: string, toId: string, amount: number) {}

transfer(orderId, userId, 100); // wrong order, wrong KINDS of id — compiles fine
```

**Senior** — branded primitives; wrong kind doesn't compile:

```ts
type UserId  = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

function transfer(from: UserId, to: UserId, amount: number) {}

transfer(orderId, userId, 100);
//        ^^^^^^^ compile error: OrderId is not UserId
```

---

## 8. Delete types aggressively vs accumulate abstractions

**Junior** — generic machinery for a single use case:

```ts
// Only ever instantiated once, with Entity = User:
class Repository<T extends { id: string }, TKey extends keyof T, TFilter = Partial<T>> {
  findOne(key: TKey, value: T[TKey], filter?: TFilter): Promise<T | null> { /* ... */ }
}
```

**Senior** — concrete until a second real use case appears:

```ts
class UserRepository {
  findById(id: UserId): Promise<User | null> { /* ... */ }
  findByEmail(email: string): Promise<User | null> { /* ... */ }
}
// Generalize when the SECOND entity needs it — you'll know the actual
// shape of the variation instead of guessing.
```

Same for type-level code: if a generic has one instantiation, inline it.
A type that restates what inference already knows is debt, not rigor.

---

## 9. Validate at boundaries vs trust the annotation

**Junior** — annotation as a claim:

```ts
const user: User = await fetch("/api/user").then(r => r.json());
// `r.json()` returns `any`. The `User` is a promise nobody checked.
user.email.toLowerCase(); // crashes three layers away when API changes
```

**Senior** — parse, don't validate:

```ts
const result = UserSchema.safeParse(await fetch("/api/user").then(r => r.json()));

if (!result.success) {
  logger.error("API contract broken", result.error.issues);
  // [{ path: ["email"], message: "Invalid email" }] — at the boundary,
  // with the exact field, not a crash deep in render code
  return fallbackUser;
}
const user = result.data; // genuinely a User — runtime-checked AND typed
```

---

## Summary table

| Habit | Junior | Senior |
|---|---|---|
| Type location | central `types.ts` | co-located with the owning module |
| Starting point | implementation | boundary signature + domain shapes |
| State modeling | optional fields | discriminated unions + `assertNever` |
| Annotations | all or nothing | exports annotated, internals inferred |
| Refactoring | find & replace | change the type, follow the errors |
| Casts | `as` to silence errors | `unknown` + schema to prove shapes |
| IDs | bare strings | branded types |
| Abstraction | generic upfront | concrete until the 2nd use case |
| External data | trust the annotation | Zod/Valibot at every boundary |

The meta-principle behind all of these: **design the types so wrong code
doesn't compile** — make the compiler the enforcer, not your discipline.