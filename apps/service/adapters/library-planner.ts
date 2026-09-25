import { planCatalog } from '@novakai/canvas-library';
import { failure, plannerId, proposalSchema } from '@novakai/canvas-authoring';
import type { IntentPlanner, Request, Snapshot, Proposal, Result } from '@novakai/canvas-authoring';
import { libraryCommand } from '../contract/records/commands.js';
import type { WorkspaceReader } from '../contract/records/workspace.js';
/** Organization commands are interpreted only by Library; the host cannot write an arbitrary catalog payload. */
function propose(
  request: Request,
  snapshot: Snapshot,
  workspace: WorkspaceReader,
): Result<Proposal> {
  if (request.intent.kind !== 'change')
    return failure('invalid-input', 'intent', 'Expected a library change');
  const command = libraryCommand.safeParse(request.intent.payload);
  if (!command.success)
    return failure('invalid-input', 'library', 'Library changes require a bounded change batch');
  return planOrganization(command.data.changes, snapshot, workspace);
}
/** The complete inventory checks membership and folder invariants before any write is proposed. */
function planOrganization(
  changes: readonly unknown[],
  snapshot: Snapshot,
  workspace: WorkspaceReader,
): Result<Proposal> {
  const current = workspace.read(snapshot);
  if (!current.ok) return current;
  const planned = planCatalog({ snapshot: current.value.library, changes });
  if (!planned.ok)
    return failure(
      'invariant-violation',
      'catalog',
      'The owning capability rejected this input',
      [],
      planned.error,
    );
  return checkedProposal(planned.value.candidate, snapshot);
}
/** Collection inventory dependencies participate in conditional admission; catalog changes never rewrite diagrams. */
function checkedProposal(
  catalog: unknown,
  snapshot: Snapshot,
): Result<Proposal> {
  const catalogs = snapshot.records.filter(
    (record) => record.key.kind === 'catalog' && !record.deleted,
  );
  const current = catalogs[0];
  if (current === undefined)
    return failure('invariant-violation', 'catalog', 'A library catalog is required');
  const parsed = proposalSchema.safeParse({
    writes: [{ kind: 'put', key: current.key, value: catalog, resources: [] }],
    reads: snapshot.records
      .filter((record) => ['collection', 'catalog'].includes(record.key.kind))
      .map((record) => ({ key: record.key, version: record.version })),
    diff: { kind: 'library-organization' },
    warnings: [],
  });
  if (!parsed.success)
    return failure('invalid-input', 'catalog', 'Library proposal could not be admitted');
  return { ok: true, value: parsed.data };
}
/** Authoring alone admits and commits the Library-owned candidate through the usual receipt/history transaction. */
export function createLibraryPlanner(workspace: WorkspaceReader): IntentPlanner {
  return {
    id: plannerId.parse('library'),
    plan: async (request, snapshot) => propose(request, snapshot, workspace),
  };
}
