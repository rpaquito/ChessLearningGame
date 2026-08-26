import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PecasPage from './page';

// As demos são jogáveis desde 2026-08-26 (a pedido do utilizador) — cada
// uma mantém o próprio estado e usa chess.js para validar/aplicar o
// lance clicado, mas só a peça em destaque de cada demo se move (não é
// uma partida real com duas peças a jogar).
describe('PecasPage', () => {
  it('moves the demo piece when a legal target square is clicked', () => {
    const { container } = render(<PecasPage />);
    // Demo do peão: e2 -> e3 é um lance legal.
    const target = container.querySelector('[data-square="e3"]') as HTMLButtonElement;
    fireEvent.click(target);

    const pieceAtE3 = Array.from(container.querySelectorAll<HTMLElement>('[data-piece]')).find(
      (el) => el.dataset.square === 'e3'
    );
    expect(pieceAtE3?.dataset.piece).toBe('wp');
    const pieceAtE2 = Array.from(container.querySelectorAll<HTMLElement>('[data-piece]')).find(
      (el) => el.dataset.square === 'e2'
    );
    expect(pieceAtE2).toBeUndefined();
  });

  it('does nothing when an illegal square is clicked', () => {
    const { container } = render(<PecasPage />);
    // e2 não pode ir para h5 — clique deve ser ignorado.
    const target = container.querySelector('[data-square="h5"]') as HTMLButtonElement;
    fireEvent.click(target);

    const pieceAtE2 = Array.from(container.querySelectorAll<HTMLElement>('[data-piece]')).find(
      (el) => el.dataset.square === 'e2'
    );
    expect(pieceAtE2?.dataset.piece).toBe('wp');
  });

  it('recomputes legal targets from the piece\'s new square after it moves', () => {
    const { container } = render(<PecasPage />);
    fireEvent.click(container.querySelector('[data-square="e3"]') as HTMLButtonElement);

    // Depois de e2->e3, o peão só pode andar mais uma casa (e4) — já não
    // pode "saltar" duas como no primeiro lance.
    const e4 = container.querySelector('[data-square="e4"]') as HTMLButtonElement;
    fireEvent.click(e4);
    const pieceAtE4 = Array.from(container.querySelectorAll<HTMLElement>('[data-piece]')).find(
      (el) => el.dataset.square === 'e4'
    );
    expect(pieceAtE4?.dataset.piece).toBe('wp');
  });

  it('resets a demo back to its starting position', () => {
    const { container } = render(<PecasPage />);
    fireEvent.click(container.querySelector('[data-square="e3"]') as HTMLButtonElement);

    const resetButtons = screen.getAllByRole('button', { name: 'Reiniciar' });
    fireEvent.click(resetButtons[0]);

    const pieceAtE2 = Array.from(container.querySelectorAll<HTMLElement>('[data-piece]')).find(
      (el) => el.dataset.square === 'e2'
    );
    expect(pieceAtE2?.dataset.piece).toBe('wp');
  });
});
