import type { Digest } from '../brands.js';

/**
 * The SQLite database the storage adapter uses (a subset of `node:sqlite`'s `DatabaseSync`). Only
 * the composition root and the adapters see it; core sees only `AssetStorage`. Its methods throw
 * native errors, which the storage adapter turns into failures.
 */
export interface AssetDatabase {
  /** Runs one or more SQL statements. */
  exec(sql: string): void;
  /** Prepares one SQL statement. */
  prepare(sql: string): AssetStatement;
  /** Closes the database. */
  close(): void;
}

/** A prepared SQL statement with string parameters. */
export interface AssetStatement {
  /** Runs the statement and returns its first row, or `undefined` when there is none. */
  get(...values: readonly string[]): Readonly<Record<string, unknown>> | undefined;
  /** Runs the statement and returns every row. */
  all(...values: readonly string[]): readonly Readonly<Record<string, unknown>>[];
  /** Runs the statement for its effect. */
  run(...values: readonly string[]): unknown;
}

/**
 * The content-addressed blob files: one immutable file per digest. The storage adapter catches
 * what these methods throw (native errors, or a `StorageFault` carrying a failure code).
 */
export interface BlobFiles {
  /** Reads a digest's bytes as base64, or `null` when the file does not exist. */
  read(digest: Digest): string | null;
  /** Writes a digest's bytes. Existing different bytes at the digest are refused. */
  write(digest: Digest, base64: string): void;
  /** Removes a digest's file. Removing a missing file is not an error. */
  remove(digest: Digest): void;
  /** Lists the digests that have files. */
  list(): readonly Digest[];
}
