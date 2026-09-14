import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import type { FormatHandler, RenderInput } from '../../contract/ports/formats.js';
import type { RenderDependencies, PlacedSection } from '../../contract/render-types.js';
import type { Result } from '../../contract/errors.js';
import type { Encoded } from '../../contract/records/artifact.js';
/** Offline readers contain native navigation and details; no runtime script or remote dependency exists. */
export function createHtmlEncoder(deps: RenderDependencies, css: string): FormatHandler {
  /** SVG strings come only from the trusted shared renderer; authored content was already escaped there. */
  async function encode(input: RenderInput): Promise<Result<Encoded>> {
    const rendered = input.selection.sections.map((section) => renderSection(section, input));
    const failed = rendered.find((item) => !item.ok);
    if (failed && !failed.ok) return failed;
    const sections = rendered.flatMap((item) => (item.ok ? [item.value] : []));
    const markup = renderToStaticMarkup(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{input.snapshot.identity.title}</title>
          <style>{css}</style>
        </head>
        <body>
          <header>
            <h1>{input.snapshot.identity.title}</h1>
            <p>{`Revision ${input.snapshot.identity.revision}`}</p>
            <nav aria-label="Sections">
              {input.selection.sections.map((section, index) => (
                <a key={section.id} href={`#section-${index}`}>
                  {section.title.content.outline.join(' ')}
                </a>
              ))}
            </nav>
          </header>
          <main>{sections}</main>
        </body>
      </html>,
    );
    return {
      ok: true,
      value: { bytes: deps.encoding.utf8(`<!doctype html>${markup}`), pages: [], warnings: [] },
    };
  }
  /** Stable numeric anchors avoid turning authored IDs into browser navigation syntax. */
  function renderSection(section: PlacedSection, input: RenderInput): Result<ReactElement> {
    const result = deps.renderer.render({
      ...input,
      selection: { sections: [section], bounds: section.box },
    });
    if (!result.ok) return result;
    const index = input.selection.sections.indexOf(section);
    const lines = [
      ...section.nodes.flatMap((node) => node.measured.content.outline),
      ...section.wires.flatMap((wire) => [
        ...wire.measuredLabel.outline,
        `${wire.sourceMarker} → ${wire.targetMarker}`,
      ]),
      ...section.sequence.events.flatMap((event) => event.content.outline),
    ];
    return {
      ok: true,
      value: (
        <section key={section.id} id={`section-${index}`}>
          <h2>{section.title.content.outline.join(' ')}</h2>
          <div className="diagram" dangerouslySetInnerHTML={{ __html: result.value }} />
          <details>
            <summary>Read diagram contents</summary>
            <ul>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line}</li>
              ))}
            </ul>
          </details>
        </section>
      ),
    };
  }
  return { encode };
}
