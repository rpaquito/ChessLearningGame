import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

function Panel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useFocusTrap(open);
  if (!open) return null;
  return (
    <div ref={panelRef} tabIndex={-1} data-testid="panel">
      <button type="button" onClick={onClose}>
        Fechar
      </button>
      <button type="button">Primeiro</button>
      <button type="button">Último</button>
    </div>
  );
}

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <Panel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

describe('useFocusTrap', () => {
  it('moves focus to the panel itself when it opens', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(document.activeElement).toBe(screen.getByTestId('panel'));
  });

  it('wraps Tab from the last focusable element back to the first', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const last = screen.getByRole('button', { name: 'Último' });
    last.focus();
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar' }));
  });

  it('wraps Shift+Tab from the first focusable element back to the last', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const first = screen.getByRole('button', { name: 'Fechar' });
    first.focus();
    fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Último' }));
  });

  it('restores focus to the element that was focused before opening', () => {
    render(<Harness />);
    const openButton = screen.getByRole('button', { name: 'Abrir' });
    openButton.focus();
    fireEvent.click(openButton);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(document.activeElement).toBe(openButton);
  });
});
