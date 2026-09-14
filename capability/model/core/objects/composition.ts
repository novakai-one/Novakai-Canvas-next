import type { Collection } from '../../contract/records/collection.js';
import type { DiagramObject } from '../../contract/records/object.js';
import type { Appearance, Section } from '../../contract/records/section.js';
import type { ContentBlock } from '../../contract/records/content.js';
import type { Diagnostic } from '../../contract/errors.js';
import { diagnoseWhen } from '../invariants/issues.js';

/** Media eligibility follows the content that a view actually exposes, not hidden canonical blocks. */
function visibleBlocks(
  object: DiagramObject,
  detail: Appearance['detail'],
): readonly ContentBlock[] {
  if (detail === 'label') return [];
  if (detail === 'summary') return object.content.slice(0, 1);
  return object.content;
}

/** Both admitted image families and parametric figures can lead a composition; other blocks cannot stand in for media. */
function isMedia(block: ContentBlock): boolean {
  return block.kind === 'image' || block.kind === 'icon' || block.kind === 'figure';
}

/** Ordinary stacks need no figure. A media-led intent must have a visible figure to arrange. */
function requireMedia(
  composition: DiagramObject['composition'],
  blocks: readonly ContentBlock[],
  path: string,
): readonly Diagnostic[] {
  if (composition === 'stack') return [];
  return diagnoseWhen(
    !blocks.some(isMedia),
    'content',
    path,
    'Media-led composition requires a visible image, icon or figure; use stack when hiding media',
  );
}

/** Reference validation owns missing objects; this rule owns resolved presentation intent only. */
function validateAppearance(
  appearance: Appearance,
  section: Section,
  collection: Collection,
): readonly Diagnostic[] {
  const object = collection.objects.find((item) => item.id === appearance.object);
  if (object === undefined) return [];
  return requireMedia(
    appearance.composition ?? object.composition,
    visibleBlocks(object, appearance.detail),
    `sections.${section.id}.appearances.${object.id}.composition`,
  );
}

/** Group colours must belong to the admitted theme, exactly like ordinary object roles. */
function validateGroupRoles(section: Section, collection: Collection): readonly Diagnostic[] {
  return section.groups.flatMap((group) =>
    diagnoseWhen(
      !collection.theme.roles.includes(group.role),
      'content',
      `sections.${section.id}.groups.${group.id}.role`,
      'Group role must be declared by the collection theme',
    ),
  );
}

/** Validate source and view composition without mutation. Model returns diagnostics; Authoring retains the prior commit. */
export function validateComposition(collection: Collection): readonly Diagnostic[] {
  return [
    ...collection.objects.flatMap((object) =>
      requireMedia(object.composition, object.content, `objects.${object.id}.composition`),
    ),
    ...collection.sections.flatMap((section) =>
      section.appearances.flatMap((appearance) =>
        validateAppearance(appearance, section, collection),
      ),
    ),
    ...collection.sections.flatMap((section) => validateGroupRoles(section, collection)),
  ];
}
