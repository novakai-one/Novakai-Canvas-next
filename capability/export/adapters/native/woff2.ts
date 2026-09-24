/*
 * WOFF2 font decompression through `wawoff2`. The library returns a view into native memory
 * that its next call reuses, so calls are run one at a time and each result is copied before
 * the next call starts.
 */
import { decompress } from 'wawoff2';

/**
 * The most recent decompression, settled either way. Each new call waits for it. Shared by
 * every Export composition in the process, because the library's memory is shared too.
 */
let pending: Promise<void> = Promise.resolve();

/**
 * Decompresses a WOFF2 font into sfnt (TrueType/OpenType) bytes. Calls run one after another
 * in call order, across all Export compositions; one call's failure does not affect the next.
 *
 * @param bytes - WOFF2 font bytes.
 * @returns A promise of a detached copy of the decompressed bytes. It rejects with the
 * library's plain `Error` ("ConvertWOFF2ToTTF failed") when the bytes cannot be converted.
 * @throws Never synchronously; failures are rejections.
 */
export function decompressFont(bytes: Uint8Array): Promise<Uint8Array> {
  const decoded = pending.then(async () => Uint8Array.from(await decompress(bytes)));
  pending = decoded.then(
    () => undefined,
    () => undefined,
  );
  return decoded;
}
