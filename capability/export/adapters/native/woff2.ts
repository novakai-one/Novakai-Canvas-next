import { decompress } from 'wawoff2';
/** wawoff2 returns a view into reusable native memory. Serialize and copy before the next decode starts. */
let pending: Promise<void> = Promise.resolve();
/** Shared library memory is protected across all Export compositions; callers receive detached font bytes. */
export function decompressFont(bytes: Uint8Array): Promise<Uint8Array> {
  const decoded = pending.then(async () => Uint8Array.from(await decompress(bytes)));
  pending = decoded.then(
    () => undefined,
    () => undefined,
  );
  return decoded;
}
