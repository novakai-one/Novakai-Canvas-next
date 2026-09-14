import { z } from 'zod';
import { digest } from '../brands.js';
import type { Digest } from '../brands.js';
import { diagnosticSchema } from '../errors.js';
import type { Diagnostic } from '../errors.js';
import { writeSchema, versionSchema, jsonSchema } from './storage.js';
import type { Write, ReadVersion, Json, Snapshot } from './storage.js';
/** Planners return bounded data, never callbacks that bypass final validation. Pins originate in admission. */
export const proposalSchema = z.strictObject({
  writes: z.array(writeSchema).max(1000),
  reads: z.array(versionSchema).max(10000),
  diff: jsonSchema,
  warnings: z.array(diagnosticSchema),
});
export const feasibilitySchema = z.strictObject({
  warnings: z.array(diagnosticSchema),
  diff: jsonSchema,
  preview: jsonSchema,
});
export const leaseDataSchema = z.strictObject({
  pins: jsonSchema,
  reads: z.array(versionSchema).max(10000),
  covered: z.array(digest),
});
export interface Proposal {
  readonly writes: readonly Write[];
  readonly reads: readonly ReadVersion[];
  readonly diff: Json;
  readonly warnings: readonly Diagnostic[];
}
export interface FeasibilityReport {
  readonly warnings: readonly Diagnostic[];
  readonly diff: Json;
  readonly preview: Json;
}
export interface Preparation {
  readonly fingerprint: Digest;
  readonly candidateHash: Digest;
  readonly reads: readonly ReadVersion[];
  readonly changes: readonly Write[];
  readonly diff: Json;
  readonly warnings: readonly Diagnostic[];
  readonly pins: Json;
  readonly preview: Json;
}
/** Private commit-ready state also retains the immutable source for atomic history construction. */
export interface PreparedCandidate {
  readonly preparation: Preparation;
  readonly before: Snapshot;
  readonly after: Snapshot;
}
