import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import RegrasEspeciaisPage from './page';

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

describe('RegrasEspeciaisPage', () => {
  it('castles kingside: the king and the rook both move', () => {
    const { container } = render(<RegrasEspeciaisPage />);
    const board = boardAt(container, 0); // Roque
    fireEvent.click(board.querySelector('[data-square="g1"]') as HTMLButtonElement);

    expect(pieceAt(board, 'g1')?.dataset.piece).toBe('wk');
    expect(pieceAt(board, 'f1')?.dataset.piece).toBe('wr');
    expect(pieceAt(board, 'e1')).toBeUndefined();
    expect(pieceAt(board, 'h1')).toBeUndefined();
  });

  it('captures en passant: the pawn lands on the target square, not the captured one', () => {
    const { container } = render(<RegrasEspeciaisPage />);
    const board = boardAt(container, 1); // En passant
    fireEvent.click(board.querySelector('[data-square="d6"]') as HTMLButtonElement);

    expect(pieceAt(board, 'd6')?.dataset.piece).toBe('wp');
    // The captured black pawn was on d5, not d6 — it fades out rather than
    // vanishing immediately (see ChessBoard.tsx's CAPTURE_FADE_MS), so
    // right after the click it's still in the DOM, just marked removing.
    expect(pieceAt(board, 'd5')?.dataset.removing).toBe('true');
    expect(pieceAt(board, 'e5')).toBeUndefined();
  });

  it('promotes a pawn reaching the last rank to a queen', () => {
    const { container } = render(<RegrasEspeciaisPage />);
    const board = boardAt(container, 2); // Promoção
    fireEvent.click(board.querySelector('[data-square="e8"]') as HTMLButtonElement);

    expect(pieceAt(board, 'e8')?.dataset.piece).toBe('wq');
    expect(pieceAt(board, 'e7')).toBeUndefined();
  });
});
