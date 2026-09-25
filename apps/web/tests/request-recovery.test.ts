import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequestRecovery } from '../adapters/react/RequestRecovery.js';
import type { FeatureProps } from '../contract/react-types.js';
import type { Submission } from '../contract/records/submission.js';

function Button({ label }: { readonly label: string }) {
  return createElement('button', null, label);
}
function submission(
  id: string,
  state: Submission['state'],
): Submission {
  return { state, request: { request: id } } as unknown as Submission;
}
function markup(
  pending: readonly Submission[],
  problem: unknown,
): string {
  const Recovery = createRequestRecovery({ Button } as never);
  const view = { pending, problem } as unknown as FeatureProps['view'];
  const controller = {} as FeatureProps['controller'];
  return renderToStaticMarkup(createElement(Recovery, { controller, view }));
}
const count = (text: string, part: string): number => text.split(part).length - 1;

it('keeps Check/Retry for every unsettled request, not only the newest', () => {
  const html = markup(
    [submission('a', 'uncertain'), submission('b', 'retryable'), submission('c', 'sending')],
    null,
  );
  expect(count(html, 'Check save status')).toBe(3);
  expect(count(html, 'Retry same edit')).toBe(3);
});

it('shows no second bar for a refusal the error bar already shows', () => {
  const refused = [submission('a', 'uncertain'), submission('b', 'rejected')];
  const html = markup(refused, { code: 'invalid-input', message: 'x' });
  expect(html).not.toContain('Edit not applied');
  expect(count(html, 'Check save status')).toBe(1);
  expect(markup(refused, null)).toContain('Dismiss refused edit');
});
