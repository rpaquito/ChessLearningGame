import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders an always-mounted empty wrapper when toast is null', () => {
    render(<Toast toast={null} onDismiss={() => {}} />);
    // O wrapper role="status" fica sempre montado (ver Toast.tsx) — o que
    // não existe sem toast é o cartão visual/mensagem/botão lá dentro.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('toast-card')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
  });

  it('renders the message when a toast is given', () => {
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Xeque!');
  });

  it('applies a gold accent for the "check" tone', () => {
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={() => {}} />);
    expect(screen.getByTestId('toast-card').className).toContain('border-gold');
  });

  it('applies a cyan accent for the "info" tone', () => {
    render(<Toast toast={{ id: 1, message: 'Tema alterado.', tone: 'info' }} onDismiss={() => {}} />);
    expect(screen.getByTestId('toast-card').className).toContain('border-cyan');
  });

  it('calls onDismiss when the close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders above modal backdrops via z-[60]', () => {
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status').className).toContain('z-[60]');
  });

  it('remounts the message subtree (fresh key) when shown again with identical text', () => {
    const { rerender } = render(
      <Toast toast={{ id: 1, message: 'Dificuldade por omissão alterada.', tone: 'info' }} onDismiss={() => {}} />
    );
    const firstCard = screen.getByTestId('toast-card');

    rerender(
      <Toast toast={{ id: 2, message: 'Dificuldade por omissão alterada.', tone: 'info' }} onDismiss={() => {}} />
    );
    const secondCard = screen.getByTestId('toast-card');

    // Mesma mensagem, mas `id` novo — React tem de remontar a subárvore
    // (key diferente), não apenas atualizar o texto no lugar. Isto é o
    // que garante o reanúncio a leitores de ecrã na segunda chamada.
    expect(secondCard).not.toBe(firstCard);
    expect(secondCard).toHaveTextContent('Dificuldade por omissão alterada.');
  });
});
