/** Prepared singleton storage driver. Only trusted adapter code supplies SQL transaction commands. */
export interface DatabasePort {
  exec(sql: string): void;
  read(): unknown;
  /** Changes only when another connection commits; unchanged means the last read or write is still current. */
  version?(): unknown;
  write(serialized: string): void;
  /** Optional row-per-item storage: the main row then lists item ids, so a commit writes only new items. */
  parts?: PartsPort;
  close(): void;
}
/** Immutable item rows keyed by id; an id's body never changes once written. */
export interface PartsPort {
  get(id: string): string | undefined;
  put(id: string, body: string): void;
  remove(id: string): void;
}
