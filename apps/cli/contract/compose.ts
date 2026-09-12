import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { readAgentCredential } from '@novakai/canvas-service';
import { createLanguage } from '@novakai/canvas-language';
import { validate, plan, stage } from '@novakai/canvas-model';
import { readArguments } from '../adapters/arguments.js';
import { createPresetInputs } from '../adapters/preset-inputs.js';
import { readThemeConfig } from '../adapters/theme-config.js';
import { createResourceFiles } from '../adapters/resource-inputs.js';
import { createRequestFiles } from '../adapters/files.js';
import { createTransport } from '../adapters/transport.js';
import { createSemanticInputs } from '../adapters/semantic-inputs.js';
import { executeCommand, usage } from './api.js';
import type { Result } from './errors.js';
import { failure } from './errors.js';
/** Bind the actual CLI to protected credentials and real HTTP; failed setup cannot submit a diagram mutation. */
export async function runCli(
  args: readonly string[],
  defaultWorkspace: string,
): Promise<Result<string>> {
  try {
    const parsed = readArguments(args, defaultWorkspace);
    if (!parsed.ok) return parsed;
    return dispatch(parsed.value);
  } catch {
    return failure(
      'cli-unavailable',
      'CLI could not complete',
      'Retain the request ID and inspect its receipt before retrying.',
    );
  }
}
/** One owner-composed Language parser drives scope discovery; there is no second DSL implementation in the CLI. */
async function run(options: import('./records/command.js').CliOptions): Promise<Result<string>> {
  const credential = await readAgentCredential(
    resolve(options.workspaceDirectory, 'agent-credential.json'),
  );
  if (!credential.ok) return credential;
  const transport = createTransport(options.server, credential.value);
  if (!transport.ok) return transport;
  const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
  const semantic = createSemanticInputs(language);
  return executeCommand(options.command, {
    transport: transport.value,
    resourceFiles: createResourceFiles(),
    files: createRequestFiles(resolve(options.workspaceDirectory, 'requests')),
    semantic,
    presets: createPresetInputs(semantic, readThemeConfig),
    nextRequestId: randomUUID,
  });
}

/** Local help needs no infrastructure; authoring commands bind their real runtime before executing. */
function dispatch(options: import('./records/command.js').CliOptions): Promise<Result<string>> {
  if (options.command.name === 'help') return Promise.resolve({ ok: true, value: usage });
  return run(options);
}
