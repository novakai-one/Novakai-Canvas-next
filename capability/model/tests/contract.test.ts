import { expect, test } from 'vitest';
import { plan, validate, objectId, type ObjectId, type SectionId } from '../contract/index.js';
import { base, graph, node, objectAt, value } from './fixtures.js';
test('return detached immutable replayable results', () => {
  const input = graph();
  const before = structuredClone(input);
  const first = value(validate(input));
  expect(Object.isFrozen(first)).toBe(true);
  expect(Object.isFrozen(first.objects)).toBe(true);
  expect(Object.isFrozen(first.objects[0])).toBe(true);
  expect(first.objects).not.toBe(Reflect.get(input, 'objects'));
  expect(input).toEqual(before);
  const changes = [
    { op: 'replace', target: 'objects', value: node('a', 'step', { label: 'Edited' }) },
  ];
  const one = plan(input, changes);
  const two = plan(input, changes);
  expect(one).toEqual(two);
  expect(input).toEqual(before);
  expect(Object.isFrozen(one)).toBe(true);
  Reflect.set(changes[0]?.value ?? {}, 'label', 'Later');
  expect(objectAt(value(one).candidate, 'a').label).toBe('Edited');
  const identity = objectId.parse('same');
  const acceptsObject = (id: ObjectId) => id;
  expect(acceptsObject(identity)).toBe('same');
  // @ts-expect-error SectionId must not be assignable to ObjectId.
  const wrong: SectionId = identity;
  void wrong;
});
test('serve UI and language consumers equally', () => {
  const snapshot = base();
  const uiIntent = [
    {
      op: 'create',
      target: 'objects',
      value: {
        id: 'step',
        kind: 'step',
        label: 'Explain the concept',
        role: 'neutral',
        size: 'medium',
        ports: [],
        sources: [],
        content: [{ kind: 'text', id: 'detail', text: 'One shared diagram object' }],
      },
    },
  ];
  const loweredLanguageIntent = [
    {
      op: 'create',
      target: 'objects',
      value: {
        id: 'step',
        kind: 'step',
        label: 'Explain the concept',
        content: [{ kind: 'text', id: 'detail', text: 'One shared diagram object' }],
      },
    },
  ];
  const ui = value(plan(snapshot, uiIntent));
  const language = value(plan(snapshot, loweredLanguageIntent));
  expect(ui).toEqual(language);
  expect(ui.candidate.objects[0]).toMatchObject({
    id: 'step',
    label: 'Explain the concept',
    content: [{ kind: 'text', id: 'detail', text: 'One shared diagram object' }],
  });
  expect(ui.impact).toEqual([{ target: 'objects', id: 'step', action: 'added' }]);
});
