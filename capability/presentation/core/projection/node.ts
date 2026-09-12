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
/** Scene identities are section-scoped and distinguish an object appearance from a container. */
export function identity(section: string, kind: 'object' | 'group', id: string): VisualNode['id'] {
  return parse(sceneId, `${section}:${kind}:${id}`);
}
/** Labels share the same pinned typography as body content. */
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
interface BodyContent {
  readonly full: MeasuredContent;
  readonly summary: MeasuredContent;
}
/** Measure each canonical block once; retain the complete first block for summary mode. */
function body(object: DiagramObject, context: ContentContext): BodyContent {
  const scoped = { ...context, fields: fieldColumns(object.content, context) };
  const blocks = [
    ...object.content.map((block) => measureBlock(block, scoped)),
    ...object.ports.map((port) => portContent(port, context)),
  ];
  return { full: stack(blocks, context.style.gap), summary: blocks[0] ?? emptyContent() };
}
/** Empty body is explicit zero geometry, not an invisible line occupying height. */
function emptyContent(): MeasuredContent {
  return { width: 0, height: 0, primitives: [], anchors: [], outline: [] };
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
/** Detail changes visible content only; every canonical row remains in the accessible outline. */
function detail(content: BodyContent, mode: Appearance['detail']): MeasuredContent {
  if (mode === 'full') return content.full;
  return compact(content, mode);
}
/** Summary uses the complete measured first block, including table cells or media. */
function compact(content: BodyContent, mode: Appearance['detail']): MeasuredContent {
  const visible = mode === 'summary' ? content.summary : emptyContent();
  return {
    ...visible,
    anchors: content.full.anchors.map((anchor) => visibleAnchor(anchor, visible)),
    outline: content.full.outline,
  };
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
  const initial = appearanceContext(view, role, size, shape, context);
  const plan = planContent(
    { ...source, content: visibleBlocks(source.content, view.detail) },
    initial,
    context.style.contentSizing.widths[size],
    view.placement?.width !== undefined,
  );
  const scoped = { ...initial, width: plan.width };
  const heading = labelContent(source.label, scoped, 'nodeHeading');
  const measured = stack(
    [heading, detail(body(source, scoped), view.detail)],
    headingGap(shape, context),
  );
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
  const plan = planContent(
    { label: group.title, content: [] },
    initial,
    context.style.contentSizing.widths.medium,
    group.placement?.width !== undefined,
  );
  const scoped = { ...initial, width: plan.width };
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

/** Compact detail preserves its prior visible-width policy while full canonical content remains in the outline. */
function visibleBlocks(
  blocks: readonly ContentBlock[],
  mode: Appearance['detail'],
): readonly ContentBlock[] {
  if (mode === 'full') return blocks;
  return mode === 'summary' ? blocks.slice(0, 1) : [];
}
