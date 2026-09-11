import { expect } from 'vitest';
import { workspaceId, recordId, requestId, digest } from '../contract/index.js';
import type { Result, CommitRequest, RecordKey, WorkspaceState } from '../contract/index.js';
export const workspace = workspaceId.parse('workspace');
export const collection: RecordKey = { kind: 'collection', id: recordId.parse('diagram') };
export const history: RecordKey = { kind: 'history', id: recordId.parse('transaction') };
export const abcDigest = digest.parse(
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
);
/** Vitest owns assertion failures; every success fixture unwrap asserts rather than silently defaulting. */
export function value<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
/** Known failure code is asserted independently of implementation message wording. */
export function rejects(result: Result<unknown>, code: string): void {
  expect(result).toMatchObject({ ok: false, error: { code } });
}
/** Independent initial storage envelope, also used to expose malformed raw-driver state. */
export function pristine(): WorkspaceState {
  return { schemaVersion: 1, workspace, sequence: 0, slots: [], receipts: [] };
}
/** Single new diagram, with explicit never-seen precondition and a stable submitted fingerprint. */
export function request(id = 'request-one'): CommitRequest {
  return {
    workspace,
    request: requestId.parse(id),
    fingerprint: digest.parse('a'.repeat(64)),
    expected: [{ key: collection, version: 'absent' }],
    writes: [{ kind: 'put', key: collection, value: { title: 'Diagram' }, resources: [] }],
    outcome: { status: 'applied' },
  };
}
