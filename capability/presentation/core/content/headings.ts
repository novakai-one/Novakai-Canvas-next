import type { ChangeEntry, DiagramObject } from '../../contract/records/input.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { ContentContext } from '../../contract/records/content-context.js';
import { moduleChrome } from './chrome.js';
import { labelContent, stack } from './text.js';
import { changeBadge } from '../notation/annotations.js';
/** Kind labels express domain identity independently of chosen frame, role or media composition. */
const engineeringKinds: Readonly<Partial<Record<DiagramObject['kind'], string>>> = {
  entity: 'ENTITY',
  interface: 'INTERFACE',
  function: 'FUNCTION',
};
/** Measure kind and title together so body separators and member anchors start below both. Public project owns failure; Authoring retains the prior scene. */
export function nodeHeading(object: DiagramObject, context: ContentContext): MeasuredContent {
  const title = labelContent(displayHeading(object), context, 'nodeHeading');
  const parts = [...changeParts(object, context), ...kindParts(object, context), title];
  if (parts.length === 1) return title;
  return stack(parts, context.style.gap / 2);
}

function kindParts(object: DiagramObject, context: ContentContext): readonly MeasuredContent[] {
  const kind = kindLabel(object, context);
  if (kind === undefined) return [];
  return [labelContent(kind, context, 'annotation')];
}

/** Only a whole-object change entry badges the heading; member entries render nothing yet. */
function changeParts(object: DiagramObject, context: ContentContext): readonly MeasuredContent[] {
  const entry = context.collection.changes
    .flatMap((block) => block.entries)
    .find((candidate) => isWholeObject(candidate.target, object.id));
  if (entry === undefined) return [];
  return [changeBadge(entry.status, context)];
}

function isWholeObject(target: ChangeEntry['target'], objectId: DiagramObject['id']): boolean {
  return target.kind === 'object' && target.object === objectId && target.member === undefined;
}

/** Module filenames keep their canonical identity while the display heading drops terminal TypeScript noise. */
function displayHeading(object: DiagramObject): string {
  if (object.kind !== 'module') return object.label;
  return object.label.endsWith('.ts') ? object.label.slice(0, -3) : object.label;
}

/** Chrome policy controls the kicker before measurement, preserving accurate header bounds. */
function kindLabel(
  object: DiagramObject,
  context: ContentContext,
): DiagramObject['label'] | undefined {
  if (moduleChrome(object, context)?.showKind === false) return undefined;
  return engineeringKinds[object.kind];
}
