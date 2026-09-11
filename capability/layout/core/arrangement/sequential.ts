/** Run dependent work in source order with immutable accumulated state; rejection propagates to the public execute boundary. */
export async function accumulate<Item, State>(
  items: readonly Item[],
  initial: State,
  advance: (state: State, item: Item) => Promise<State>,
): Promise<State> {
  return items.reduce<Promise<State>>(
    async (previous, item) => advance(await previous, item),
    Promise.resolve(initial),
  );
}
