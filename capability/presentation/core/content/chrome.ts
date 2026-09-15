import type { ContentContext } from '../../contract/records/content-context.js';
import { chromeName, type ChromePolicy } from '../../contract/records/chrome.js';
import type { DiagramObject } from '../../contract/records/input.js';
/** Only module nodes opt into registered chrome measurement; unknown selectors retain card notation. */
export function moduleChrome(
  object: DiagramObject,
  context: ContentContext,
): ChromePolicy | undefined {
  if (object.kind !== 'module') return undefined;
  return context.chromePolicies?.[context.style.chrome ?? chromeName.parse('card')];
}
