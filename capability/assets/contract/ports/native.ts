import type { Digest } from '../brands.js';
/** Native driver detail is confined to composition/adapters; core only sees AssetStorage. */
export interface AssetDatabase {
  exec(sql: string): void;
  prepare(sql: string): AssetStatement;
  close(): void;
}
export interface AssetStatement {
  get(...values: readonly string[]): Readonly<Record<string, unknown>> | undefined;
  all(...values: readonly string[]): readonly Readonly<Record<string, unknown>>[];
  run(...values: readonly string[]): unknown;
}
/** Immutable physical file seam; adapter transactions own typed exception recovery. */
export interface BlobFiles {
  read(digest: Digest): string | null;
  write(digest: Digest, base64: string): void;
  remove(digest: Digest): void;
  list(): readonly Digest[];
}
