import type { SessionDependencies, WorkspaceSession } from './types.js';
import { failure } from './errors.js';
import { renderCollection } from '../core/rendering/collection.js';
export { createAdmission as createHttpAdmission } from '../core/transport/admission.js';
export { readCommand } from '../core/transport/command.js';
/** Bind a persistent workspace to read, mutation and render consumers; HTTP owns authentication and caller identity. */
export function createWorkspaceSession(dependencies: SessionDependencies): WorkspaceSession {
  const lifetime = dependencies.lifetime;
  return {
    workspace: dependencies.workspace,
    installation: dependencies.installation,
    read: () =>
      lifetime.run(
        () => dependencies.authoring(dependencies.readSignal).read(dependencies.workspace),
        dependencies.unavailable,
      ),
    prepare: (request, signal, preview = false) =>
      lifetime.run(
        () => dependencies.authoring(signal).prepare(request, preview),
        dependencies.unavailable,
      ),
    apply: (request, signal, options = {}) =>
      lifetime.run(
        () => dependencies.authoring(signal).apply(request, options),
        dependencies.unavailable,
      ),
    receipt: (request) =>
      lifetime.run(
        () =>
          dependencies.authoring(dependencies.readSignal).receipt(dependencies.workspace, request),
        dependencies.unavailable,
      ),
    render: (id, signal) =>
      lifetime.run(
        () => renderCollection(id, signal, dependencies),
        () => failure('unavailable', 'session', 'Workspace is closing or closed'),
      ),
    subscribe: (listener) => dependencies.changes.subscribe(listener),
    close: () => lifetime.close(),
  };
}

export { projectCollection } from '../core/workspace/projection.js';
