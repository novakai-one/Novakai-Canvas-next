import { it, expect } from 'vitest';
import { fixture, collection, object, section, value } from './fixtures.js';
/** Symbol assertions use independently specified ER notation, not production lookup values. */
it('5 retains independently chosen crow-foot endpoints and required wire labels', () => {
  const app = fixture().presentation;
  const source = collection({
    objects: [object('Customer', 'entity'), object('Order', 'entity')],
    relationships: [
      {
        id: 'places',
        kind: 'association',
        label: 'places',
        source: { object: 'Customer' },
        target: { object: 'Order' },
        from: '1',
        to: '0..many',
      },
    ],
    sections: [section('er', ['Customer', 'Order'], { wires: [{ relationship: 'places' }] })],
  });
  const wire = value(app.project(source)).sections[0]?.wires[0];
  expect(wire).toMatchObject({
    sourceMarker: 'one',
    targetMarker: 'zero-many',
    kind: 'association',
  });
  expect(wire?.label.outline).toEqual(['places']);
  const paint = { fill: '#ffffff', stroke: '#000000', text: '#000000' };
  const one = value(app.marker('one', paint));
  expect(one.match(/<path/g) ?? []).toHaveLength(2);
  expect(one).not.toContain('<circle');
  const optional = value(app.marker('zero-one', paint));
  expect(optional.match(/<path/g) ?? []).toHaveLength(1);
  expect(optional.match(/<circle/g) ?? []).toHaveLength(1);
  const many = value(app.marker('one-many', paint));
  expect(many).toContain('M 0 -6 L -12 0 L 0 6 M -12 0 L 0 0');
  expect(many.match(/<path/g) ?? []).toHaveLength(2);
  const zeroMany = value(app.marker('zero-many', paint));
  expect(zeroMany).toContain('<circle');
  expect(zeroMany).toContain('M 0 -6');
  expect(app.marker('invented', paint)).toMatchObject({ ok: false });
});
