import { chromeOutline, type ChromeOutline } from '../../contract/records/chrome.js';
/** Parametric folder outline stays within measured bounds; token metrics own the raised tab. */
export function folderPath(
  width: number,
  height: number,
  tabWidth: number,
  tabHeight: number,
): ChromeOutline {
  return chromeOutline.parse(
    `M0 0 H${tabWidth} L${tabWidth + tabHeight} ${tabHeight} H${width} V${height} H0 Z`,
  );
}
