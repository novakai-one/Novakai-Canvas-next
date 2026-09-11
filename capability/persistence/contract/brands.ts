import { z } from 'zod';
/** Checked storage identities; Authoring owns semantic identity allocation and retry recovery. */
const identifier = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/);
export const workspaceId = identifier.brand<'WorkspaceId'>();
export const recordId = identifier.brand<'RecordId'>();
export const requestId = identifier.brand<'RequestId'>();
export const digest = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .brand<'Digest'>();
export type WorkspaceId = z.infer<typeof workspaceId>;
export type RecordId = z.infer<typeof recordId>;
export type RequestId = z.infer<typeof requestId>;
export type Digest = z.infer<typeof digest>;
