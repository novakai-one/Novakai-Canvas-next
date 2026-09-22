import type { ChangeEntry, ContentBlock } from '../../contract/records/input.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { ContentContext } from '../../contract/records/content-context.js';
import { changeBadge } from '../notation/annotations.js';
import { offset } from './text.js';

const memberRows: readonly ContentBlock['kind'][] = ['field', 'signature', 'member'];

/** A member change entry (`changed @Order.@total`) badges that row on its right edge. */
export function withMemberChange(
  block: ContentBlock,
  row: MeasuredContent,
  context: ContentContext,
): MeasuredContent {
  const status = memberStatus(block, context);
  if (status === undefined) return row;
  const badge = changeBadge(status, context);
  const x = row.width + context.style.gap;
  const placed = offset(badge, x, (row.height - badge.height) / 2);
  return {
    ...row,
    width: x + badge.width,
    primitives: [...row.primitives, ...placed.primitives],
  };
}

function memberStatus(
  block: ContentBlock,
  context: ContentContext,
): ChangeEntry['status'] | undefined {
  const owner = context.owner;
  if (owner === undefined || !memberRows.includes(block.kind)) return undefined;
  return context.collection.changes
    .flatMap((item) => item.entries)
    .find(
      (entry) =>
        entry.target.kind === 'object' &&
        entry.target.object === owner.id &&
        entry.target.member === block.id,
    )?.status;
}
