/** Prepared singleton storage driver. Only trusted adapter code supplies SQL transaction commands. */
export interface DatabasePort {
  exec(sql: string): void;
  read(): unknown;
  write(serialized: string): void;
  close(): void;
}
