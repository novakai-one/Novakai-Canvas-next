import { derivation } from '../../contract/records/derivation.js';
import type { CheckedInspectionRequest } from './input.js';
import { parse, reject } from './outcomes.js';
import { same } from './facts.js';
/** Transported root keys must describe these admitted inputs, not merely be nonempty strings. */
export function inspectDerivation(
  request: CheckedInspectionRequest,
  engines: readonly string[],
): void {
  const key = parse(derivation, decodeKey(request.candidate.inputKey));
  same(request.projection, key.projection, 'inputKey.projection');
  same(request.measurements, key.measurements, 'inputKey.measurements');
  same(request.options, key.options, 'inputKey.options');
  same(engines, key.engines, 'inputKey.engines');
}
/** Malformed keys are input rejection, never classified as a native solver failure. */
function decodeKey(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return reject('invalid-input', 'inputKey', 'Derivation key is not valid encoded input');
  }
}
