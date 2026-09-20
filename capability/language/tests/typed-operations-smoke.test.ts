import { describe, expect, it } from 'vitest';
import { create, language, pins, value, rejected } from './fixtures.js';

describe('typed operation compatibility', () => {
  it('round-trips mixed signature types and sequence operation references', () => {
    const source = `canvas 1 collection @typed "Typed" {
      type @actor "Actor" = "Human" | "Agent"
      type @result "Result" = "Done" | "Failed"
      node @human participant "Human" {}
      node @movement module "Movement" {
        signature @move "move" parameters=[["subject", @actor], ["trace", "Trace"], "legacy: string"] returns=@result
        member @status "status" type=@result
      }
      section @sequence "Sequence" mode=sequence {
        show @human @movement
        event @request @human -> @movement "Move" kind=call operation=@movement.@move
      }
    }`;
    const collection = create(source);
    const readout = create(source);
    const signature = collection.objects
      .find((item) => item.id === 'movement')
      ?.content.find((item) => item.kind === 'signature');
    expect(signature).toMatchObject({ returns: { kind: 'definition', id: 'result' } });
    expect(readout.sections[0]?.sequence[0]).toMatchObject({
      operation: { object: 'movement', member: 'move' },
    });
    const printed = value(language.print({ collection, scope: { kind: 'all' } })).source;
    expect(printed).toContain(
      'parameters=[["subject", @actor], ["trace", "Trace"], "legacy: string"]',
    );
    expect(printed).toContain('operation=@movement.@move');
    rejected(
      language.lower({
        source: source.replace('operation=@movement.@move', 'operation=@human.@move'),
        mode: 'create',
        snapshot: null,
        resources: pins(collection),
      }),
      'domain',
    );
  });
});
