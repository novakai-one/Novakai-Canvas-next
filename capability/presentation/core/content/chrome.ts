import type { ContentContext } from '../../contract/records/content-context.js';
import { CARD_CHROME, type ChromePolicy } from '../../contract/records/chrome.js';
import type { DiagramObject } from '../../contract/records/input.js';
/** Only module nodes opt into registered chrome measurement; unknown selectors retain card notation. */
export function moduleChrome(
  object: DiagramObject,
  context: ContentContext,
): ChromePolicy | undefined {
  if (object.kind !== 'module') return undefined;
  const policies = context.chromePolicies ?? {};
  const name = context.style.chrome ?? CARD_CHROME;
  if (!Object.hasOwn(policies, name)) return undefined;
  return policies[name];
}
