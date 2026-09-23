import { expect, it } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createAddTools } from '../adapters/react/AddTools.js';
import type { FeatureProps } from '../contract/react-types.js';
import type { CreationView } from '../contract/records/creation.js';

function Button({ label }: { readonly label: string }) {
  return createElement('button', null, label);
}
function Field({ control }: { readonly control: (field: object) => ReactElement }) {
  return control({});
}
const section = { id: 'process', mode: 'flow', title: 'Process', groups: [], appearances: [] };
function markup(creation: Partial<CreationView>, problem: unknown = null): string {
  const Tools = createAddTools({ Button, Field } as never);
  const view = {
    problem,
    active: { document: { collection: { sections: [section], objects: [] } } },
    creation: {
      diagram: { title: 'Plan', mode: 'grid' },
      object: {
        section: 'process',
        label: 'Parser',
        kind: 'module',
        reuseObject: null,
        group: null,
      },
      group: { section: 'process', title: 'Stage' },
      problem: null,
      busy: false,
      adding: null,
      ...creation,
    },
  } as unknown as FeatureProps['view'];
  const controller = {} as FeatureProps['controller'];
  return renderToStaticMarkup(createElement(Tools, { controller, view }));
}
const count = (text: string, part: string): number => text.split(part).length - 1;

it('only the form that sent the add says "Adding…"', () => {
  const html = markup({ busy: true, adding: 'object' });
  expect(count(html, 'Adding…')).toBe(1);
  expect(html).toContain('Add diagram');
  expect(html).toContain('Add group');
});

it('the form error hides only when the error bar shows the same problem', () => {
  const same = { code: 'invalid-input', message: 'Name taken' };
  const other = { code: 'invalid-input', message: 'Something else' };
  expect(markup({ problem: 'Name taken' }, same)).not.toContain('Name taken');
  expect(markup({ problem: 'Name taken' }, other)).toContain('Name taken');
});
