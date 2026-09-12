import type {
  Appearance,
  ContentBlock,
  DiagramObject,
  Group,
  Section,
} from '../../contract/records/input.js';
import type { DiagramTypography, Paint } from '../../contract/records/style.js';
import type { MeasuredContent, VisualNode, Anchor } from '../../contract/records/visual.js';
import { sceneId } from '../../contract/brands.js';
import { visualNode } from '../../contract/records/visual.js';
import { measureBlock } from '../content/blocks.js';
import type { ContentContext } from '../content/blocks.js';
import { measureText, offset, stack } from '../content/text.js';
import { nodeShape } from '../notation/nodes.js';
import { planContent } from '../content/sizing.js';
import { fieldColumns } from '../content/fields.js';
import { parse, reject } from '../validation/outcomes.js';
/** Build a section-scoped scene identity; public project owns rejection and retains the prior scene. */
export function identity(section: string, kind: 'object' | 'group', id: string): VisualNode['id'] {
  return parse(sceneId, `${section}:${kind}:${id}`);
}
/** Measure a semantic text role; public project owns provider failure and retains the prior scene. */
export function labelContent(
  text: string,
  context: ContentContext,
  role: keyof DiagramTypography = 'body',
): MeasuredContent {
  return measureText(
    {
      text,
      width: context.width,
      ...context.style.typography[role],
      fill: context.style.text,
    },
    context.metrics,
  );
}
/** Resolve canonical content once; a broken injected domain reader fails visibly. */
function object(id: string, context: ContentContext): DiagramObject {
  const found = context.collection.objects.find((item) => item.id === id);
  if (!found) return reject('invalid-input', id, 'Visible object is missing');
  return found;
}
/** A typed port is an addressable local row, independent of the eventual routed side. */
function portContent(
  port: DiagramObject['ports'][number],
  context: ContentContext,
): MeasuredContent {
  const content = labelContent(`${port.label}: ${port.type} (${port.direction})`, context);
  return {
    ...content,
    anchors: [
      {
        member: port.id,
        x: 0,
        y: content.height / 2,
        direction: port.direction,
        collapsed: false,
        label: port.label,
      },
    ],
  };
}
interface BodySelection {
  readonly content: readonly ContentBlock[];
  readonly ports: DiagramObject['ports'];
  readonly complete: boolean;
}
/** Measure selected rows against columns derived only from those visible rows. */
function measureBody(selection: BodySelection, context: ContentContext): MeasuredContent {
  const scoped = { ...context, fields: fieldColumns(selection.content, context) };
  const blocks = [
    ...selection.content.map((block) => measureBlock(block, scoped)),
    ...selection.ports.map((port) => portContent(port, context)),
  ];
  return stack(blocks, context.style.gap);
}
/** Hidden descendants attach at the body boundary and keep their own semantic label. */
function collapsed(anchor: Anchor): Anchor {
  return { ...anchor, x: 0, y: 0, collapsed: true };
}
/** Visible summary rows retain measured row anchors; only omitted descendants collapse. */
function visibleAnchor(anchor: Anchor, visible: MeasuredContent): Anchor {
  const found = visible.anchors.find((item) => item.member === anchor.member);
  if (found) return found;
  return collapsed(anchor);
}
/** Compact detail keeps canonical outline/anchors while visible geometry stays independently measured. */
function compact(visible: MeasuredContent, canonical: MeasuredContent): MeasuredContent {
  return {
    ...visible,
    anchors: canonical.anchors.map((anchor) => visibleAnchor(anchor, visible)),
    outline: canonical.outline,
  };
}
/** Measure visible body once; compact modes retain a separate canonical accessibility path. */
function body(
  object: DiagramObject,
  selection: BodySelection,
  context: ContentContext,
): MeasuredContent {
  const visible = measureBody(selection, context);
  if (selection.complete) return visible;
  return compact(visible, measureBody(fullBody(object), context));
}
/** Parent containers are addressed in the same section scope. */
function parent(section: string, id: string | undefined): VisualNode['parent'] {
  if (id === undefined) return null;
  return identity(section, 'group', id);
}
interface NodeFrame {
  readonly content: MeasuredContent;
  readonly width: number;
  readonly height: number;
}
/** Measured minimum grows for wide glyphs/tables and leaves diamond content in its inscribed rectangle. */
function frame(
  content: MeasuredContent,
  shape: VisualNode['shape'],
  context: ContentContext,
): NodeFrame {
  const scale = shape === 'diamond' ? 2 : 1;
  const width = (Math.max(context.width, content.width) + context.style.padding * 2) * scale;
  const height = (content.height + context.style.padding * 2) * scale;
  return {
    content: offset(
      content,
      context.style.padding + ((width / scale) * (scale - 1)) / 2,
      context.style.padding + ((height / scale) * (scale - 1)) / 2,
    ),
    width,
    height,
  };
}
/** Project one appearance without committing; public project reports failure and Authoring retains the prior scene. */
export function projectNode(
  view: Appearance,
  section: Section,
  context: ContentContext,
): VisualNode {
  const source = object(view.object, context);
  const role = view.role ?? source.role;
  const size = view.size ?? source.size;
  const shape = nodeShape(source.kind);
  const initial = appearanceContext(view, role, size, shape, { ...context, owner: source });
  const visible = visibleBody(source, view.detail);
  const scoped = plannedContext(
    { ...source, content: visible.content },
    initial,
    context.style.contentSizing.widths[size],
    view.placement?.width !== undefined,
  );
  const heading = labelContent(source.label, scoped, 'nodeHeading');
  const measured = stack([heading, body(source, visible, scoped)], headingGap(shape, context));
  return parse(visualNode, {
    id: identity(section.id, 'object', source.id),
    objectId: source.id,
    groupId: null,
    sectionId: section.id,
    navigation: source.content
      .filter((block) => block.kind === 'link')
      .map((block) => ({ member: block.id, label: block.label, target: block.target })),
    kind: source.kind,
    label: source.label,
    role,
    size,
    shape,
    paint: rolePaint(role, context),
    ...frame(measured, shape, scoped),
    headerHeight: heading.height + context.style.padding * 2,
    radius: context.style.radius,
    strokeWidth: context.style.stroke,
    placement: view.placement ?? null,
    parent: parent(section.id, view.group),
  });
}
/** Engineering cards reserve a padded header compartment; body content starts below its separator. */
function headingGap(shape: VisualNode['shape'], context: ContentContext): number {
  if (['entity', 'module', 'interface', 'function'].includes(shape))
    return context.style.padding + context.style.gap;
  return context.style.gap;
}
/** Reserve represented content or an ordinary title; public project owns rejection and Authoring retains the prior scene. */
export function projectGroup(group: Group, section: Section, context: ContentContext): VisualNode {
  if (group.represents !== undefined) return represented(group, section, context);
  const initial = scopedContext(group.placement, 'neutral', 'medium', 'container', context);
  const scoped = plannedContext(
    { label: group.title, content: [] },
    initial,
    context.style.contentSizing.widths.medium,
    group.placement?.width !== undefined,
  );
  const heading = labelContent(group.title, scoped, 'nodeHeading');
  return parse(visualNode, {
    id: identity(section.id, 'group', group.id),
    objectId: null,
    groupId: group.id,
    sectionId: section.id,
    navigation: [],
    kind: 'group',
    label: group.title,
    role: 'neutral',
    size: 'medium',
    shape: 'container',
    paint: context.style.roles.neutral,
    ...frame(heading, 'container', scoped),
    headerHeight: heading.height + context.style.padding * 2,
    radius: context.style.radius,
    strokeWidth: context.style.stroke,
    placement: group.placement ?? null,
    parent: parent(section.id, group.parent),
  });
}
/** Reuse object measurement while preserving the group's distinct identity and parent scope. */
function represented(group: Group, section: Section, context: ContentContext): VisualNode {
  const source = group.represents;
  if (source === undefined)
    return reject('invalid-input', group.id, 'Represented object is missing');
  const node = projectNode(placedView(source, group.placement), section, context);
  return {
    ...node,
    id: identity(section.id, 'group', group.id),
    groupId: group.id,
    shape: 'container',
    headerHeight: node.height,
    parent: parent(section.id, group.parent),
    placement: group.placement ?? null,
  };
}

