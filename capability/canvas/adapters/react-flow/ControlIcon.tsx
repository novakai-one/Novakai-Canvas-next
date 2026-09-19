import type { ReactElement } from 'react';
import type { ControlIconName, ControlIconProps } from '../../contract/react-types.js';
/** Original geometric control symbols stay independent of font glyphs and inherit the accessible button's color. */
const paths: Readonly<Record<ControlIconName, string>> = {
  select: 'M5 3v17l5-5 4 6 3-2-4-6 7-1Z',
  hand: 'M8 12V6a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v8c0 4-3 6-6 6h-2c-3 0-4-2-6-4l-3-4a2 2 0 0 1 3-3l2 2',
  connect: 'M3 3h6v6H3ZM15 15h6v6h-6ZM9 6h6v12',
  minus: 'M5 12h14',
  plus: 'M5 12h14M12 5v14',
  outline: 'M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1',
  fit: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8Z',
  reading: 'M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15',
  previous: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
};
/** Button supplies the name; decorative SVG never adds a competing accessibility label. */
export function ControlIcon({ name }: ControlIconProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
