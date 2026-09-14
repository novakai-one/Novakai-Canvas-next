import { parseArgs } from 'node:util';
import { commandName } from '../contract/records/command.js';
import type { CliOptions, Command } from '../contract/records/command.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
import { z } from 'zod';
const mode = z.enum(['create', 'replace', 'patch']);
const revision = z
  .string()
  .regex(/^[0-9]+$/)
  .transform(Number)
  .pipe(z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER));
/** Flags are parsed by Node; unknown flags, extra operands and malformed revision values fail before any file/network I/O. */
export function readArguments(
  args: readonly string[],
  defaultWorkspace: string,
): Result<CliOptions> {
  try {
    const parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      options: {
        help: { type: 'boolean', short: 'h' },
        server: { type: 'string', default: 'http://127.0.0.1:5174' },
        workspace: { type: 'string', default: defaultWorkspace },
        revision: { type: 'string' },
        mode: { type: 'string', default: 'create' },
        request: { type: 'string' },
        out: { type: 'string' },
        id: { type: 'string' },
        version: { type: 'string' },
        family: { type: 'string' },
        title: { type: 'string' },
        namespace: { type: 'string' },
      },
    });
    const command = readCommand(commandOperands(parsed.values.help, parsed.positionals), {
      ...parsed.values,
      preset: Object.fromEntries(
        Object.entries({
          id: parsed.values.id,
          version: parsed.values.version,
          family: parsed.values.family,
          title: parsed.values.title,
          namespace: parsed.values.namespace,
        }).filter(([, value]) => value !== undefined),
      ),
    });
    if (!command.ok) return command;
    return {
      ok: true,
      value: {
        command: command.value,
        server: parsed.values.server,
        workspaceDirectory: parsed.values.workspace,
      },
    };
  } catch {
    return failure(
      'invalid-arguments',
      'Unknown or malformed CLI flag',
      'Use canvas describe | list | read ID | create FILE | patch FILE --revision N | preview FILE.',
    );
  }
}
/** Preserve command intent explicitly; a preview's mode is independent of whether a source parses as a full document or patch. */
function readCommand(
  positionals: readonly string[],
  flags: {
    readonly preset?: Command['preset'];
    readonly revision?: string;
    readonly mode: string;
    readonly request?: string;
    readonly out?: string;
  },
): Result<Command> {
  const parsed = commandName.safeParse(positionals[0]);
  if (!parsed.success)
    return failure(
      'invalid-command',
      'Choose describe, list, read, inspect, create, replace, patch, preview, receipt, retry or apply',
    );
  return operands(parsed.data, positionals, flags);
}
/** Operands cannot be silently ignored: commands accept exactly the arguments shown in their help vocabulary. */
function operands(
  name: Command['name'],
  positionals: readonly string[],
  flags: {
    readonly preset?: Command['preset'];
    readonly revision?: string;
    readonly mode: string;
    readonly request?: string;
    readonly out?: string;
  },
): Result<Command> {
  const count = ['help', 'describe', 'list'].includes(name) ? 1 : 2;
  if (positionals.length !== count)
    return failure('invalid-arguments', `${name} requires ${count - 1} operand(s)`);
  return fields(name, positionals[1] ?? '', flags);
}
/** Value validation returns named input errors instead of allowing NaN or negative revisions into preconditions. */
function fields(
  name: Command['name'],
  target: string,
  flags: {
    readonly preset?: Command['preset'];
    readonly revision?: string;
    readonly mode: string;
    readonly request?: string;
    readonly out?: string;
  },
): Result<Command> {
  const selected = ['create', 'replace', 'patch'].includes(name) ? name : flags.mode;
  const checked = mode.safeParse(selected);
  if (!checked.success) return failure('invalid-mode', 'Mode must be create, replace or patch');
  return versioned(
    {
      name,
      target,
      mode: checked.data,
      request: flags.request ?? null,
      output: flags.out ?? null,
      preset: flags.preset,
    },
    flags.revision,
  );
}
/** A revision is optional for read/create commands; semantic admission makes it mandatory for existing diagram changes. */
function versioned(command: Omit<Command, 'revision'>, input: string | undefined): Result<Command> {
  if (input === undefined) return { ok: true, value: { ...command, revision: null } };
  const checked = revision.safeParse(input);
  if (!checked.success)
    return failure('invalid-revision', 'Revision must be a non-negative safe integer');
  return { ok: true, value: { ...command, revision: checked.data } };
}

/** Help is a local command and never needs a running workspace. */
function commandOperands(
  help: boolean | undefined,
  positionals: readonly string[],
): readonly string[] {
  if (help) return ['help'];
  if (['theme', 'recipe'].includes(positionals[0] ?? ''))
    return [`${positionals[0]}-${positionals[1]}`, ...positionals.slice(2)];
  return positionals;
}
