import { buildSpecProfile, scaffoldBuildSpec } from '../profiles/build-spec.js';
import { lintBuildSpec } from '../profiles/lint.js';
import type { Command } from '../../contract/records/command.js';
import type { SemanticInputs } from '../../contract/ports/runtime.js';
import type { RequestFiles } from '../../contract/ports/runtime.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import type { ProfileFinding } from '../../contract/records/profiles.js';

export interface ProfileDependencies {
  readonly files: Pick<RequestFiles, 'source' | 'output'>;
  readonly semantic: Pick<SemanticInputs, 'profileParse'>;
}

function profileError(target: string): Result<string> {
  return failure('unknown-profile', `Unknown profile: ${target}`, 'Use build-spec@1.');
}

function validText(value: string | undefined, label: string): Result<string> {
  if (value === undefined || value.trim() === '')
    return failure('invalid-arguments', `Scaffold requires --${label}.`);
  return { ok: true, value };
}

function findingLine(finding: ProfileFinding): string {
  return `PROFILE ${finding.path} ${finding.span.start.line}:${finding.span.start.column} ${finding.message}`;
}

function displayDescriptor(): string {
  return [
    `${buildSpecProfile.id} — ${buildSpecProfile.description}`,
    '',
    'Commands:',
    ...Object.values(buildSpecProfile.commands).map((command) => `  ${command}`),
    '',
    'Required logical documents:',
    ...buildSpecProfile.slots.map(
      (slot) => `  ${slot.order}. ${slot.id} (${slot.modes.join('|')}) — ${slot.description}`,
    ),
    `  5.N appendix (${buildSpecProfile.appendix.modes.join('|')}) — ${buildSpecProfile.appendix.description}`,
    '',
    'Structural conventions:',
    ...buildSpecProfile.conventions.map((convention) => `  ${convention}`),
    '',
    ...buildSpecProfile.notes.map((note) => `Note: ${note}`),
  ].join('\n');
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- local profile commands share one strict, side-effect-bounded dispatch boundary.
export async function executeProfile(
  command: Command,
  dependencies: ProfileDependencies,
): Promise<Result<string>> {
  if (command.name === 'profile-describe') {
    if (command.target !== buildSpecProfile.id) return profileError(command.target);
    return { ok: true, value: displayDescriptor() };
  }
  if (command.name === 'profile-scaffold') {
    if (command.target !== buildSpecProfile.id) return profileError(command.target);
    const id = validText(command.preset?.id, 'id');
    if (!id.ok) return id;
    const title = validText(command.preset?.title, 'title');
    if (!title.ok) return title;
    if (!/^[-a-zA-Z0-9_]+$/.test(id.value))
      return failure('invalid-arguments', 'Scaffold --id must be a simple collection ID.');
    const source = scaffoldBuildSpec(id.value, title.value);
    if (command.output === null) return { ok: true, value: source };
    const saved = await dependencies.files.output(command.output, source);
    if (!saved.ok) return saved;
    return { ok: true, value: `Written: ${command.output}` };
  }
  if (command.name === 'profile-lint') {
    if (command.profile !== buildSpecProfile.id) return profileError(command.profile ?? 'missing');
    const source = await dependencies.files.source(command.target);
    if (!source.ok) return source;
    const parsed = dependencies.semantic.profileParse(source.value);
    if (!parsed.ok) return parsed;
    const result = lintBuildSpec(parsed.value);
    if (!result.valid) {
      return failure(
        'profile-structure',
        `${result.summary}\n${result.findings.map(findingLine).join('\n')}`,
        'Fix the reported structural findings and rerun profile lint.',
      );
    }
    return { ok: true, value: result.summary };
  }
  return failure('invalid-command', `Unsupported profile command: ${command.name}`);
}

export function isProfileCommand(command: Command): boolean {
  return (
    command.name === 'profile-describe' ||
    command.name === 'profile-scaffold' ||
    command.name === 'profile-lint'
  );
}
