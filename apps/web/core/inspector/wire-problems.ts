import type { Diagnostic } from '../../contract/errors.js';
import { failureSummary } from '../output/diagnostics.js';
/** Owner messages for wire records, restated for a person editing the wire in the inspector. */
const blank: readonly (readonly [string, string])[] = [
  ['Must be nonblank', 'The wire label is empty. Type a label or pick a function.'],
];
/** Messages only a relationship record produces, so they are safe to restate anywhere. */
const relationship: readonly (readonly [string, string])[] = [
  [
    'Calls target must address a signature or whole function',
    "A 'calls' wire must point at one function. Pick a function in Wire label.",
  ],
  [
    'Calls target must resolve to a signature',
    "A 'calls' wire must point at one function. Pick a function in Wire label.",
  ],
  [
    'Object kind is incompatible with relationship kind',
    'This relationship kind cannot connect these two kinds of object. Change the kind or an endpoint.',
  ],
  [
    'Endpoint must address a legal field/member/signature/port/row',
    'A wire cannot attach to that part of the object. Choose another endpoint.',
  ],
  [
    'Cardinalities are only valid for associations',
    "Only association wires have cardinalities. Set both to 'Not specified'.",
  ],
  ['Association requires both cardinalities', 'Association wires need both cardinalities set.'],
];
/** One plain sentence for a failed wire Apply; unknown causes fall back to the owner's own message. */
export function plainWireProblem(error: Diagnostic): string {
  const summary = failureSummary(error);
  const known = [...blank, ...relationship].find(([owner]) => summary.includes(owner));
  return known === undefined ? `The wire was not saved: ${summary}` : known[1];
}
/** The workspace problem bar restates relationship rejections; any other failure keeps its summary. */
export function plainRelationshipProblem(error: Diagnostic): string {
  const summary = failureSummary(error);
  return relationship.find(([owner]) => summary.includes(owner))?.[1] ?? summary;
}
