import { z } from 'zod';
import type { Result } from '../errors.js';
import type { Caller, HttpAdmission, HttpMetadata } from './http.js';
import type { Request } from './owners.js';
/** A transport generation prevents a retained request from silently targeting a restarted/restored owner set. */
export const mutationEnvelope = z.strictObject({
  version: z.literal(1),
  generation: z.string().min(1).max(128),
  request: z.unknown(),
  preview: z.boolean().default(false),
  options: z.unknown().default({}),
});
export interface AdmittedMutation {
  readonly request: Request;
  readonly preview: boolean;
  readonly options: unknown;
}
export interface CommandAdmission {
  readonly caller: Caller;
  readonly metadata: HttpMetadata;
  readonly generation: string;
  readonly ingress: Pick<HttpAdmission, 'mutation'>;
}
/** Owner error codes remain stable in transport; consumers can retain richer owner-specific diagnostics. */
export type WireOutcome =
  | { readonly ok: true; readonly value: unknown }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: string;
        readonly path: string;
        readonly message: string;
        readonly recovery: string;
      };
    };
export interface ApiCall {
  readonly path: string;
  readonly query: Readonly<Record<string, string>>;
  readonly caller: Caller;
  readonly signal: AbortSignal;
  readonly metadata: HttpMetadata;
  readonly body: string;
}
export interface ApiRouter {
  invoke(call: ApiCall): Promise<WireOutcome>;
}
export interface CommandDecoder {
  read(body: string, context: CommandAdmission): Result<AdmittedMutation>;
}
/** HTTP consumers decode this envelope before handing success values to their respective capability readers. */
export const responseEnvelope = z.strictObject({
  version: z.literal(1),
  generation: z.string().min(1).max(128),
  outcome: z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value: z.unknown() }),
    z.strictObject({
      ok: z.literal(false),
      error: z.looseObject({
        code: z.string(),
        path: z.string(),
        message: z.string(),
        recovery: z.string(),
      }),
    }),
  ]),
});
export type TransportResponse = z.infer<typeof responseEnvelope>;
