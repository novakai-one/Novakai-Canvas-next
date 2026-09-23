import { it, expect } from 'vitest';
import { descendantId } from '@novakai/canvas-model';
import type { ContentBlock } from '@novakai/canvas-model';
import { contentName } from '../adapters/react/ContentEditor.js';
import { selectAndLocate } from '../adapters/react/ObjectOutline.js';
import type { OutlineView } from '../adapters/react/ObjectOutline.js';
import { sectionVisible } from '../adapters/react/WorkspaceSidePanel.js';
import { resetInterface } from '../adapters/react/InterfacePreferences.js';
import type { PanelPreferences } from '../contract/panel-types.js';
import type { PreferenceController } from '../contract/records/preferences.js';
import type { PanelController } from '../contract/panel-types.js';

/** Item 3: the Remove button reads the same label shown in the list, falling back to kind when none. */
function checkContentName(): void {
  const field: ContentBlock = {
    kind: 'field',
    id: descendantId.parse('field-a'),
    label: 'Account id',
    type: 'string',
    nullable: false,
  };
  const text: ContentBlock = {
    kind: 'text',
    id: descendantId.parse('text-a'),
    text: 'Some body copy',
    role: 'body',
  };
  const cases: readonly { readonly item: ContentBlock; readonly expected: string }[] = [
    { item: field, expected: 'Account id' },
    { item: text, expected: 'text' },
  ];
  for (const { item, expected } of cases) expect(contentName(item)).toBe(expected);
}

/** Item 6: clicking a browse row selects the object's node and re-centers the camera on it. */
function checkOutlineSelect(): void {
  function view(): { readonly view: OutlineView; readonly dispatched: unknown[] } {
    const dispatched: unknown[] = [];
    return {
      dispatched,
      view: {
        active: {
          session: {
            dispatch: (event) => {
              dispatched.push(event);
              return { ok: true, value: undefined };
            },
          },
          document: {
            scene: {
              sections: [
                {
                  id: 'main',
                  nodes: [
                    { id: 'node-1', measured: { objectId: 'object-1' } },
                    { id: 'node-2', measured: { objectId: null } },
                  ],
                },
              ],
            },
          },
        },
      },
    };
  }
  const found = view();
  selectAndLocate(found.view, 'object-1');
  const target = { kind: 'node', section: 'main', id: 'node-1' };
  expect(found.dispatched).toEqual([
    { kind: 'select', targets: [target], mode: 'replace' },
    { kind: 'locate', target },
  ]);
  const missing = view();
  selectAndLocate(missing.view, 'no-such-object');
  expect(missing.dispatched).toEqual([]);
}

/** Item 8: hiding a section removes its content everywhere, including while customizing panels. */
function checkHideCollections(): void {
  const base: PanelPreferences = {
    schemaVersion: 1,
    workspace: 'demo',
    sections: { left: ['collections'], right: [] },
    collapsed: [],
    hidden: [],
    widths: { left: 260, right: 320 },
    tabs: { left: 'browse', right: 'inspect' },
  };
  const cases: readonly { readonly hidden: readonly string[]; readonly expected: boolean }[] = [
    { hidden: [], expected: true },
    { hidden: ['collections'], expected: false },
    { hidden: ['sections'], expected: true },
  ];
  for (const { hidden, expected } of cases)
    expect(sectionVisible({ ...base, hidden }, 'collections')).toBe(expected);
}

/** Item 9: Settings reset restores personal preferences and clears the routing-roads toggle together. */
function checkResetClearsRoads(): void {
  const calls: string[] = [];
  const preferences: Pick<PreferenceController, 'reset'> = {
    reset: () => {
      calls.push('reset');
    },
  };
  const panels: Pick<PanelController, 'setInterfaceVisibility'> = {
    setInterfaceVisibility: (control, visible) => {
      calls.push(`${control}=${visible}`);
    },
  };
  resetInterface(preferences, panels);
  expect(calls).toEqual(['reset', 'roads=false']);
}

it('panel fixes: remove label, outline click selects, hide collections, reset clears roads', () => {
  checkContentName();
  checkOutlineSelect();
  checkHideCollections();
  checkResetClearsRoads();
});
