import { z } from 'zod';
import type { Request, Snapshot } from '@novakai/canvas-authoring';
import type { Command } from './command.js';
import type { ResourceRequest } from '@novakai/canvas-language';
export type { ResourceRequest } from '@novakai/canvas-language';
import type { Result } from '../errors.js';
/** Normalized byte copies belong to local retry retention, never canonical workspace records. */
export const byteBackup = z.strictObject({
  digest: z.string().regex(/^[a-f0-9]{64}$/),
  base64: z.string(),
});
export type ByteBackup = z.infer<typeof byteBackup>;
/** Filesystem reads are confined to the DSL or theme source directory. */
export interface ResourceFiles {
  read(file: string, request: ResourceRequest): Promise<Result<LocalInput>>;
}
export interface LocalInput {
  readonly alias: string;
  readonly digest: string | null;
  readonly stage: unknown;
}
/** Preset inputs use semantic sources and exact owner-prepared identities, never JSON coordinates. */
export interface PresetInputs {
  source(
    command: Command,
    source: string,
  ): Result<{ readonly admission: unknown; readonly resources: readonly ResourceRequest[] }>;
  request(
    input: unknown,
    snapshot: Snapshot,
    id: string,
    assets: readonly { readonly alias: string; readonly digest: string }[],
  ): Result<Request>;
  expansion(pin: string, namespace: string): Result<unknown>;
}
export interface ResourceSyntax {
  requests(source: string): Result<readonly ResourceRequest[]>;
}
