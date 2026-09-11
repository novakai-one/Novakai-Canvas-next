import { describe, it, expect } from 'vitest';
import { create, language, value, object, section, edit } from './fixtures.js';
import { erSource, modulesSource, sequenceSource, stateSource } from './engineering-fixtures.js';
describe('Language engineering notation', () => {
  it('2 — preserves scalar/composite keys, exact field endpoints and both ER cardinalities', () => {
    const result = create(erSource);
    expect(result.relationships[0]).toMatchObject({
      source: { object: 'customer', member: 'id' },
      target: { object: 'order', member: 'customer' },
      from: '1',
      to: '0..many',
      kind: 'association',
    });
    expect(object(result, 'order').content.at(-1)).toEqual({
      id: 'fk',
      kind: 'keygroup',
      key: 'foreign',
      fields: ['tenant', 'customer'],
      references: [
        { object: 'customer', member: 'tenant' },
        { object: 'customer', member: 'id' },
      ],
    });
    expect(section(result, 'data').layout.algorithm).toBe('layered');
    const edited = edit(result, 'set block @order.@mail references=@customer.@email');
    expect(object(edited, 'order').content.find((block) => block.id === 'mail')).toMatchObject({
      references: { object: 'customer', member: 'email' },
    });
    expect(
      create(value(language.print({ collection: result, scope: { kind: 'all' } })).source),
    ).toEqual(result);
  });
  it('3 — preserves typed module/function/interface compartments and independent provenance namespace', () => {
    const result = create(modulesSource);
    expect(object(result, 'spec').ports.map((port) => port.id)).toEqual(['plans', 'apply']);
    expect(result.sources[0]?.status).toBe('unverified');
    expect(object(result, 'validate').content[0]).toEqual({
      kind: 'signature',
      id: 'call',
      label: 'validateTransition',
      parameters: ['snapshot: Snapshot', 'intent: Intent'],
      returns: 'Result',
    });
    expect(result.relationships[0]?.sources).toEqual(['spec']);
    expect(result.relationships[0]?.source).toEqual({ object: 'spec', member: 'plans' });
    expect(
      create(value(language.print({ collection: result, scope: { kind: 'all' } })).source),
    ).toEqual(result);
  });
  it('7 — retains nested alt/opt/loop scope, stable branch IDs and ordered activation messages', () => {
    const result = create(sequenceSource);
    const items = section(result, 'conversation').sequence;
    expect(items.map((item) => item.id)).toEqual([
      'request',
      'alternatives',
      'repeat',
      'reply',
      'optional',
      'failure',
    ]);
    expect(items.find((item) => item.id === 'alternatives')).toMatchObject({
      operator: 'alt',
      branches: [
        { id: 'success', label: 'Success' },
        { id: 'alternatives-branch-2', label: 'Failure' },
      ],
    });
    expect(items.find((item) => item.id === 'reply')).toMatchObject({
      parent: 'repeat',
      activate: false,
      message: 'return',
    });
    const printed = value(language.print({ collection: result, scope: { kind: 'all' } })).source;
    expect(printed).toContain('branch @alternatives-branch-2 "Failure"');
    expect(create(printed)).toEqual(result);
  });
  it('8 — preserves state guards/effects and mixed story/grid section ordering', () => {
    const result = create(stateSource);
    expect(result.relationships.map((wire) => [wire.guard, wire.effect])).toEqual([
      ['ready', 'start work'],
      ['passed', 'record receipt'],
    ]);
    expect(result.sections.map((view) => [view.mode, view.order])).toEqual([
      ['state', 0],
      ['story', 2],
      ['grid', 3],
    ]);
    expect(section(result, 'story').appearances.map((item) => item.object)).toEqual([
      'working',
      'start',
      'done',
    ]);
    expect(
      create(value(language.print({ collection: result, scope: { kind: 'all' } })).source),
    ).toEqual(result);
  });
});
