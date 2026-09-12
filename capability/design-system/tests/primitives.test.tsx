// @vitest-environment jsdom
import { useState, type ReactElement } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { createReactBindings } from '../contract/index.js';
import { must } from './fixtures.js';
const bindings = must(await createReactBindings());
const { Button, Field, StatusMessage, Dialog, Menu, Tabs, Tooltip } = bindings;
afterEach(cleanup);
/** Controlled host state exercises primitive mechanics only; browser UX certification remains Part2. */
function DialogHost(): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Change theme"
      description="Preview the selected theme"
      trigger={<Button label="Open theme" />}
      portal={document.body}
    >
      <Button label="Apply theme" />
    </Dialog>
  );
}
/** State survives switching tabs only when the explicit retention option is enabled. */
function TabHost(): ReactElement {
  const [value, setValue] = useState('first');
  return (
    <Tabs
      label="Inspector"
      value={value}
      onValueChange={setValue}
      keepMounted
      items={[
        {
          id: 'first',
          label: 'Content',
          content: <input aria-label="Draft" defaultValue="Retained" />,
        },
        { id: 'second', label: 'Appearance', content: <p>Theme controls</p> },
      ]}
    />
  );
}
/** Menu actions remain host-owned and disabled actions cannot dispatch. */
function MenuHost({ onSelect }: { readonly onSelect: () => void }): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <Menu
      label="Collection actions"
      trigger={<Button label="Actions" />}
      open={open}
      onOpenChange={setOpen}
      portal={document.body}
      items={[
        { id: 'copy', label: 'Duplicate', onSelect },
        { id: 'delete', label: 'Delete', disabled: true, onSelect },
      ]}
    />
  );
}
describe('Design System native controls', () => {
  it('10 preserves action labels, blocks duplicate pending clicks, and associates field/status text', () => {
    const click = vi.fn();
    const view = render(<Button label="Save" pending onClick={click} />);
    const button = screen.getByRole('button', { name: /Save/ });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(true);
    fireEvent.click(button);
    expect(click).not.toHaveBeenCalled();
    view.rerender(<Button label="Save" onClick={click} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(click).toHaveBeenCalledTimes(1);
    render(
      <Field
        label="Collection name"
        help="A readable title"
        error="Enter a name"
        control={(props) => <input {...props} />}
      />,
    );
    const input = screen.getByLabelText('Collection name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
      'A readable title',
      'Enter a name',
    ]);
    render(
      <StatusMessage tone="error" label="Could not save">
        Keep your draft and retry.
      </StatusMessage>,
    );
    expect(screen.getByRole('alert').textContent).toContain('Could not save');
  });
  it('11 provides controlled dialog/menu/tab/tooltip keyboard behavior and stable component identity', async () => {
    const identity = bindings.Dialog;
    const view = render(<DialogHost />);
    const trigger = screen.getByRole('button', { name: 'Open theme' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Change theme' });
    expect(document.body.contains(dialog)).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(trigger);
    view.rerender(<DialogHost />);
    expect(bindings.Dialog).toBe(identity);
    cleanup();
    render(<TabHost />);
    const draft = screen.getByLabelText('Draft');
    fireEvent.change(draft, { target: { value: 'Unsaved text' } });
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Appearance' }), { button: 0 });
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Appearance' }), { key: 'Enter' });
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Appearance' }).getAttribute('aria-selected')).toBe(
        'true',
      ),
    );
    expect(document.body.contains(draft)).toBe(true);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Content' }), { button: 0 });
    expect(screen.getByLabelText('Draft').getAttribute('value')).toBe('Retained');
    expect(screen.getByLabelText('Draft') instanceof HTMLInputElement).toBe(true);
    expect(inputValue(screen.getByLabelText('Draft'))).toBe('Unsaved text');
    cleanup();
    const selected = vi.fn();
    render(<MenuHost onSelect={selected} />);
    const menuTrigger = screen.getByRole('button', { name: 'Actions' });
    menuTrigger.focus();
    fireEvent.keyDown(menuTrigger, { key: 'ArrowDown' });
    await screen.findByRole('menu');
    const disabled = screen.getByRole('menuitem', { name: 'Delete' });
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(disabled);
    expect(selected).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(selected).toHaveBeenCalledTimes(1);
    cleanup();
    render(
      <Tooltip label="Create a diagram" portal={document.body}>
        <Button label="Create" />
      </Tooltip>,
    );
    const tooltipTrigger = screen.getByRole('button', { name: 'Create' });
    fireEvent.focus(tooltipTrigger);
    await screen.findByRole('tooltip');
    expect(tooltipTrigger.getAttribute('aria-describedby')).toBeTruthy();
  });
});
/** DOM narrowing keeps assertions explicit without treating an arbitrary element as an input. */
function inputValue(element: HTMLElement): string {
  if (!(element instanceof HTMLInputElement)) throw new TypeError('Expected input fixture');
  return element.value;
}
