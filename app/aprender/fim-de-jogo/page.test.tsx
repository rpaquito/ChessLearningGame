import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import FimDeJogoPage from './page';

// Cada demo é o seu próprio tabuleiro completo (64 casas com os mesmos
// data-square em todas), por isso qualquer query tem de estar sempre
// isolada ao [role="grid"] certo — nunca ao `container` do documento
// inteiro, ou apanha-se por engano a mesma casa de outra demo.
function boardAt(container: HTMLElement, index: number): HTMLElement {
  return container.querySelectorAll<HTMLElement>('[role="grid"]')[index];
}

function pieceAt(board: HTMLElement, square: string) {
  return Array.from(board.querySelectorAll<HTMLElement>('[data-piece]')).find(
    (el) => el.dataset.square === square
  );
}

describe('FimDeJogoPage', () => {
  it('lets the checked king escape to a legal square', () => {
    const { container } = render(<FimDeJogoPage />);
    const board = boardAt(container, 0); // Xeque
    fireEvent.click(board.querySelector('[data-square="d7"]') as HTMLButtonElement);

    expect(pieceAt(board, 'd7')?.dataset.piece).toBe('bk');
    expect(pieceAt(board, 'e8')).toBeUndefined();
  });

  it('does nothing when clicking next to the mated king: there is no legal escape', () => {
    const { container } = render(<FimDeJogoPage />);
    const board = boardAt(container, 1); // Xeque-mate
    // f8 is adjacent to the king but not a legal target — checkmate means
    // every neighboring square is either occupied or attacked.
    fireEvent.click(board.querySelector('[data-square="f8"]') as HTMLButtonElement);

    expect(pieceAt(board, 'g8')?.dataset.piece).toBe('bk');
  });

  it('does nothing when clicking next to the stalemated king: no legal move either', () => {
    const { container } = render(<FimDeJogoPage />);
    const board = boardAt(container, 2); // Afogamento
    // g8 is adjacent to the king but not a legal target — stalemate means
    // no legal move exists anywhere, despite not being in check.
    fireEvent.click(board.querySelector('[data-square="g8"]') as HTMLButtonElement);

    expect(pieceAt(board, 'h8')?.dataset.piece).toBe('bk');
  });
});
