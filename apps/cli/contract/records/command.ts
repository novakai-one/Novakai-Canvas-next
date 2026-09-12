import { z } from 'zod';
/** Replacement and patch commands require an explicit read revision; omission cannot become a blind latest-version overwrite. */
export const commandName = z.enum([
  'help',
  'describe',
  'list',
  'read',
  'create',
  'replace',
  'patch',
  'preview',
  'receipt',
  'retry',
  'apply',
]);
export type CommandName = z.infer<typeof commandName>;
export interface Command {
  readonly name: CommandName;
  readonly target: string;
  readonly revision: number | null;
  readonly mode: 'create' | 'replace' | 'patch';
  readonly request: string | null;
  readonly output: string | null;
}
export interface CliOptions {
  readonly command: Command;
  readonly server: string;
  readonly workspaceDirectory: string;
}
