import { z } from 'zod';
/** Storage-compatible identities; requests reserve space for generated history prefixes. */
const identifier = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/);
export const workspaceId = identifier.brand<'AuthoringWorkspaceId'>();
export const recordId = identifier.brand<'AuthoringRecordId'>();
export const requestId = identifier.max(120).brand<'AuthoringRequestId'>();
export const actorId = identifier.brand<'ActorId'>();
export const plannerId = identifier.brand<'PlannerId'>();
export const digest = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .brand<'AuthoringDigest'>();
export const timestamp = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
  .brand<'Timestamp'>();
export type WorkspaceId = z.infer<typeof workspaceId>;
export type RecordId = z.infer<typeof recordId>;
export type RequestId = z.infer<typeof requestId>;
export type ActorId = z.infer<typeof actorId>;
export type PlannerId = z.infer<typeof plannerId>;
export type Digest = z.infer<typeof digest>;
export type Timestamp = z.infer<typeof timestamp>;
