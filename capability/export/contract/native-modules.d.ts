/** The WOFF2 package exposes a bounded asynchronous buffer codec without bundled TypeScript declarations. */
declare module 'wawoff2' {
  export function decompress(bytes: Uint8Array): Promise<Uint8Array>;
}
