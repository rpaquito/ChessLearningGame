import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

const noop = () => {};

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmModal
        open={false}
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={noop}
        onCancel={noop}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the title, message and both buttons when open', () => {
    render(
      <ConfirmModal
        open
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={noop}
        onCancel={noop}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Reiniciar partida?' })).toBeInTheDocument();
    expect(screen.getByText('Vais perder o progresso desta partida.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reiniciar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={onConfirm}
        onCancel={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        open
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={noop}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when the backdrop is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        open
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={noop}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByTestId('confirm-modal-backdrop'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not call onCancel when the dialog panel itself is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        open
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={noop}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when Escape is pressed', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        open
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={noop}
        onCancel={onCancel}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('moves focus into the dialog when it opens', () => {
    render(
      <ConfirmModal
        open
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={noop}
        onCancel={noop}
      />
    );
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('renders above the toast layer via z-50, same as the other modals', () => {
    render(
      <ConfirmModal
        open
        title="Reiniciar partida?"
        message="Vais perder o progresso desta partida."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={noop}
        onCancel={noop}
      />
    );
    expect(screen.getByTestId('confirm-modal-backdrop').className).toContain('z-50');
  });
});
