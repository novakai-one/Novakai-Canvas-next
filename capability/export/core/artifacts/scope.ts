import { failure } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { Snapshot, Selection, Box } from '../../contract/records/artifact.js';
import type { Scope } from '../../contract/records/input.js';
import { success } from '../validation/outcomes.js';
/** Select supplied global bounds; all nested node geometry still needs exactly one section origin. */
export function selectScope(snapshot: Snapshot, scope: Scope): Result<Selection> {
  if (scope.kind === 'all')
    return success({ sections: snapshot.scene.sections, bounds: snapshot.scene.bounds });
  const section = snapshot.scene.sections.find((item) => item.id === scope.id);
  if (!section)
    return failure(
      'missing-section',
      'scope.id',
      'Requested section does not exist in this revision',
    );
  return success({ sections: [section], bounds: section.box });
}
/** Reject invalid allocations before native work; negative origins are valid. */
export function validBounds(box: Box): boolean {
  return (
    [box.x, box.y, box.width, box.height].every(Number.isFinite) &&
    Math.min(box.width, box.height) > 0
  );
}