/** Role paint supplies content foreground as well as frame colours; missing roles fail at the public boundary. */
function rolePaint(role: string, context: ContentContext): Paint {
  const paint = context.style.roles[role];
  if (!paint) return reject('missing-resource', role, 'Appearance role is unavailable');
  return paint;
}
/** View overrides use the same context policy as ordinary and represented groups. */
function appearanceContext(
  view: Appearance,
  role: string,
  size: VisualNode['size'],
  shape: VisualNode['shape'],
  context: ContentContext,
): ContentContext {
  return scopedContext(view.placement, role, size, shape, context);
}
/** UI width describes outer bounds; text uses the interior after frame padding and shape inset. */
function scopedContext(
  placement: Appearance['placement'],
  role: string,
  size: 'small' | 'medium' | 'large',
  shape: VisualNode['shape'],
  context: ContentContext,
): ContentContext {
  const paint = rolePaint(role, context);
  return {
    ...context,
    width: contentWidth(
      placement,
      context.style.contentSizing.widths[size].preferred,
      shape,
      context.style.padding,
    ),
    style: { ...context.style, text: paint.text, border: paint.stroke },
  };
}
/** Preferred token width is used only when there is no authored width override. */
function contentWidth(
  placement: Appearance['placement'],
  preferred: number,
  shape: VisualNode['shape'],
  padding: number,
): number {
  const width = placement?.width;
  if (width === undefined) return preferred;
  return insetWidth(width, shape, padding);
}
/** Inscribed diamond content has half the outer width; an impossibly small box retains a positive minimum. */
function insetWidth(width: number, shape: VisualNode['shape'], padding: number): number {
  const scale = shape === 'diamond' ? 2 : 1;
  return Math.max(1, width / scale - padding * 2);
}
/** Optional placement is copied explicitly so exact optional property semantics remain intact. */
function placedView(object: Appearance['object'], placement: Appearance['placement']): Appearance {
  const view: Appearance = { object, detail: 'full' };
  if (placement === undefined) return view;
  return { ...view, placement };
}

/** Derive one visible-body policy for sizing and final measurement. */
function visibleBody(object: DiagramObject, mode: Appearance['detail']): BodySelection {
  if (mode === 'full') return fullBody(object);
  if (mode === 'label') return { content: [], ports: [], complete: false };
  return summaryBody(object);
}
/** Summary shows the first content block, or the first port when content is absent. */
function summaryBody(object: DiagramObject): BodySelection {
  const first = object.content.slice(0, 1);
  if (first.length > 0) return { content: first, ports: [], complete: false };
  return { content: [], ports: object.ports.slice(0, 1), complete: false };
}
/** Canonical body selection retains every outline and addressable row. */
function fullBody(object: DiagramObject): BodySelection {
  return { content: object.content, ports: object.ports, complete: true };
}
/** Shared intrinsic sizing replaces duplicate node/group planning policy. */
function plannedContext(
  source: Pick<DiagramObject, 'label' | 'content'>,
  context: ContentContext,
  band: { readonly preferred: number; readonly maximum: number },
  explicit: boolean,
): ContentContext {
  const plan = planContent(source, context, band, explicit);
  return { ...context, width: plan.width };
}
