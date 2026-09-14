// @vitest-environment jsdom
import { useState, type ReactElement } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createReactBindings, createScopeInstaller } from '../contract/index.js';
import { must, rejected, ui, preferences } from './fixtures.js';
const {
  Button,
  SidePanel,
  PanelHeader,
  PanelBody,
  PanelBodyHeader,
  PanelSection,
  PanelSectionHeader,
  createScopeTarget,
} = must(await createReactBindings());
afterEach(cleanup);
/** Host slots own order and collapse; component state must not reset when sections move. */
function PanelsHost(): ReactElement {
  const [expanded, setExpanded] = useState(true);
  const [order, setOrder] = useState(['content', 'theme']);
  return (
    <SidePanel
      id="inspector"
      label="Inspector"
      side="right"
      width={320}
      minimum={280}
      maximum={420}
      onResize={() => {}}
      header={<PanelHeader title="Inspector" />}
      body={
        <PanelBody header={<PanelBodyHeader title="Selected module" scope="One object" />}>
          {order.map((id) => (
            <PanelSection
              key={id}
              id={id}
              expanded={id === 'content' ? expanded : true}
              header={
                <PanelSectionHeader
                  id={id}
                  title={id}
                  expanded={id === 'content' ? expanded : true}
                  onExpandedChange={setExpanded}
                  actions={
                    <Button label={'Move ' + id} onClick={() => setOrder([...order].reverse())} />
                  }
                />
              }
            >
              <input aria-label={id + ' draft'} defaultValue={id} />
            </PanelSection>
          ))}
        </PanelBody>
      }
    />
  );
}
describe('Design System panels and scopes', () => {
  it('12 composes independent header/body/context/section slots and retains drafts across collapse/reorder', () => {
    render(<PanelsHost />);
    expect(screen.getByRole('heading', { name: 'Inspector' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Selected module' })).toBeTruthy();
    const draft = screen.getByLabelText('content draft');
    fireEvent.change(draft, { target: { value: 'Unsaved' } });
    const toggle = screen.getByRole('button', { name: 'content' });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('content-body')?.hidden).toBe(true);
    expect(document.body.contains(draft)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Move content' }));
    expect(
      [...document.querySelectorAll('[data-section-id]')].map((element) =>
        element.getAttribute('data-section-id'),
      ),
    ).toEqual(['theme', 'content']);
    fireEvent.click(toggle);
    const reopenedDraft = screen.getByLabelText('content draft');
    expect(reopenedDraft).toBe(draft);
    expect(document.body.contains(reopenedDraft)).toBe(true);
    expect(inputValue(reopenedDraft)).toBe('Unsaved');
    expect(toggle.querySelector('button')).toBeNull();
  });
  it('13 exposes bounded keyboard resizing and atomically installs complete portal scopes with generation-safe cleanup', () => {
    const resize = vi.fn();
    render(
      <SidePanel
        id="left"
        label="Library"
        side="left"
        width={248}
        minimum={208}
        maximum={360}
        onResize={resize}
        header={<PanelHeader title="Library" />}
        body={<PanelBody>Collections</PanelBody>}
      />,
    );
    const separator = screen.getByRole('separator', { name: 'Resize Library' });
    expect(separator.getAttribute('aria-valuenow')).toBe('248');
    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    expect(resize).toHaveBeenLastCalledWith(249);
    fireEvent.keyDown(separator, { key: 'End' });
    expect(resize).toHaveBeenLastCalledWith(360);
    const element = document.createElement('div');
    const portal = document.createElement('div');
    element.style.left = '25px';
    const installer = must(createScopeInstaller(createScopeTarget(element)));
    const portalInstaller = must(createScopeInstaller(createScopeTarget(portal)));
    const first = must(ui());
    const lease = must(installer.install(first));
    must(portalInstaller.install(first));
    expect(element.style.getPropertyValue('--nv-space-2')).toBe('8px');
    expect(portal.style.getPropertyValue('--nv-space-2')).toBe('8px');
    expect(element.style.left).toBe('25px');
    const second = must(ui({ preferences: { ...preferences, density: 'spacious' } }));
    const newer = must(installer.install(second));
    expect(must(lease.cleanup()).restored).toBe(false);
    expect(element.style.getPropertyValue('--nv-space-2')).toBe('12px');
    const before = element.style.cssText;
    rejected(
      installer.install({
        ...second,
        css: { ...second.css, '--nv-color-panel': 'red; padding:100px' },
      }),
    );
    expect(element.style.cssText).toBe(before);
    expect(must(newer.cleanup()).restored).toBe(true);
    expect(element.style.getPropertyValue('--nv-space-2')).toBe('8px');
    expect(element.style.left).toBe('25px');
    const initialScope = element.style.cssText;
    const replaceable = must(installer.install(first));
    const replacement = must(replaceable.replace(second));
    expect(replaceable.replace(first).ok).toBe(false);
    expect(must(replaceable.cleanup()).restored).toBe(false);
    expect(element.style.getPropertyValue('--nv-space-2')).toBe('12px');
    expect(replacement.replace({ ...second, css: {} }).ok).toBe(false);
    expect(element.style.getPropertyValue('--nv-space-2')).toBe('12px');
    expect(must(replacement.cleanup()).restored).toBe(true);
    expect(element.style.getPropertyValue('--nv-space-2')).toBe('8px');
    expect(element.style.left).toBe('25px');
    expect(initialScope).toContain('left: 25px');
  });
});
/** Test boundary narrows real DOM input before checking retained value. */
function inputValue(element: HTMLElement): string {
  if (!(element instanceof HTMLInputElement)) throw new TypeError('Expected input fixture');
  return element.value;
}
